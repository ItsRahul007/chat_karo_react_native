import { ColorTheme } from "@/constants/colors";
import useFetch from "@/custom-hooks/useFetch";
import { usePushNotification } from "@/custom-hooks/usePushNotification";
import { generateThumbnail } from "@/util/common.functions";
import { I_Media } from "@/util/types/chat.types";
import { AntDesign, Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  useColorScheme,
  View,
} from "react-native";

interface MediaItemProps extends I_Media {
  containerClassName?: string;
}

const MediaItem = ({
  mediaType,
  mediaUrl,
  containerClassName,
}: MediaItemProps) => {
  const theme = useColorScheme();
  const [showPreview, setShowPreview] = useState(false);
  usePushNotification();

  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

  const player = useVideoPlayer(mediaUrl!, (player) => {
    player.loop = false;
  });

  const handlePress = async () => {
    if (mediaType === "image" || mediaType === "video") {
      setShowPreview(true);
      if (mediaType === "video") {
        player.play();
      }
    } else if (mediaUrl?.split(".").pop() === "pdf") {
      const googleDriveUrl = `https://docs.google.com/viewer?url=${mediaUrl}`;
      const supported = await Linking.canOpenURL(googleDriveUrl);

      if (supported) {
        await Linking.openURL(googleDriveUrl);
      } else {
        Alert.alert("Error", "Cannot open this file");
      }
    } else {
      Alert.alert("Unsupported File", "This file type is not supported.");
    }
  };

  const closePreview = () => {
    if (mediaType === "video") {
      player.pause();
    }
    setShowPreview(false);
  };

  const handleSave = async () => {
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

      const downloadFile = async () => {
        // Create a 'download' channel for silent progress updates
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("download", {
            name: "Download Progress",
            importance: Notifications.AndroidImportance.LOW,
            sound: null,
            vibrationPattern: null,
          });
        }

        let lastNotificationId: string | null = null;
        let lastProgress = 0;

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
        };

        const downloadResumable = FileSystem.createDownloadResumable(
          mediaUrl,
          fileUri,
          {},
          callback
        );

        try {
          // Initial notification
          lastNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Downloading...",
              body: "Starting download...",
              priority: Notifications.AndroidNotificationPriority.LOW,
            },
            trigger: null,
          });

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

      // Check size
      try {
        const response = await fetch(mediaUrl, { method: "HEAD" });
        const contentLength = response.headers.get("content-length");
        const fileSizeInMB = contentLength
          ? parseInt(contentLength, 10) / (1024 * 1024)
          : 0;

        if (fileSizeInMB > 3) {
          Alert.alert(
            "Downloading...",
            `This file is large (${fileSizeInMB.toFixed(
              2
            )}MB) and may take a moment to download.`,
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
                  downloadFile();
                },
              },
            ]
          );
          return; // Stop execution, wait for user choice
        }
      } catch (e) {
        console.log("Error checking size", e);
      }

      // If small file or HEAD request failed, just download
      downloadFile();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save media.");
    }
  };

  const containerStyle =
    containerClassName || "h-24 w-24 items-center justify-center";

  const renderContent = () => {
    if (mediaType === "image") {
      return (
        <View className={containerStyle}>
          <Image
            source={{ uri: mediaUrl }}
            className="h-full w-full rounded-xl"
            resizeMode="cover"
          />
        </View>
      );
    }

    if (mediaType === "video") {
      const { data, loading, error } = useFetch(() =>
        generateThumbnail(mediaUrl!)
      );

      return (
        <View className={containerStyle}>
          {loading ? (
            <ActivityIndicator color={iconColor} />
          ) : error ? (
            <View className="h-full w-full items-center justify-center bg-white dark:bg-black rounded-xl">
              <AntDesign name="play-circle" size={24} color={iconColor} />
            </View>
          ) : data ? (
            <View className="relative h-full w-full">
              <Image
                source={{ uri: data }}
                className="h-full w-full rounded-xl"
                resizeMode="cover"
              />
              <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-xl">
                <Ionicons name="play-circle" size={30} color="white" />
              </View>
            </View>
          ) : null}
        </View>
      );
    }

    if (mediaType === "audio") {
      return (
        <View className={`${containerStyle} bg-white dark:bg-black rounded-xl`}>
          <Ionicons name="musical-note" size={24} color={iconColor} />
        </View>
      );
    }

    // if the file is an pdf
    if (mediaUrl?.split(".").pop() === "pdf") {
      return (
        <View className={`${containerStyle} bg-white dark:bg-black rounded-xl`}>
          <FontAwesome6 name="file-pdf" size={24} color={iconColor} />
        </View>
      );
    }

    return (
      <View className={`${containerStyle} bg-white dark:bg-black rounded-xl`}>
        <Feather name="file" size={24} color={iconColor} />
      </View>
    );
  };

  return (
    <>
      <Pressable onPress={handlePress}>{renderContent()}</Pressable>

      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View className="flex-1 bg-black/60 justify-center items-center relative">
          <Pressable
            onPress={closePreview}
            className="p-2 absolute top-6 left-6 z-[500]"
          >
            <Ionicons name="close" size={30} color="white" />
          </Pressable>

          <Pressable
            onPress={handleSave}
            className="p-2 absolute top-6 right-6 z-[500]"
          >
            <AntDesign name="download" size={30} color="white" />
          </Pressable>

          {mediaType === "image" && (
            <Image
              source={{ uri: mediaUrl }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}

          {mediaType === "video" && (
            <VideoView
              style={{ width: "100%", height: "100%" }}
              player={player}
              fullscreenOptions={{
                enable: true,
              }}
              nativeControls
            />
          )}
        </View>
      </Modal>
    </>
  );
};

export default MediaItem;
