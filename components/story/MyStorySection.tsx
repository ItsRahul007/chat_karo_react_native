import { ColorTheme } from "@/constants/colors";
import { myStory } from "@/util/sample.data";
import { Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import MyStoryCard from "./MyStoryCard";

const MyStorySection = () => {
  return (
    <View className="py-3 gap-y-4 max-h-64 bg-light-background-primary dark:bg-dark-background-primary">
      <Text className="text-light-text-primary dark:text-dark-text-primary font-bold text-xl px-6">
        My Story
      </Text>
      <FlatList
        data={myStory.media}
        ListHeaderComponent={
          <Pressable className="rounded-3xl overflow-hidden">
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
          </Pressable>
        }
        renderItem={({ item }) => (
          <MyStoryCard story={item} onPress={() => {}} />
        )}
        keyExtractor={(item) => item.mediaUrl}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 10,
          paddingHorizontal: 30,
        }}
      />
    </View>
  );
};

export default MyStorySection;
