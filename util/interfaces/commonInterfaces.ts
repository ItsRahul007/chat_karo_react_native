import { I_Messages } from "../types/chat.types";

interface AvatarGroupProps {
  users: { id: string; uri: string }[];
  limit?: number;
}

interface CommunityCardProps extends AvatarGroupProps {
  id?: string;
  name: string;
  lastMessage: string;
  messagedPersonName: string;
  unreadMessageCount?: number;
  communityAvatar: string;
  isExpanded?: boolean;
}

interface PersonCardProps {
  id?: string;
  personImage: string;
  name: string;
  lastMessage: string;
  unreadMessageCount?: number;
  lastMessageTime: string;
  isTyping?: boolean;
  isPined?: boolean;
  messages?: I_Messages[];
}

export type { AvatarGroupProps, CommunityCardProps, PersonCardProps };
