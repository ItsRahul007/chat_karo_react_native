import { FileTypes } from "../enum";

interface I_Messages {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  isRead: boolean;
  media?: I_Media[];
  avatar?: string;
  senderName?: string;
  replyTo?: I_Messages;
}

interface I_Media {
  mediaUrl?: string;
  mediaType?: keyof typeof FileTypes;
}

export { I_Media, I_Messages };
