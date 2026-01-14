import { ColorTheme } from "@/constants/colors";
import { saveMediaIntoDevice } from "@/controller/chat.controller";
import useFetch from "@/custom-hooks/useFetch";
import { generateThumbnail } from "@/util/common.functions";
import { I_Media } from "@/util/types/chat.types";
import { AntDesign, Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
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
    await saveMediaIntoDevice({ mediaType, mediaUrl });
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
