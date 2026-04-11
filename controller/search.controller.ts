import {
  CommunityCardProps,
  PersonCardProps,
} from "@/util/interfaces/commonInterfaces";
import { supabase } from "@/util/supabase";
import { TableNames } from "@/util/enum";

const searchPerson = async (
  query: string,
  currentUserId?: string | bigint,
): Promise<PersonCardProps[]> => {
  try {
    if (!query) return [];

    let supabaseQuery = supabase
      .from(TableNames.users)
      .select("id, firstName, lastName, avatar, about, email, userName")
      .or(`firstName.ilike.%${query}%,lastName.ilike.%${query}%,userName.ilike.%${query}%`);


    if (currentUserId) {
      supabaseQuery = supabaseQuery.neq("id", currentUserId);
    }

    const { data, error } = await supabaseQuery.limit(20);

    if (error) throw error;

    return (data || []).map((user: any) => ({
      id: String(user.id),
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      about: user.about,
      email: user.email,
      userName: user.userName,
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

