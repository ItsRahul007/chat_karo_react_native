import { StoryRow } from "@/util/interfaces/types";
import { Entypo } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import StoryThumbnail from "./StoryThumbnail";

const MyStoryCard = ({
  story,
  onPress,
  onRemove,
}: {
  story: StoryRow;
  onPress: () => void;
  onRemove?: (story: StoryRow) => void;
}) => {
  return (
    <View className="relative w-40 h-40 p-1">
      <Pressable onPress={onPress} className="flex-1">
        <StoryThumbnail
          uri={story.fileUrl}
          fileType={story.fileType}
          className="h-full w-full rounded-3xl"
        />
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={() => onRemove(story)}
          className="absolute right-0 top-0 bg-crossIconBg rounded-full p-1 items-center justify-center border-2 border-light-background-primary dark:border-dark-background-primary"
        >
          <Entypo name="cross" size={15} color="white" />
        </Pressable>
      ) : null}
    </View>
  );
};

export default MyStoryCard;
