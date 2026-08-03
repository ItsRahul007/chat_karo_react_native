import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { clearMessageThread } from "./messageThreadNotifications";

/**
 * Message-notification plumbing: the interactive category (Reply / Mark as
 * read), the Android channel they're delivered on, and the helpers used to
 * clear a conversation's notifications once it has been read.
 *
 * Call notifications are handled separately by notifee (see callNotifications.ts) —
 * remote message pushes come through Expo's push service, so they use
 * expo-notifications' category API instead.
 */

// Must match the `categoryId` the socket server puts on the push payload.
export const MESSAGE_CATEGORY_ID = "message";
// Must match the `channelId` the socket server puts on the push payload.
export const MESSAGE_CHANNEL_ID = "messages";

export const MessageNotificationAction = {
  reply: "reply",
  markAsRead: "mark-as-read",
} as const;

/** Shape of the `data` payload the server attaches to a message push. */
export interface MessageNotificationData {
  conversationId?: string | number;
  chatWithId?: string | number;
  isCommunity?: boolean;
  senderName?: string;
  url?: string;
}

export const readNotificationData = (
  data: unknown,
): MessageNotificationData => (data ?? {}) as MessageNotificationData;

// ─── Active conversation tracking ──────────────────────────────────
/*
 * The chat screen registers the conversation it's showing so a push that
 * arrives for that same chat doesn't pop a banner over the messages the user is
 * already looking at. Kept at module scope (not in state) because the
 * notification handler runs outside the React tree.
 */
let activeConversationId: string | null = null;

export const setActiveConversationId = (conversationId: string | null) => {
  activeConversationId = conversationId ? conversationId.toString() : null;
};

export const getActiveConversationId = () => activeConversationId;

// ─── Setup ─────────────────────────────────────────────────────────
let categoryReady: Promise<void> | null = null;

/**
 * Register the "message" category (and, on Android, the channel it's delivered
 * on) exactly once. The buttons only render if the push payload carries
 * `categoryId: "message"`, so the server has to opt in per notification.
 */
export const ensureMessageNotificationCategory = async () => {
  if (categoryReady) return categoryReady;

  categoryReady = (async () => {
    await Notifications.setNotificationCategoryAsync(MESSAGE_CATEGORY_ID, [
      {
        identifier: MessageNotificationAction.reply,
        buttonTitle: "Reply",
        textInput: {
          submitButtonTitle: "Send",
          placeholder: "Type a message…",
        },
        // Keep the user where they are; the reply is sent from the JS handler.
        options: { opensAppToForeground: false },
      },
      {
        identifier: MessageNotificationAction.markAsRead,
        buttonTitle: "Mark as read",
        options: { opensAppToForeground: false },
      },
    ]);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(MESSAGE_CHANNEL_ID, {
        name: "Messages",
        importance: Notifications.AndroidImportance.MAX,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PRIVATE,
        lightColor: "#5b2be0",
      });
    }
  })();

  return categoryReady;
};

// ─── Dismissal ─────────────────────────────────────────────────────
/**
 * Clear every delivered notification belonging to a conversation. Used when the
 * chat is opened and after "Mark as read", so an already-read chat never leaves
 * a stale banner in the tray.
 *
 * Covers both renderers: the notifee thread notification (Android) and any
 * plain expo notification, which is what iOS gets and what Android falls back
 * to if the background task didn't run.
 */
export const dismissConversationNotifications = async (
  conversationId: string | number | undefined | null,
) => {
  if (!conversationId || conversationId === "new") return;
  const target = conversationId.toString();

  await clearMessageThread(target);

  try {
    const presented = await Notifications.getPresentedNotificationsAsync();

    await Promise.all(
      presented
        .filter((notification) => {
          const data = readNotificationData(
            notification.request.content.data,
          );
          return data.conversationId?.toString() === target;
        })
        .map((notification) =>
          Notifications.dismissNotificationAsync(notification.request.identifier),
        ),
    );
  } catch (error) {
    console.log("Error dismissing conversation notifications:", error);
  }
};
