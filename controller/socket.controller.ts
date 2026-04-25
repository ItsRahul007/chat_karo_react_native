import { QueryKeys } from "@/util/enum";
import { Message } from "@/util/interfaces/types";
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

    const messageIndex = firstPage.findIndex((m: Message) => m.id === message.id);
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
                  ? (chat.unreadMessageCount || 0) + 1
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
