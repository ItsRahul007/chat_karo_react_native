import CommonTopBar from "@/components/common/CommonTopBar";
import MyStorySection from "@/components/story/MyStorySection";
import OtherUsersStoryCard from "@/components/story/OtherUsersStoryCard";
import ShowStory from "@/components/story/ShowStory";
import { AuthContext } from "@/context/AuthContext";
import { getStories } from "@/controller/story.controller";
import { useIconColor } from "@/util/common.functions";
import { QueryKeys, SearchParams } from "@/util/enum";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Story = () => {
  const { user } = React.useContext(AuthContext);
  const iconColor = useIconColor();
  const [showStory, setShowStory] = React.useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = React.useState(0);

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.story, user?.id?.toString()],
    queryFn: () => getStories(user!.id),
    enabled: !!user?.id,
  });

  const myStory = data?.myStory ?? [];
  const otherStories = data?.otherStories ?? [];
  const seenStoryIds = React.useMemo(
    () => new Set(data?.seenStoryIds ?? []),
    [data?.seenStoryIds],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        <CommonTopBar
          name="Story"
          searchParams={SearchParams.story}
          showImage={false}
        />

        <View className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={iconColor} />
            </View>
          ) : (
            <FlatList
              data={otherStories}
              renderItem={({ item, index }) => (
                <OtherUsersStoryCard
                  story={item}
                  isSeen={item.every((row) => seenStoryIds.has(String(row.id)))}
                  onPress={() => {
                    setCurrentStoryIndex(index);
                    setShowStory(true);
                  }}
                />
              )}
              keyExtractor={(item) => String(item[0]?.userId)}
              numColumns={2}
              columnWrapperStyle={{
                gap: 15,
                paddingHorizontal: 15,
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                gap: 15,
                paddingBottom: 100,
              }}
              ListHeaderComponent={<MyStorySection myStory={myStory} />}
              ListEmptyComponent={
                <View className="items-center justify-center py-10">
                  <Text className="text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
                    No recent stories
                  </Text>
                </View>
              }
            />
          )}
        </View>

        <ShowStory
          stories={otherStories}
          showStory={showStory}
          onClose={() => setShowStory(false)}
          initialStoryIndex={currentStoryIndex}
          initialMediaIndex={0}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Story;
