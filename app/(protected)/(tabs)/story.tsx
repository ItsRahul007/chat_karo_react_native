import CommonTopBar from "@/components/common/CommonTopBar";
import MyStorySection from "@/components/story/MyStorySection";
import OtherUsersStoryCard from "@/components/story/OtherUsersStoryCard";
import ShowStory from "@/components/story/ShowStory";
import { SearchParams } from "@/util/enum";
import { otherUsersStory } from "@/util/sample.data";
import React from "react";
import { FlatList, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const story = () => {
  const [showStory, setShowStory] = React.useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = React.useState(0);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        <CommonTopBar name="Story" searchParams={SearchParams.story} />

        <View className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary">
          <FlatList
            data={otherUsersStory}
            renderItem={({ item, index }) => (
              <OtherUsersStoryCard
                story={item}
                onPress={() => {
                  setCurrentStoryIndex(index);
                  setShowStory(true);
                }}
              />
            )}
            keyExtractor={(item) => item.id}
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
            ListHeaderComponent={<MyStorySection />}
          />
        </View>

        <ShowStory
          stories={otherUsersStory}
          showStory={showStory}
          onClose={() => setShowStory(false)}
          initialStoryIndex={currentStoryIndex}
          initialMediaIndex={0}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default story;
