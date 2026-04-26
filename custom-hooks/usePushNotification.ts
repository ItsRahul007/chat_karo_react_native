import { QueryKeys } from "@/util/enum";
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

const usePushNotification = (queryClient: QueryClient): I_PushNotification => {
  const router = useRouter();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldShowInForeground: true,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);

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

  useEffect(() => {
    registerPushNotification().then((token) => setExpoPushToken(token));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.conversationId) {
          // Reset unread count to 0 in cache when clicking on a notification
          const updateUnread = (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.map((chat: any) =>
                  chat.conversationId?.toString() ===
                  data.conversationId?.toString()
                    ? { ...chat, unreadMessageCount: 0 }
                    : chat,
                ),
              ),
            };
          };

          queryClient.setQueryData([QueryKeys.privateChats], updateUnread);
          queryClient.setQueryData([QueryKeys.communityChats], updateUnread);

          router.navigate(
            `/chat/${data.conversationId}?chatWithId=${data.chatWithId}` as any,
          );
        } else if (data?.url) {
          router.navigate(data.url as any);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { notification, expoPushToken };
};

export { I_PushNotification, usePushNotification };
