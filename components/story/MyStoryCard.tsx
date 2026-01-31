import useFetch from "@/custom-hooks/useFetch";
import { generateThumbnail, useIconColor } from "@/util/common.functions";
import { StoryMedia } from "@/util/types/story.types";
import { Entypo } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

const MyStoryCard = ({
  story,
  onPress,
  onRemove,
}: {
  story: StoryMedia;
  onPress: () => void;
  onRemove?: (story: StoryMedia) => void;
}) => {
  return (
    <View className="relative w-40 h-40 p-1">
      <Pressable onPress={onPress} className="flex-1">
        <MyStoryCardRenderer story={story} />
      </Pressable>
      <Pressable
        onPress={() => onRemove?.(story)}
        className="absolute right-0 top-0 bg-crossIconBg rounded-full p-1 items-center justify-center border-2 border-light-background-primary dark:border-dark-background-primary"
      >
        <Entypo name="cross" size={15} color="white" />
      </Pressable>
    </View>
  );
};

const MyStoryCardRenderer = ({ story }: { story: StoryMedia }) => {
  if (story.mediaType === "image") {
    return (
      <Image
        source={{ uri: story.mediaUrl }}
        className="h-full w-full rounded-3xl"
        resizeMode="cover"
      />
    );
  }

  const iconColor = useIconColor();
  const { data, loading, error } = useFetch(() =>
    generateThumbnail(story.mediaUrl),
  );

  if (loading) {
    return <ActivityIndicator color={iconColor} />;
  }

  if (error) {
    return (
      <Text className="text-light-text-primary dark:text-dark-text-primary">
        Unable to load thumbnail
      </Text>
    );
  }

  if (data) {
    return (
      <Image
        source={{ uri: data }}
        className="h-full w-full rounded-3xl"
        resizeMode="cover"
      />
    );
  }

  return (
    <Text className="text-light-text-primary dark:text-dark-text-primary">
      Unable to load thumbnail
    </Text>
  );
};

export default MyStoryCard;
