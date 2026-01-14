import { FileTypes } from "../enum";

interface I_Messages {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  isRead: boolean;
  media?: I_Media[];
}

interface I_Media {
  mediaUrl?: string;
  mediaType?: keyof typeof FileTypes;
}

export { I_Media, I_Messages };
