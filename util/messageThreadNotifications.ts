import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { readNotificationIdentity } from "./notificationIdentity";

/**
 * WhatsApp-style message notifications: one notification per conversation,
 * showing the last few messages as a stack rather than a single line.
 *
 * A push payload only ever carries the newest message, so the stack has to be
 * assembled on the device — we keep a short rolling history per conversation in
 * AsyncStorage and rebuild the notification from it each time one arrives.
 *
 * Android only. MessagingStyle has no iOS counterpart (notifee exposes it under
 * `android`), so on iOS the plain expo-notifications banner is left to render,
 * which iOS already stacks on its own.
 */

export const MESSAGE_THREAD_CHANNEL_ID = "messages";

/** notifee press-action ids, distinct from the call ones. */
export const MessageThreadAction = {
  open: "message-open",
  reply: "message-reply",
  markAsRead: "message-mark-read",
} as const;

export const isMessageThreadAction = (id: string | undefined) =>
  id === MessageThreadAction.open ||
  id === MessageThreadAction.reply ||
  id === MessageThreadAction.markAsRead;

export const supportsMessageThreads = Platform.OS === "android";

// ─── Stored thread ─────────────────────────────────────────────────
export interface ThreadMessage {
  /** Message row id, used to ignore a push we've already folded in. */
  id?: string;
  text: string;
  senderName: string;
  senderAvatar?: string;
  /** Epoch ms. Passed in rather than generated so it survives a rebuild. */
  timestamp: number;
  /** True for messages the user sent from the notification itself. */
  fromMe?: boolean;
}

export interface MessageThread {
  conversationId: string;
  /** Group name for a community, the other person's name otherwise. */
  title: string;
  isCommunity: boolean;
  chatWithId?: string;
  messages: ThreadMessage[];
}

// Enough to read the gist without an unwieldy notification.
const MAX_THREAD_MESSAGES = 6;

const threadKey = (conversationId: string) =>
  `@chatkaro/notification-thread/${conversationId}`;

const notificationId = (conversationId: string) => `message-${conversationId}`;

const readThread = async (
  conversationId: string,
): Promise<MessageThread | null> => {
  try {
    const raw = await AsyncStorage.getItem(threadKey(conversationId));
    return raw ? (JSON.parse(raw) as MessageThread) : null;
  } catch (error) {
    console.log("Error reading notification thread:", error);
    return null;
  }
};

const writeThread = async (thread: MessageThread) => {
  try {
    await AsyncStorage.setItem(
      threadKey(thread.conversationId),
      JSON.stringify(thread),
    );
  } catch (error) {
    console.log("Error writing notification thread:", error);
  }
};

// ─── Channel ───────────────────────────────────────────────────────
let channelReady: Promise<void> | null = null;

const ensureMessageChannel = async () => {
  if (!supportsMessageThreads) return;
  if (channelReady) return channelReady;

  channelReady = notifee
    .createChannel({
      id: MESSAGE_THREAD_CHANNEL_ID,
      name: "Messages",
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PRIVATE,
    })
    .then(() => undefined);

  return channelReady;
};

// ─── Display ───────────────────────────────────────────────────────
/**
 * Render (or re-render) a conversation's notification from its stored history.
 * Uses a stable id per conversation so each rebuild replaces the previous one
 * in place instead of stacking up in the tray.
 */
