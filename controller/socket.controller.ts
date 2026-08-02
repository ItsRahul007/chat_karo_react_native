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

/*
 * Mirrors the ordering used by getPrivateChats/getCommunityChats so a chat that
 * just received a message moves to the same spot a refetch would put it in.
 */
const compareChats = (a: any, b: any) => {
  if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
  const unreadDiff = (b.unreadMessageCount || 0) - (a.unreadMessageCount || 0);
  if (unreadDiff !== 0) return unreadDiff;
  return (
    new Date(b.lastMessage?.createdAt ?? 0).getTime() -
    new Date(a.lastMessage?.createdAt ?? 0).getTime()
  );
};

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
  const conversationId = message.conversationId?.toString();
  let matched = false;

  /*
  * setQueriesData does a prefix match, so this hits both [communityChats] and
  ? [communityChats, userId] — setQueryData would silently miss the latter
  */
  queryClient.setQueriesData({ queryKey: [firstKey] }, (old: any) => {
    if (!old?.pages) return old;

    const pageSizes = old.pages.map((page: any[]) => page.length);
    let found = false;

    const chats = old.pages.flat().map((chat: any) => {
      if (chat.conversationId?.toString() !== conversationId) return chat;
      found = true;
      return {
        ...chat,
        lastMessage: message,
        unreadMessageCount: incrementUnread
          ? (chat.unreadMessageCount || 0) + (isEditedMessage ? 0 : 1)
          : chat.unreadMessageCount,
      };
    });

    if (!found) return old;
    matched = true;

    chats.sort(compareChats);

    // re-chunk into the same page sizes so pagination keeps working
    let offset = 0;
    const pages = pageSizes.map((size: number) => {
      const page = chats.slice(offset, offset + size);
      offset += size;
      return page;
    });

    return { ...old, pages };
  });

  /*
  ? the conversation isn't in the cached pages yet (first message of a chat the
  ? receiver hasn't loaded, or it lives on a page that was never fetched)
  * refetch instead of dropping the update on the floor
  */
  if (!matched) {
    queryClient.refetchQueries({ queryKey: [firstKey] });
  }
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
