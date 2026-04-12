import { TableNames } from "@/util/enum";
import {
  CommunityCardProps,
  PersonCardProps,
} from "@/util/interfaces/commonInterfaces";
import { supabase } from "@/util/supabase";

const searchPerson = async (
  query: string,
  currentUserId?: string | bigint,
  newChat: boolean = true,
): Promise<PersonCardProps[]> => {
  try {
    if (!query) return [];

    let data, error;

    if (newChat) {
      // Search all users, excluding those already in chats
      const { data: existingChats } = await supabase
        .from(TableNames.inbox)
        .select("chatWithId")
        .eq("myId", currentUserId)
        .eq("isGroup", false);

      const excludedIds = (existingChats || []).map((c: any) => c.chatWithId);
      if (currentUserId) excludedIds.push(currentUserId);

      let supabaseQuery = supabase
        .from(TableNames.users)
        .select("id, firstName, lastName, avatar, userName")
        .or(
          `firstName.ilike.%${query}%, lastName.ilike.%${query}%, userName.ilike.%${query}%`,
        );

      if (excludedIds.length > 0) {
        supabaseQuery = supabaseQuery.not(
          "id",
          "in",
          `(${excludedIds.join(",")})`,
        );
      }

      const { data: userData, error: userError } =
        await supabaseQuery.limit(20);

      data = userData;
      error = userError;
    } else {
      // Search only users I've chatted with
      const { data: inboxData, error: inboxError } = await supabase
        .from(TableNames.inbox)
        .select(
          "chatWithId, firstName, lastName, avatar, userName, conversationId",
        )
        .eq("myId", currentUserId)
        .eq("isGroup", false)
        .or(
          `firstName.ilike.%${query}%, lastName.ilike.%${query}%, userName.ilike.%${query}%`,
        )
        .limit(20);

      data = inboxData;
      error = inboxError;
    }

    if (error) throw error;

    return (data || []).map((user: any) => ({
      id: String(newChat ? user.id : user.chatWithId),
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      userName: user.userName || "",
      conversationId: newChat ? undefined : String(user.conversationId),
    }));
  } catch (error) {
    console.error("Error searching person:", error);
    return [];
  }
};

const searchCommunity = async (
  query: string,
): Promise<CommunityCardProps[]> => {
  try {
    if (!query) return [];

    const { data, error } = await supabase
      .from(TableNames.conversations)
      .select("id, groupName, groupImage, groupAbout")
      .eq("isGroup", true)
      .ilike("groupName", `%${query}%`)
      .limit(20);

    if (error) throw error;

    return (data || []).map((community: any) => ({
      id: String(community.id),
      name: community.groupName,
      avatar: community.groupImage,
      about: community.groupAbout,
      groupAvatars: [],
    }));
  } catch (error) {
    console.error("Error searching community:", error);
    return [];
  }
};

const searchConversation = (query: string) => {
  //TODO: implement search for conversation
};

export { searchCommunity, searchConversation, searchPerson };
