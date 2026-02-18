interface UserProfile {
  id: bigint;
  createdAt: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  avatar: string;
  lastSeen: string; // should be global timezone
  about: string;
}

interface ConversationParticipant {
  id: bigint;
  createdAt: string;
  userId: bigint;
  conversationId: bigint;
  lastReadTimestamp: string;
  isDeleted: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  isPinned: boolean;
  isOwner: boolean;
  isRemoved: boolean;
}

interface Conversation {
  id: bigint;
  createdAt: string;
  isGroup: boolean;
  groupName: string;
  groupAbout: string;
  groupImage: string;
  lastMessageId: bigint;
}

interface MediaAttachment {
  url: string;
  type: "image" | "video" | "file" | "audio" | "pdf";
  fileSize?: number;
  fileName?: string;
}

interface Message {
  id: bigint | number;
  createdAt: string;
  senderId: bigint | number;
  conversationId: bigint | number;
  message: string;
  media: MediaAttachment[];
  isRead: boolean;
  isDeleted: boolean;
  isEdited: boolean;
  mentionMessageId: bigint | number | null;
}

export type { Conversation, ConversationParticipant, Message, UserProfile };
