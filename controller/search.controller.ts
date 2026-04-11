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
        .select("id, firstName, lastName, avatar, about, email, userName")
        .or(
          `firstName.ilike.%${query}%,lastName.ilike.%${query}%,userName.ilike.%${query}%`,
        );

      if (excludedIds.length > 0) {
        supabaseQuery = supabaseQuery.not("id", "in", `(${excludedIds.join(",")})`);
      }

      const { data: userData, error: userError } =
        await supabaseQuery.limit(20);

      data = userData;
      error = userError;
    } else {
      // Search only users I've chatted with
      const { data: inboxData, error: inboxError } = await supabase
        .from(TableNames.inbox)
        .select("*")
        .eq("myId", currentUserId)
        .eq("isGroup", false)
        .or(
          `firstName.ilike.%${query}%,lastName.ilike.%${query}%,userName.ilike.%${query}%`,
        )
        .limit(20);

      if (inboxError) throw inboxError;

      if (inboxData && inboxData.length > 0) {
        const chatWithIds = inboxData.map((i: any) => i.chatWithId);
        const { data: usersData, error: usersError } = await supabase
          .from(TableNames.users)
          .select("id, userName")
          .in("id", chatWithIds);

        if (usersError) throw usersError;

        const userNameMap = new Map(
          usersData?.map((u: any) => [String(u.id), u.userName]),
        );

        data = inboxData.map((inbox: any) => ({
          ...inbox,
          userName: userNameMap.get(String(inbox.chatWithId)) || "",
        }));
      } else {
        data = [];
      }
      error = null;
    }


    if (error) throw error;

    return (data || []).map((user: any) => ({
      id: String(newChat ? user.id : user.chatWithId),
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      about: user.about || "",
      email: user.email || "",
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
