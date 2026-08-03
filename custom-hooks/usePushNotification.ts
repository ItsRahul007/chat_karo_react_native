import { resetUnreadInCache } from "@/controller/socket.controller";
import {
  dismissConversationNotifications,
  ensureMessageNotificationCategory,
  getActiveConversationId,
  MessageNotificationAction,
  MessageNotificationData,
  readNotificationData,
} from "@/util/messageNotifications";
import { handleMessagePush } from "@/util/backgroundMessageTask";
import { supportsMessageThreads } from "@/util/messageThreadNotifications";
import { QueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

interface I_PushNotification {
  notification?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
}

/**
 * Actions triggered from a message notification's buttons. Supplied by the
 * caller (SocketContext) because sending a reply needs the socket and the
 * logged-in user, neither of which this hook has access to.
 */
export interface PushNotificationHandlers {
  onReply?: (params: {
    conversationId: string;
    chatWithId?: string;
    isCommunity: boolean;
    text: string;
  }) => Promise<void> | void;
  onMarkAsRead?: (params: {
    conversationId: string;
    isCommunity: boolean;
  }) => Promise<void> | void;
}

/*
 * A push that arrives for the chat that's currently open is folded straight
 * into the thread by the socket listeners — showing a banner on top of it would
 * just cover the message the user is already reading.
 *
 * On Android a message push is re-rendered as a notifee thread notification, so
 * expo's own banner is suppressed to avoid showing both.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = readNotificationData(notification.request.content.data);
    const isMessage = !!data.conversationId;
    const isActiveChat =
      isMessage &&
      data.conversationId!.toString() === getActiveConversationId();

    const suppress =
      isActiveChat || (isMessage && supportsMessageThreads);

    return {
      shouldPlaySound: !suppress,
      shouldSetBadge: false,
      shouldShowBanner: !suppress,
      shouldShowList: !suppress,
    };
  },
});

/*
 * Guards against one event being handled twice (which, for the Reply action,
 * would send the message twice) if a second instance of this hook is ever
 * mounted alongside the one in SocketProvider.
 *
 * Keyed on the response object itself, deliberately: Android keeps a
 * direct-reply notification alive so the user can fire several replies from it,
 * and consecutive pushes to the same chat can reuse a notification identifier.
 * Anything derived from (identifier, actionIdentifier) would treat those later
 * replies as repeats and drop them.
 */
const handledResponses = new WeakSet<Notifications.NotificationResponse>();

const markResponseHandled = (response: Notifications.NotificationResponse) => {
  if (handledResponses.has(response)) return false;
  handledResponses.add(response);
  return true;
};

const usePushNotification = (
  queryClient: QueryClient,
  handlers?: PushNotificationHandlers,
): I_PushNotification => {
  const router = useRouter();

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);

  // Handlers are re-created on every render; keep the latest in a ref so the
  // listener effect stays mounted for the lifetime of the hook.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const registerPushNotification = async (): Promise<
    Notifications.ExpoPushToken | undefined
  > => {
    let token;

    try {
      if (!Device.isDevice) {
        throw new Error("Must use physical device for Push Notifications");
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // do not force user to grant user for notifications, leave it as a choice
      if (finalStatus !== "granted") {
        throw new Error("Failed to get push token for push notification!");
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (projectId) {
        try {
          token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
        } catch (error) {
          console.log("Error getting push token:", error);
        }
      } else {
        console.log("No Project ID found, skipping push token registration");
      }

      if (Platform.OS == "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          lightColor: "#FF0000",
        });
      }
    } catch (error) {
      console.log("Error getting push token:", error);
    } finally {
      return token;
    }
  };

  const markRead = (conversationId: string) =>
    resetUnreadInCache(queryClient, conversationId);

  const openConversation = (data: MessageNotificationData) => {
    const conversationId = data.conversationId!.toString();
    markRead(conversationId);
    // The chat screen dismisses the rest of the conversation's notifications on
    // mount, but do it here too so the tray clears even if navigation is slow.
    dismissConversationNotifications(conversationId);
    // Community chats have no single counterpart — the screen resolves the
    // profile from the conversation id instead, so leave chatWithId off.
    const params = [`isCommunity=${data.isCommunity === true}`];
    if (data.chatWithId) params.push(`chatWithId=${data.chatWithId}`);

    router.navigate(`/chat/${conversationId}?${params.join("&")}` as any);
  };

  const handleResponse = async (
    response: Notifications.NotificationResponse,
  ) => {
    if (!markResponseHandled(response)) return;

    const data = readNotificationData(response.notification.request.content.data);
    const conversationId = data.conversationId?.toString();
    const isCommunity = data.isCommunity === true;

    // ─── Reply ───────────────────────────────────────────────────
    if (
      response.actionIdentifier === MessageNotificationAction.reply &&
      conversationId
    ) {
      const text = (response.userText ?? "").trim();
      if (!text) return;

      markRead(conversationId);
      /*
       * Deliberately left in the tray. Android keeps a direct-reply
       * notification alive so you can carry on a short back-and-forth without
       * opening the app — dismissing here would cut that off after one message.
       * It clears when the chat is opened or "Mark as read" is pressed.
       */
      await handlersRef.current?.onReply?.({
        conversationId,
        chatWithId: data.chatWithId?.toString(),
        isCommunity,
        text,
      });
      return;
    }

    // ─── Mark as read ────────────────────────────────────────────
    if (
      response.actionIdentifier === MessageNotificationAction.markAsRead &&
      conversationId
    ) {
      markRead(conversationId);
      await handlersRef.current?.onMarkAsRead?.({
        conversationId,
        isCommunity,
      });
      await dismissConversationNotifications(conversationId);
      return;
    }

    // ─── Body tap (default action) ───────────────────────────────
    if (conversationId) {
      openConversation(data);
    } else if (data.url) {
      router.navigate(data.url as any);
    }
  };

  useEffect(() => {
    ensureMessageNotificationCategory();
    registerPushNotification().then((token) => setExpoPushToken(token));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);

        const { content, identifier } = notification.request;
        const data = readNotificationData(content.data);

        /*
         * The handler above already suppresses the banner for the chat that's
         * open, but a suppressed notification is still delivered — drop it so
         * an open conversation never accumulates unread banners.
         */
        if (
          data.conversationId &&
          data.conversationId.toString() === getActiveConversationId()
        ) {
          Notifications.dismissNotificationAsync(identifier).catch(() => {});
          return;
        }

        /*
         * Foreground pushes go through the same rebuild as background ones.
         * The background task also fires here, so both paths can run for one
         * message — addMessageToThread dedupes on the message id.
         */
        if (supportsMessageThreads && data.conversationId) {
          handleMessagePush({
            title: content.title ?? undefined,
            message: content.body ?? undefined,
            dataString: JSON.stringify(content.data ?? {}),
            tag: identifier,
          }).catch((error) =>
            console.log("Error rebuilding foreground notification:", error),
          );
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleResponse(response).catch((error) =>
          console.log("Error handling notification response:", error),
        );
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { notification, expoPushToken };
};

export { I_PushNotification, usePushNotification };
