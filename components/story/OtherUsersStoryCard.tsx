import { getStoryAuthor, getStoryAuthorName } from "@/util/common.functions";
import { StoryRow } from "@/util/interfaces/types";
import { Image, Pressable, Text, View } from "react-native";
import StoryThumbnail from "./StoryThumbnail";

const OtherUsersStoryCard = ({
  story,
  isSeen,
  onPress,
}: {
  story: StoryRow[];
  isSeen: boolean;
  onPress: () => void;
}) => {
  const author = getStoryAuthor(story[0]?.users);
  const name = getStoryAuthorName(story[0]?.users);
  const avatar = author?.avatar ?? "";
  const lastMedia = story[story.length - 1];
  const timestamp = new Date(lastMedia.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable onPress={onPress} className="flex-1 gap-y-4 max-w-56">
      <View className="bg-light-background-primary dark:bg-dark-background-primary flex-1 h-60 rounded-3xl overflow-hidden relative">
        <StoryThumbnail
          uri={lastMedia.fileUrl}
          fileType={lastMedia.fileType}
          className="w-full h-full"
        />
        <Text className="absolute bottom-2 left-2 text-dark-text-primary font-normal text-sm bg-black/50 px-2 py-1 rounded-full">
          {timestamp}
        </Text>
      </View>
      <View className="flex-row items-center gap-x-2">
        <View
          className={`rounded-full p-0.5 border-2 ${
            isSeen
              ? "border-light-text-secondary/40 dark:border-dark-text-secondary/40"
              : "border-gradientFirst"
          }`}
        >
          <Image
            source={{ uri: avatar || "" }}
            className="w-10 h-10 rounded-full"
          />
        </View>
        <Text className="text-light-text-primary dark:text-dark-text-primary font-bold">
          {name}
        </Text>
      </View>
    </Pressable>
  );
};

export default OtherUsersStoryCard;
