import { ColorTheme } from "@/constants/colors";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useColorScheme } from "react-native";
import { supabase } from "./supabase";

const generateThumbnail = async (
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

const useIconColor = () => {
  const theme = useColorScheme();

  if (theme === "light") {
    return ColorTheme.light.text.primary;
  } else {
    return ColorTheme.dark.text.primary;
  }
};

const getMimeType = (uri: string) => {
  const extension = uri.split(".").pop();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
};

const handleUploadFile = async (
  file: { uri: string; fileName?: string | null; mimeType?: string },
  bucket: "chat-files" | "profile-pictures" | "stories",
): Promise<{
  success: boolean;
  data?: string;
}> => {
  const formData = new FormData();
  const mimeType = file.mimeType || getMimeType(file.uri);
  const fileName =
    file.fileName || `file_${Date.now()}.${mimeType.split("/")[1]}`;

  formData.append("file", {
    uri: file.uri,
    name: fileName,
    type: mimeType,
  } as any);

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, formData, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("Error uploading file:", error);
      return { success: false };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, data: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false };
  }
};

export { generateThumbnail, handleUploadFile, useIconColor };
