import { EventType } from "@notifee/react-native";
import { DeviceEventEmitter } from "react-native";
import { TableNames } from "./enum";
import {
  addOwnReplyToThread,
  clearMessageThread,
  isMessageThreadAction,
  MessageThreadAction,
} from "./messageThreadNotifications";
import { readNotificationIdentity } from "./notificationIdentity";
import { supabase } from "./supabase";

/**
 * Reply / mark-as-read, implemented so they work with no React tree alive.
 *
 * These run from notifee's background event handler, which can fire while the
 * app is killed. They talk to Supabase directly rather than going through
 * chat.controller — that module pulls in expo-media-library and
 * expo-file-system at import time, which is dead weight in a headless task.
 *
 * When the app *is* alive, they also emit on an in-process bus so SocketContext
 * can fan the message out over the socket and update the query caches.
 */

const REPLY_SENT_EVENT = "message-notification-reply-sent";
const THREAD_READ_EVENT = "message-notification-thread-read";
const OPEN_CHAT_EVENT = "message-notification-open-chat";

export interface ReplySentEvent {
  message: any;
  conversationId: string;
  chatWithId?: string;
  isCommunity: boolean;
}

export interface ThreadReadEvent {
  conversationId: string;
}

export interface OpenChatEvent {
  conversationId: string;
  chatWithId?: string;
  isCommunity: boolean;
}

export const subscribeToNotificationReplies = (
  cb: (event: ReplySentEvent) => void,
) => {
  const sub = DeviceEventEmitter.addListener(REPLY_SENT_EVENT, cb);
  return () => sub.remove();
};

export const subscribeToNotificationReads = (
  cb: (event: ThreadReadEvent) => void,
) => {
  const sub = DeviceEventEmitter.addListener(THREAD_READ_EVENT, cb);
  return () => sub.remove();
};

export const subscribeToNotificationOpens = (
  cb: (event: OpenChatEvent) => void,
) => {
  const sub = DeviceEventEmitter.addListener(OPEN_CHAT_EVENT, cb);
  return () => sub.remove();
};

const markReadInDb = async (conversationId: string, myId: string) => {
  const { error } = await supabase
    .from(TableNames.participants)
    .update({ lastReadTime: new Date().toISOString() })
    .eq("conversationId", conversationId)
    .eq("userId", myId);

  if (error) throw error;
};

/**
 * Persist a reply typed into the notification. Returns the inserted row, or
 * null if it couldn't be sent (no cached identity, or the insert failed).
 */
export const sendReplyFromNotification = async ({
  conversationId,
  chatWithId,
  isCommunity,
  text,
}: {
  conversationId: string;
  chatWithId?: string;
  isCommunity: boolean;
  text: string;
}) => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const me = await readNotificationIdentity();
    if (!me?.id) {
      console.log("No cached identity — cannot reply from notification");
      return null;
    }

    const { data, error } = await supabase
      .from(TableNames.messages)
      .insert({
        conversationId,
        senderId: me.id,
        message: trimmed,
        media: null,
        mentionMessageId: null,
      })
      .select("*");

    if (error) throw error;

    const message = data?.[0];
    if (!message) return null;

    // Replying implies the conversation has been read.
    await markReadInDb(conversationId, me.id).catch((dbError) =>
      console.log("Error marking read after reply:", dbError),
    );

    // Show the sent message in the notification's own thread.
    await addOwnReplyToThread(conversationId, trimmed, message.id?.toString());

    DeviceEventEmitter.emit(REPLY_SENT_EVENT, {
      message,
      conversationId,
      chatWithId,
      isCommunity,
    } satisfies ReplySentEvent);

    return message;
  } catch (error) {
    console.log("Error sending reply from notification:", error);
    return null;
  }
};

/** Mark a conversation read and drop its notification. */
export const markThreadAsReadFromNotification = async (
  conversationId: string,
) => {
  try {
    const me = await readNotificationIdentity();
    if (me?.id) await markReadInDb(conversationId, me.id);
  } catch (error) {
    console.log("Error marking thread as read:", error);
  } finally {
    await clearMessageThread(conversationId);
    DeviceEventEmitter.emit(THREAD_READ_EVENT, {
      conversationId,
    } satisfies ThreadReadEvent);
  }
};

// ─── notifee event dispatch ────────────────────────────────────────
interface NotifeeMessageEvent {
  type: EventType;
  detail: {
    input?: string;
    pressAction?: { id?: string };
    notification?: { data?: Record<string, any> };
  };
}

/**
 * Decode a notifee event for a message notification and run the action.
 * Shared by the background handler (app entry point) and the foreground
 * handler so a button behaves the same in either state.
 *
 * Returns true if the event belonged to a message notification, so the caller
 * knows not to also treat it as a call event.
 */
export const handleMessageNotifeeEvent = async ({
  type,
  detail,
}: NotifeeMessageEvent): Promise<boolean> => {
  const data = detail?.notification?.data ?? {};
  const conversationId = data.conversationId?.toString();
  const chatWithId = data.chatWithId ? data.chatWithId.toString() : undefined;
  const isCommunity = data.isCommunity === "true" || data.isCommunity === true;

  if (type === EventType.PRESS) {
    // Only ours if it carries a conversation — call notifications don't.
    if (!conversationId || !isMessageThreadAction(detail?.pressAction?.id)) {
      return false;
    }

    await clearMessageThread(conversationId);
    DeviceEventEmitter.emit(OPEN_CHAT_EVENT, {
      conversationId,
      chatWithId,
      isCommunity,
    } satisfies OpenChatEvent);
    return true;
  }

  const actionId = detail?.pressAction?.id;
  if (type !== EventType.ACTION_PRESS || !isMessageThreadAction(actionId)) {
    return false;
  }
  if (!conversationId) return true;

  if (actionId === MessageThreadAction.reply) {
    await sendReplyFromNotification({
      conversationId,
      chatWithId,
      isCommunity,
      // notifee puts direct-reply text on the event, not the press action.
      text: detail?.input ?? "",
    });
    return true;
  }

  if (actionId === MessageThreadAction.markAsRead) {
    await markThreadAsReadFromNotification(conversationId);
  }

  return true;
};
