import AddCommunityMemberSearchBody from "@/components/search/AddCommunityMemberSearchBody";
import CommunitySearchBody from "@/components/search/CommunitySearchBody";
import PersonSearchBody from "@/components/search/PersonSearchBody";
import { SearchParams } from "@/util/enum";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

//TODO: implement search and make sure it is dynamic

const Search = () => {
  const { for: searchFor, conversationId } = useLocalSearchParams();
  //TODO: compare the searchFor value with SearchParams values and based on that implement the search

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        {searchFor === SearchParams.person && <PersonSearchBody />}
        {searchFor === SearchParams.community && <CommunitySearchBody />}
        {searchFor === SearchParams.addCommunityMember && (
          <AddCommunityMemberSearchBody />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Search;
