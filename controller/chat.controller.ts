import { PersonCardProps } from "@/util/interfaces/commonInterfaces";
import { chatList } from "@/util/sample.data";
import { I_Media } from "@/util/types/chat.types";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

const getChatHistoryById = (chatId: string): PersonCardProps | null => {
  try {
    return chatList.filter((chat) => chat.id === chatId)[0];
  } catch (error) {
    console.log(error);
    return null;
  }
};

const saveMediaIntoDevice = async ({ mediaType, mediaUrl }: I_Media) => {
  if (!mediaUrl) return;

  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to save media."
      );
      return;
    }

    const urlWithoutParams = mediaUrl.split("?")[0];
    let fileExtension = urlWithoutParams.split(".").pop();

    // Fallback if extension is invalid or missing
    if (
      !fileExtension ||
      fileExtension.length > 5 ||
      fileExtension.includes("/")
    ) {
      if (mediaType === "image") fileExtension = "jpg";
      else if (mediaType === "video") fileExtension = "mp4";
      else if (mediaType === "audio") fileExtension = "mp3";
      else fileExtension = fileExtension ?? "file";
    }

    const fileUrlName = urlWithoutParams.split("/").pop();
    const fileName = `chat_karo_${Date.now()}_${fileUrlName}.${fileExtension}`;
    // @ts-ignore
    const fileUri = FileSystem.cacheDirectory + fileName;

    const response = await fetch(mediaUrl, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    const fileSizeInMB = contentLength
      ? parseInt(contentLength, 10) / (1024 * 1024)
      : 0;

    if (fileSizeInMB > 3) {
      Alert.alert(
        "Download",
        `This file is large (${fileSizeInMB.toFixed(
          2
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
                mediaType: mediaType!,
                mediaUrl,
                fileUri,
              });
            },
          },
        ]
      );
      return; // Stop execution, wait for user choice
    }

    // If small file or HEAD request failed, just download
    downloadFile({ mediaType: mediaType!, mediaUrl, fileUri });
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
      downloadProgress: FileSystem.DownloadProgressData
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
      callback
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

export { getChatHistoryById, saveMediaIntoDevice };
