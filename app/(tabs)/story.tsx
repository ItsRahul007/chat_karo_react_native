import CommonTopBar from "@/components/common/CommonTopBar";
import MyStorySection from "@/components/story/MyStorySection";
import OtherUsersStoryCard from "@/components/story/OtherUsersStoryCard";
import { SearchParams } from "@/util/enum";
import { otherUsersStory } from "@/util/sample.data";
import React from "react";
import { FlatList, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const story = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
        <CommonTopBar name="Story" searchParams={SearchParams.story} />

        <View className="flex-1 bg-light-background-secondary dark:bg-dark-background-secondary">
          <FlatList
            data={otherUsersStory}
            renderItem={({ item }) => (
              <OtherUsersStoryCard story={item} onPress={() => {}} />
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default story;
