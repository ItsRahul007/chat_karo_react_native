import { TableNames } from "@/util/enum";
import {
  CommunityCardProps,
  PersonCardProps,
} from "@/util/interfaces/commonInterfaces";
import {
  MediaAttachment,
  Message,
  SingleChat,
  SingleCommunityChat,
} from "@/util/interfaces/types";
import { chatList, sampleCommunityData } from "@/util/sample.data";
import { supabase } from "@/util/supabase";
import { Toast } from "@/util/toast";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

const getChatHistoryById = (
  chatId: string,
  isCommunity: boolean,
): PersonCardProps | CommunityCardProps | null => {
  try {
    if (isCommunity) {
      return sampleCommunityData.filter((chat) => chat.id === chatId)[0];
    }

    return chatList.filter((chat) => chat.id === chatId)[0];
  } catch (error) {
    console.log(error);
    return null;
  }
};

const saveMediaIntoDevice = async ({ type, url }: MediaAttachment) => {
  if (!url) return;

  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to save media.",
      );
      return;
    }

    const urlWithoutParams = url.split("?")[0];
    let fileExtension = urlWithoutParams.split(".").pop();

    // Fallback if extension is invalid or missing
    if (
      !fileExtension ||
      fileExtension.length > 5 ||
      fileExtension.includes("/")
    ) {
      if (type === "image") fileExtension = "jpg";
      else if (type === "video") fileExtension = "mp4";
      else if (type === "audio") fileExtension = "mp3";
      else fileExtension = fileExtension ?? "file";
    }

    const fileUrlName = urlWithoutParams.split("/").pop();
    const fileName = `chat_karo_${Date.now()}_${fileUrlName}.${fileExtension}`;
    // @ts-ignore
    const fileUri = FileSystem.cacheDirectory + fileName;

    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    const fileSizeInMB = contentLength
      ? parseInt(contentLength, 10) / (1024 * 1024)
      : 0;

    if (fileSizeInMB > 3) {
      Alert.alert(
        "Download",
        `This file is large (${fileSizeInMB.toFixed(
          2,
        )}MB) and may take a moment to download. Do you want to continue?`,
        [
          {
            text: "Cancel",
            onPress: () => {
              return;
            },
            style: "cancel",
          },
          {
            text: "Download",
            onPress: () => {
              downloadFile({
                notification: true,
                mediaType: type!,
                mediaUrl: url,
                fileUri,
              });
            },
          },
        ],
      );
      return; // Stop execution, wait for user choice
    }

    // If small file or HEAD request failed, just download
    downloadFile({ mediaType: type!, mediaUrl: url, fileUri });
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to save media.");
  }
};

const downloadFile = async ({
  notification = false,
  mediaType,
  mediaUrl,
  fileUri,
}: {
  notification?: boolean;
  mediaType: string;
  mediaUrl: string;
  fileUri: string;
}) => {
  // Create a 'download' channel for silent progress updates
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("download", {
      name: "Download Progress",
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  let lastNotificationId: string | null = null;
  let lastProgress = 0;

  try {
    const callback = async (
      downloadProgress: FileSystem.DownloadProgressData,
    ) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;

      // Update notification every 15% to avoid spamming/lag
      if (progress - lastProgress >= 0.15 || progress === 1) {
        lastProgress = progress;
        const percentage = Math.round(progress * 100);

        if (lastNotificationId) {
          await Notifications.dismissNotificationAsync(lastNotificationId);
        }

        if (notification) {
          lastNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Downloading...",
              body: `${percentage}% completed`,
              priority: Notifications.AndroidNotificationPriority.LOW,
              sound: false,
            },
            trigger: null,
          });
        }
      }
    };

    const downloadResumable = FileSystem.createDownloadResumable(
      mediaUrl,
      fileUri,
      {},
      callback,
    );

    // Initial notification
    if (notification) {
      lastNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Downloading...",
          body: "Starting download...",
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
        trigger: null,
      });
    }

    const result = await downloadResumable.downloadAsync();
    if (result && result.uri) {
      // Dismiss progress notification
      if (lastNotificationId) {
        await Notifications.dismissNotificationAsync(lastNotificationId);
      }

      // Save to lib
      if (mediaType === "image" || mediaType === "video") {
        await MediaLibrary.saveToLibraryAsync(result.uri);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Saved!",
            body: "Media saved to your gallery.",
          },
          trigger: null,
        });
      } else {
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        await MediaLibrary.createAlbumAsync("ChatKaro", asset, false);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Saved!",
            body: "File saved successfully.",
          },
          trigger: null,
        });
      }
    }
  } catch (e) {
    console.error(e);
    if (lastNotificationId) {
      await Notifications.dismissNotificationAsync(lastNotificationId);
    }
    Alert.alert("Error", "Download failed.");
  }
};

const getPrivateChats = async (): Promise<SingleChat[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || !user.user.email) return [];

    const { data: userProfile, error: profileError } = await supabase
      .from(TableNames.users)
      .select("id")
      .eq("email", user.user.email)
      .single();

    if (profileError || !userProfile) {
      Toast.error("Error fetching profile");
      console.error("Error fetching profile:", profileError);
      return [];
    }

    const { data, error } = await supabase
      .from(TableNames.inbox)
      .select("*")
      .eq("myId", userProfile.id)
      .eq("isGroup", false)
      .order("lastMessage->>createdAt", { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    Toast.error("Error fetching chats");
    console.error("Error fetching chats:", error);
    return [];
  }
};

const getCommunityChats = async (): Promise<SingleCommunityChat[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || !user.user.email) return [];

    const { data: userProfile, error: profileError } = await supabase
      .from(TableNames.users)
      .select("id")
      .eq("email", user.user.email)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching profile:", profileError);
      return [];
    }

    const { data, error } = await supabase
      .from(TableNames.inbox)
      .select("*")
      .eq("myId", userProfile.id)
      .eq("isGroup", true)
      .order("lastMessage->>createdAt", { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
};

//? used for fetching chat messages
const getChatById = async (
  id: string,
  isGroup: boolean,
): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from(TableNames.messages)
      .select(isGroup ? "*, sender:users (firstName, lastName, avatar)" : "*")
      .eq("conversationId", id)
      .order("createdAt", { ascending: true });

    if (error) throw error;

    return data.map((message: any) => {
      return {
        ...message,
        sender: isGroup ? message.sender : null,
      };
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    Toast.error("Error fetching chat");
    return [];
  }
};

//? used for fetching chat detail (group/person name, and avatar)
const getChatProfileById = async (
  id: string,
  isGroup: boolean,
): Promise<{
  avatar: string;
  name: string;
  id: bigint;
} | null> => {
  try {
    if (isGroup) {
      const { data, error } = await supabase
        .from(TableNames.conversations)
        .select("groupName,groupImage,id")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        avatar: data.groupImage,
        name: data.groupName,
        id: data.id,
      };
    } else {
      const { data, error } = await supabase
        .from(TableNames.users)
        .select("firstName,lastName,avatar,id")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        avatar: data.avatar,
        name: `${data.firstName} ${data.lastName}`,
        id: data.id,
      };
    }
  } catch (error) {
    console.error("Error fetching chat profile detail:", error);
    Toast.error("Error fetching chat profile detail");
    return null;
  }
};

export {
  getChatById,
  getChatHistoryById,
  getChatProfileById,
  getCommunityChats,
  getPrivateChats,
  saveMediaIntoDevice,
};
