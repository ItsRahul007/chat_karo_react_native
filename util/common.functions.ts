import { ColorTheme } from "@/constants/colors";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useColorScheme } from "react-native";
import { BucketNames } from "./enum";
import { StoryRow } from "./interfaces/types";
import { supabase } from "./supabase";

type StoryAuthor = StoryRow["users"];

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

// PostgREST returns a many-to-one embed as an object, but be defensive in case
// it arrives as a single-element array.
const getStoryAuthor = (users: StoryAuthor | StoryAuthor[]): StoryAuthor =>
  Array.isArray(users) ? (users[0] ?? null) : users;

const getStoryAuthorName = (users: StoryAuthor | StoryAuthor[]): string => {
  const user = getStoryAuthor(users);
  if (!user) return "";
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.userName || "";
};

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
  bucket: BucketNames,
): Promise<{
  success: boolean;
  data?: string;
  fileName?: string;
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

    return {
      success: true,
      data: publicUrlData.publicUrl,
      fileName: data.path,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false };
  }
};

const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "3gp"];

// The story table has no mediaType column yet, so infer it from the file
// extension. Falls back to "image" for extensionless / unknown urls.
const inferMediaType = (uri: string): "image" | "video" => {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  return ext && videoExtensions.includes(ext) ? "video" : "image";
};

const useFormatedTime = (date: string): string => {
  const formatedDate = new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatedDate;
};

export {
  generateThumbnail,
  getStoryAuthor,
  getStoryAuthorName,
  handleUploadFile,
  inferMediaType,
  ONE_DAY,
  ONE_MINUTE,
  ONE_SECOND,
  useFormatedTime,
  useIconColor,
};
