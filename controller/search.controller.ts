import {
  CommunityCardProps,
  PersonCardProps,
} from "@/util/interfaces/commonInterfaces";
import { chatList, sampleCommunityData } from "@/util/sample.data";

const searchPerson = async (query: string): Promise<PersonCardProps[]> => {
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!query) {
          resolve([]);
        }
        resolve(
          chatList.filter((chat) =>
            chat.name.toLowerCase().includes(query.toLowerCase()),
          ),
        );
      }, 1500);
    });
  } catch (error) {
    throw error;
  }
};

const searchCommunity = async (
  query: string,
): Promise<CommunityCardProps[]> => {
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!query) {
          resolve([]);
        }
        resolve(
          sampleCommunityData.filter((chat) =>
            chat.name.toLowerCase().includes(query.toLowerCase()),
          ),
        );
      }, 1500);
    });
  } catch (error) {
    throw error;
  }
};

const searchConversation = (query: string) => {
  //TODO: implement search for conversation
};

export { searchCommunity, searchConversation, searchPerson };
