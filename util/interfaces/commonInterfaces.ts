import { I_Messages } from "../types/chat.types";

interface SingleUser {
  id: string;
  name: string;
  avatar: string;
  isAdmin?: boolean;
  isOwner?: boolean;
}

interface AvatarGroupProps {
  users: SingleUser[];
  limit?: number;
}

interface CommunityCardProps extends AvatarGroupProps {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  messagedPersonName: string;
  unreadMessageCount?: number;
  avatar: string;
  isExpanded?: boolean;
  messages?: I_Messages[];
}

interface PersonCardProps {
  id: string;
  avatar: string;
  name: string;
  lastMessage: string;
  unreadMessageCount?: number;
  lastMessageTime: string;
  isTyping?: boolean;
  isPined?: boolean;
  messages?: I_Messages[];
}

export type {
  AvatarGroupProps,
  CommunityCardProps,
  PersonCardProps,
  SingleUser,
};
