import * as VideoThumbnails from "expo-video-thumbnails";

export const generateThumbnail = async (
  videoUrl: string
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
