import { I_Media } from "./chat.types";

interface StoryMedia extends I_Media {
  timestamp: string;
}

interface I_Story {
  id: string;
  name: string;
  avatar: string;
  media: StoryMedia[];
  isSeen: boolean;
  isHidden: boolean;
}

export { I_Story, StoryMedia };
