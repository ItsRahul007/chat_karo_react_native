import AddCommunityMemberSearchBody from "@/components/search/AddCommunityMemberSearchBody";
import CommunitySearchBody from "@/components/search/CommunitySearchBody";
import PersonSearchBody from "@/components/search/PersonSearchBody";
import { SearchParams } from "@/util/enum";
import { useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Search = () => {
  const params = useLocalSearchParams();
  const searchFor = Array.isArray(params.for) ? params.for[0] : params.for;
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  console.log("Search For:", searchFor);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative px-4"
        edges={["top"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {searchFor === SearchParams.person && <PersonSearchBody />}
          {searchFor === SearchParams.community && <CommunitySearchBody />}
          {searchFor === SearchParams.addCommunityMember && (
            <AddCommunityMemberSearchBody
              communityId={conversationId as string}
            />
          )}
          {!Object.values(SearchParams).includes(searchFor as SearchParams) && (
            <View className="flex-1 justify-center items-center">
              <Text className="text-light-text-primary dark:text-dark-text-primary">
                Invalid Search Parameter: {searchFor}
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Search;
