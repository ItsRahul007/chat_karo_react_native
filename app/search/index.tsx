import AddCommunityMemberSearchBody from "@/components/search/AddCommunityMemberSearchBody";
import CommunitySearchBody from "@/components/search/CommunitySearchBody";
import PersonSearchBody from "@/components/search/PersonSearchBody";
import { SearchParams } from "@/util/enum";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Search = () => {
  const { for: searchFor, conversationId } = useLocalSearchParams();

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        {searchFor === SearchParams.person && <PersonSearchBody />}
        {searchFor === SearchParams.community && <CommunitySearchBody />}
        {searchFor === SearchParams.addCommunityMember && (
          <AddCommunityMemberSearchBody
            communityId={conversationId as string}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Search;
