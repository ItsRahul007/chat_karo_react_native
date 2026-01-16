import { I_Media } from "@/util/types/chat.types";
import { Text, View } from "react-native";
import MediaItem from "./MediaItem";

const MediaGrid = ({ media }: { media: I_Media[] | undefined }) => {
  if (!media || media.length === 0) return null;

  if (media.length === 1) {
    return (
      <MediaItem
        {...media[0]}
        containerClassName="w-64 h-64 bg-black/10 items-center justify-center"
      />
    );
  }

  if (media.length === 2) {
    return (
      <View className="flex-row flex-wrap w-72 h-32 overflow-hidden gap-x-1">
        {media.map((item, index) => (
          <MediaItem
            key={index}
            {...item}
            containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap w-72 h-64 overflow-hidden gap-1">
      <MediaItem
        {...media[0]}
        containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
      />
      <MediaItem
        {...media[1]}
        containerClassName="w-32 h-32 bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
      />
      <View className="relative w-64 h-32">
        <MediaItem
          {...media[2]}
          containerClassName="w-full h-full bg-black/10 items-center justify-center border-white/20 border-[0.5px]"
        />
        {media.length > 3 && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center z-10">
            <Text className="text-white font-bold text-3xl">
              +{media.length - 3}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MediaGrid;
