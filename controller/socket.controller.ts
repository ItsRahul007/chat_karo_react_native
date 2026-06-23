import { QueryKeys } from "@/util/enum";
import { Message, SingleChat, UserTyping } from "@/util/interfaces/types";
import { Toast } from "@/util/toast";
import { QueryClient } from "@tanstack/react-query";

/**
 * Updates the messages cache for a chat conversation.
 * If the conversation's message cache exists (i.e. the chat screen has been visited),
 * the new message is prepended to the first page.
 */
export function handleReceiveMessage(
  queryClient: QueryClient,
  message: Message,
) {
  const conversationId = message.conversationId?.toString();
  if (!conversationId) return;

  queryClient.setQueryData([QueryKeys.messages, conversationId], (old: any) => {
    if (!old) return old;
    const [firstPage, ...rest] = old.pages;

    const messageIndex = firstPage.findIndex(
      (m: Message) => m.id === message.id,
    );
    if (messageIndex !== -1) {
      // Update existing message (e.g. for edits)
      const newFirstPage = [...firstPage];
      newFirstPage[messageIndex] = message;
      return {
        ...old,
        pages: [newFirstPage, ...rest],
      };
    }

    return {
      ...old,
      pages: [[message, ...firstPage], ...rest],
    };
  });
}

/**
 * Updates the inbox (privateChats) cache when a message arrives.
 * Sets the lastMessage and optionally increments the unread count.
 */
export function handleInboxUpdate({
  queryClient,
  message,
  incrementUnread = true,
  isCommunity = false,
  isNewChat = false,
}: {
  queryClient: QueryClient;
  message: Message;
  incrementUnread?: boolean;
  isCommunity?: boolean;
  isNewChat?: boolean;
}) {
  const firstKey = isCommunity
    ? QueryKeys.communityChats
    : QueryKeys.privateChats;

  /* 
  * if it's a new chat means receiver doesn't have inside the chat and it is defiently a new message call
  ? in that case refetch the chat lists again
  */
  if (isNewChat) {
    queryClient.refetchQueries({ queryKey: [firstKey] });
    return;
  }

  const isEditedMessage = message.isEdited;

  queryClient.setQueryData([firstKey], (old: any) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page: any[]) =>
        page.map((chat: any) =>
          chat.conversationId?.toString() === message.conversationId?.toString()
            ? {
                ...chat,
                lastMessage: message,
                unreadMessageCount: incrementUnread
                  ? (chat.unreadMessageCount || 0) + (isEditedMessage ? 0 : 1)
                  : chat.unreadMessageCount,
              }
            : chat,
        ),
      ),
    };
  });
}

export const onUserRemovedFromCommunity = ({
  success,
  conversationId,
  queryClient,
}: {
  success: boolean;
  conversationId: string;
  queryClient: QueryClient;
}) => {
  if (!success) {
    Toast.error("Failed to remove");
    return;
  }

  Toast.success("Removed successfully");
  queryClient.refetchQueries({
    queryKey: [QueryKeys.communityMembers, conversationId],
  });
};

// Sets the `isTyping` flag on a single private chat in the cache.
const setChatTyping = (
  queryClient: QueryClient,
  userId: string,
  conversationId: string,
  isTyping: boolean,
) => {
  queryClient.setQueryData([QueryKeys.privateChats], (old: any) => {
    if (!old) return old;

    let changed = false;
    const pages = old.pages.map((page: SingleChat[]) =>
      page.map((chat) => {
        if (
          chat.chatWithId?.toString() === userId &&
          chat.conversationId.toString() === conversationId
        ) {
          if (chat.isTyping === isTyping) return chat; // no-op
          changed = true;
          return { ...chat, isTyping };
        }
        return chat;
      }),
    );

    return changed ? { ...old, pages } : old;
  });
};

// Safety timers, keyed per chat, so a stuck "typing" state auto-clears even if a
// USER_STOP_TYPING event is never delivered. The sender re-emits TYPING as a
// heartbeat (see ChatInput), so this timer keeps getting pushed out while the
// other user is actively typing.
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const TYPING_AUTO_CLEAR_MS = 1500;

// make the isTyping true of that specific chat
export const onUserTyping = ({
  userId,
  conversationId,
  queryClient,
}: UserTyping) => {
  if (!userId || !conversationId) return;

  const key = `${userId}-${conversationId}`;
  setChatTyping(queryClient, userId, conversationId, true);

  // (Re)arm the auto-clear timer.
  const existing = typingTimers.get(key);
  if (existing) clearTimeout(existing);
  typingTimers.set(
    key,
    setTimeout(() => {
      typingTimers.delete(key);
      setChatTyping(queryClient, userId, conversationId, false);
    }, TYPING_AUTO_CLEAR_MS),
  );
};

// make the isTyping false of that specific chat
export const onUserStopTyping = ({
  userId,
  conversationId,
  queryClient,
}: UserTyping) => {
  if (!userId || !conversationId) return;

  const key = `${userId}-${conversationId}`;
  const existing = typingTimers.get(key);
  if (existing) {
    clearTimeout(existing);
    typingTimers.delete(key);
  }

  setChatTyping(queryClient, userId, conversationId, false);
};
