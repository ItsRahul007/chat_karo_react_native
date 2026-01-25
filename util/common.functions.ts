import { ColorTheme } from "@/constants/colors";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useColorScheme } from "react-native";

export const generateThumbnail = async (
  videoUrl: string,
): Promise<string | undefined> => {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
      time: 15000,
    });
    return uri;
  } catch (e) {
    console.warn(e);
    return undefined;
  }
};

export const useIconColor = () => {
  const theme = useColorScheme();

  if (theme === "light") {
    return ColorTheme.light.text.primary;
  } else {
    return ColorTheme.dark.text.primary;
  }
};