export const displayMessageThread = async (
  thread: MessageThread,
  { silent = false }: { silent?: boolean } = {},
) => {
  if (!supportsMessageThreads || thread.messages.length === 0) return;

  await ensureMessageChannel();

  const me = await readNotificationIdentity();
  const latest = thread.messages[thread.messages.length - 1];

  await notifee.displayNotification({
    id: notificationId(thread.conversationId),
    title: thread.title,
    body: latest.text,
    data: {
      conversationId: thread.conversationId,
      chatWithId: thread.chatWithId ?? "",
      isCommunity: thread.isCommunity ? "true" : "false",
    },
    android: {
      channelId: MESSAGE_THREAD_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      // Collapse this conversation's messages into one expandable stack.
      style: {
        type: AndroidStyle.MESSAGING,
        person: {
          name: me?.name || "You",
          id: me?.id,
          ...(me?.avatar ? { icon: me.avatar } : {}),
        },
        // A community shows the sender against each line, like a group chat.
        group: thread.isCommunity,
        title: thread.title,
        messages: thread.messages.map((message) => ({
          text: message.text,
          timestamp: message.timestamp,
          ...(message.fromMe
            ? {}
            : {
                person: {
                  name: message.senderName,
                  ...(message.senderAvatar
                    ? { icon: message.senderAvatar }
                    : {}),
                },
              }),
        })),
      },
      pressAction: {
        id: MessageThreadAction.open,
        launchActivity: "default",
      },
      actions: [
        {
          title: "Reply",
          pressAction: { id: MessageThreadAction.reply },
          input: {
            placeholder: "Message…",
            allowFreeFormInput: true,
          },
        },
        {
          title: "Mark as read",
          pressAction: { id: MessageThreadAction.markAsRead },
        },
      ],
      autoCancel: false,
      /*
       * Android re-alerts on every post unless told otherwise, which is what we
       * want for an incoming message. A re-render triggered by the user's own
       * reply passes silent so their phone doesn't buzz at them.
       */
      onlyAlertOnce: silent,
    },
  });
};

// ─── Mutation ──────────────────────────────────────────────────────
export interface IncomingThreadMessage {
  conversationId: string;
  title: string;
  text: string;
  senderName: string;
  senderAvatar?: string;
  messageId?: string;
  isCommunity: boolean;
  chatWithId?: string;
  timestamp?: number;
  fromMe?: boolean;
}

/**
 * Fold a message into a conversation's thread and re-render its notification.
 * Returns false when the message was a duplicate and nothing changed — the
 * same push can reach us twice (foreground listener and background task both
 * fire), so appends are keyed on the message row id.
 */
export const addMessageToThread = async (
  incoming: IncomingThreadMessage,
): Promise<boolean> => {
  if (!supportsMessageThreads) return false;

  const conversationId = incoming.conversationId.toString();
  const existing = await readThread(conversationId);

  if (
    incoming.messageId &&
    existing?.messages.some((message) => message.id === incoming.messageId)
  ) {
    return false;
  }

  const thread: MessageThread = {
    conversationId,
    title: incoming.title || existing?.title || "New message",
    isCommunity: incoming.isCommunity,
    chatWithId: incoming.chatWithId ?? existing?.chatWithId,
    messages: [
      ...(existing?.messages ?? []),
      {
        id: incoming.messageId,
        text: incoming.text,
        senderName: incoming.senderName,
        senderAvatar: incoming.senderAvatar,
        timestamp: incoming.timestamp ?? Date.now(),
        fromMe: incoming.fromMe,
      },
    ].slice(-MAX_THREAD_MESSAGES),
  };

  await writeThread(thread);
  await displayMessageThread(thread, { silent: incoming.fromMe === true });
  return true;
};

/** Append the user's own reply so the notification reflects what they sent. */
export const addOwnReplyToThread = async (
  conversationId: string,
  text: string,
  messageId?: string,
) => {
  const existing = await readThread(conversationId.toString());
  if (!existing) return;

  const me = await readNotificationIdentity();

  await addMessageToThread({
    conversationId: conversationId.toString(),
    title: existing.title,
    text,
    senderName: me?.name || "You",
    messageId,
    isCommunity: existing.isCommunity,
    chatWithId: existing.chatWithId,
    fromMe: true,
  });
};

// ─── Teardown ──────────────────────────────────────────────────────
/** Drop a conversation's notification and the history behind it. */
export const clearMessageThread = async (
  conversationId: string | number | undefined | null,
) => {
  if (!conversationId || conversationId === "new") return;
  const id = conversationId.toString();

  try {
    await AsyncStorage.removeItem(threadKey(id));
    if (supportsMessageThreads) {
      await notifee.cancelNotification(notificationId(id));
    }
  } catch (error) {
    console.log("Error clearing message thread:", error);
  }
};
