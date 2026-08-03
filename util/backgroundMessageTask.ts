import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { getActiveConversationId } from "./messageNotifications";
import {
  addMessageToThread,
  supportsMessageThreads,
} from "./messageThreadNotifications";

/**
 * Rebuilds every incoming message push as a WhatsApp-style threaded
 * notification.
 *
 * Expo's push service delivers to Android as an FCM *data* message, so
 * `onMessageReceived` — and therefore this task — runs for every push, whether
 * the app is foregrounded, backgrounded, or killed. expo-notifications draws
 * its own plain notification off the same message; we dismiss that and replace
 * it with the notifee MessagingStyle one.
 *
 * Leaving expo's notification in the payload (rather than sending data-only) is
 * deliberate: if this task fails to run — OEM battery killers, force-stop — the
 * user still gets the plain notification instead of nothing at all.
 */

export const BACKGROUND_MESSAGE_TASK = "background-message-notification";

/**
 * Expo maps a push message onto FCM data keys: `title` → title, `body` →
 * `message`, and the custom `data` object → `body`, JSON-encoded. The Android
 * serializer also exposes that JSON as `dataString`.
 */
interface RemoteMessageData {
  title?: string;
  message?: string;
  dataString?: string;
  tag?: string;
}

interface MessagePushPayload {
  conversationId?: string | number;
  chatWithId?: string | number;
  isCommunity?: boolean;
  senderName?: string;
  senderAvatar?: string;
  messageId?: string | number;
}

/*
 * expo-notifications presents its notification from a coroutine kicked off just
 * before this task runs, so a single dismiss can land before the notification
 * exists. Dismiss again shortly after to catch that race.
 */
const dismissExpoNotification = async (identifier: string) => {
  const dismiss = () =>
    Notifications.dismissNotificationAsync(identifier).catch(() => {});

  await dismiss();
  setTimeout(dismiss, 700);
};

export const handleMessagePush = async (remote: RemoteMessageData) => {
  if (!supportsMessageThreads) return;

  let payload: MessagePushPayload = {};
  try {
    payload = remote.dataString ? JSON.parse(remote.dataString) : {};
  } catch {
    // Not one of ours, or malformed — leave expo's notification alone.
    return;
  }

  const conversationId = payload.conversationId?.toString();
  if (!conversationId) return;

  // The server tags message pushes with the conversation id, which is what
  // expo uses as its notification identifier on Android.
  await dismissExpoNotification(remote.tag || conversationId);

  // Already reading this chat — nothing should appear in the tray.
  if (conversationId === getActiveConversationId()) return;

  const text = remote.message?.trim();
  if (!text) return;

  await addMessageToThread({
    conversationId,
    title: remote.title || payload.senderName || "New message",
    text,
    senderName: payload.senderName || remote.title || "New message",
    senderAvatar: payload.senderAvatar,
    messageId: payload.messageId?.toString(),
    isCommunity: payload.isCommunity === true,
    chatWithId: payload.chatWithId?.toString(),
  });
};

TaskManager.defineTask<{ data?: RemoteMessageData }>(
  BACKGROUND_MESSAGE_TASK,
  async ({ data, error }) => {
    if (error) {
      console.log("Background message task error:", error);
      return;
    }

    try {
      await handleMessagePush(data?.data ?? {});
    } catch (taskError) {
      console.log("Error handling background message push:", taskError);
    }
  },
);

/** Registered once from the app entry point. */
export const registerBackgroundMessageTask = async () => {
  if (!supportsMessageThreads) return;
  try {
    await Notifications.registerTaskAsync(BACKGROUND_MESSAGE_TASK);
  } catch (error) {
    console.log("Error registering background message task:", error);
  }
};
