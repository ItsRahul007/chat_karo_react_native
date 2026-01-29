import useFetch from "@/custom-hooks/useFetch";
import { generateThumbnail, useIconColor } from "@/util/common.functions";
import { I_Story, StoryMedia } from "@/util/types/story.types";
import React from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

const OtherUsersStoryCard = ({
  story,
  onPress,
}: {
  story: I_Story;
  onPress: () => void;
}) => {
  const { name, media, avatar } = story;
  const firstMedia = media[0];
  const timestamp = new Date(firstMedia.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable onPress={onPress} className="flex-1 gap-y-4 max-w-56">
      <View className="bg-light-background-primary dark:bg-dark-background-primary flex-1 h-60  rounded-3xl overflow-hidden relative">
        <StoryRenderer media={firstMedia} />
        <Text className="absolute bottom-2 left-2 text-light-text-primary dark:text-dark-text-primary font-normal text-sm">
          {timestamp}
        </Text>
      </View>
      <View className="flex-row items-center gap-x-2">
        <Image
          source={{ uri: avatar || "" }}
          className="w-10 h-10 rounded-full"
        />
        <Text className="text-light-text-primary dark:text-dark-text-primary font-bold">
          {name}
        </Text>
      </View>
    </Pressable>
  );
};

const StoryRenderer = ({ media }: { media: StoryMedia }) => {
  if (media.mediaType === "image") {
    return <Image source={{ uri: media.mediaUrl }} className="w-full h-full" />;
  }

  const iconColor = useIconColor();
  const { data, loading, error } = useFetch(() =>
    generateThumbnail(media.mediaUrl),
  );

  if (loading) {
    return (
      <View className="w-full h-full items-center justify-center">
        <ActivityIndicator color={iconColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="w-full h-full items-center justify-center">
        <Text className="text-light-text-primary dark:text-dark-text-primary">
          Error
        </Text>
      </View>
    );
  }

  return <Image source={{ uri: data! }} className="w-full h-full" />;
};

export default OtherUsersStoryCard;
