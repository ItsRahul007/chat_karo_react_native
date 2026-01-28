import CommonTopBar from "@/components/common/CommonTopBar";
import MyStoryCard from "@/components/story/MyStoryCard";
import { ColorTheme } from "@/constants/colors";
import { SearchParams } from "@/util/enum";
import { myStory } from "@/util/sample.data";
import { Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const story = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary">
        <CommonTopBar name="Story" searchParams={SearchParams.story} />
        {/* my story section */}
        <View className="py-6 gap-y-4 max-h-64">
          <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl px-6">
            My Story
          </Text>
          <FlatList
            data={myStory.media}
            ListHeaderComponent={
              <View className="rounded-3xl overflow-hidden">
                <LinearGradient
                  colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 60,
                    height: 140,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Entypo name="plus" size={20} color="white" />
                </LinearGradient>
              </View>
            }
            renderItem={({ item }) => (
              <MyStoryCard story={item} onPress={() => {}} />
            )}
            keyExtractor={(item) => item.mediaUrl}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 10,
              paddingHorizontal: 50,
            }}
          />
        </View>

        {/* other users story section */}
        <View></View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default story;
