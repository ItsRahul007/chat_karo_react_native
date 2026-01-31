import { ColorTheme } from "@/constants/colors";
import { myStory } from "@/util/sample.data";
import { Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import MyStoryCard from "./MyStoryCard";
import ShowStory from "./ShowStory";

const MyStorySection = () => {
  const [showStory, setShowStory] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  return (
    <View className="py-3 gap-y-4 h-64 bg-light-background-primary dark:bg-dark-background-primary relative">
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
        renderItem={({ item, index }) => (
          <MyStoryCard
            story={item}
            onPress={() => {
              setInitialIndex(index);
              setShowStory(true);
            }}
          />
        )}
        keyExtractor={(item) => item.mediaUrl}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 10,
          paddingHorizontal: 30,
        }}
      />

      <View className="h-7 w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-t-3xl absolute -bottom-4" />
      <ShowStory
        stories={[myStory]}
        showStory={showStory}
        onClose={() => setShowStory(false)}
        initialMediaIndex={initialIndex}
        initialStoryIndex={0}
        isMyStory={true}
      />
    </View>
  );
};

export default MyStorySection;
