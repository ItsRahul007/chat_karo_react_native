import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { chatList } from "@/util/sample.data";

const getChatHistoryById = (chatId: string): PersonCardProps | null => {
  try {
    return chatList.filter((chat) => chat.id === chatId)[0];
  } catch (error) {
    console.log(error);
    return null;
  }
};

export { getChatHistoryById };
