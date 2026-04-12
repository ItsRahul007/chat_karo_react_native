import { QueryKeys } from "@/util/enum";
import { Message } from "@/util/interfaces/types";
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

    // Prevent duplicates
    if (firstPage.some((m: Message) => m.id === message.id)) return old;

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
  userId,
  message,
  incrementUnread = true,
  isCommunity = false,
  isNewChat = false,
}: {
  queryClient: QueryClient;
  userId: string | bigint;
  message: Message;
  incrementUnread?: boolean;
  isCommunity?: boolean;
  isNewChat?: boolean;
}) {
  const firstKey = isCommunity
    ? QueryKeys.communityChats
    : QueryKeys.privateChats;

  console.log("isNewChat", isNewChat);

  /* 
  * if it's a new chat means receiver doesn't have inside the chat and it is defiently a new message call
  ? in that case refetch the chat lists again
  */
  if (isNewChat) {
    queryClient.refetchQueries({ queryKey: [firstKey, userId] });
    return;
  }

  queryClient.setQueryData([firstKey, userId], (old: any) => {
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
                  ? (chat.unreadMessageCount || 0) + 1
                  : chat.unreadMessageCount,
              }
            : chat,
        ),
      ),
    };
  });
}
