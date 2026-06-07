import useFetch from "@/custom-hooks/useFetch";
import { generateThumbnail, useIconColor } from "@/util/common.functions";
import { ActivityIndicator, Image, Text, View } from "react-native";

// Renders a thumbnail for a story slide. Images render directly; videos resolve
// a poster frame via generateThumbnail. `className` controls size/rounding.
const StoryThumbnail = ({
  uri,
  fileType,
  className = "",
}: {
  uri: string;
  fileType: "image" | "video";
  className?: string;
}) => {
  if (fileType === "image") {
    return <Image source={{ uri }} className={className} resizeMode="cover" />;
  }
  return <VideoThumbnail uri={uri} className={className} />;
};

const VideoThumbnail = ({
  uri,
  className,
}: {
  uri: string;
  className: string;
}) => {
  const iconColor = useIconColor();
  const { data, loading } = useFetch(() => generateThumbnail(uri));

  if (data) {
    return <Image source={{ uri: data }} className={className} resizeMode="cover" />;
  }

  return (
    <View
      className={`${className} items-center justify-center bg-light-background-secondary dark:bg-dark-background-secondary`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <Text className="text-light-text-primary dark:text-dark-text-primary text-xs">
          Unable to load
        </Text>
      )}
    </View>
  );
};

export default StoryThumbnail;
