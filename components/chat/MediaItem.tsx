import { ColorTheme } from "@/constants/colors";
import { saveMediaIntoDevice } from "@/controller/chat.controller";
import useFetch from "@/custom-hooks/useFetch";
import { generateThumbnail } from "@/util/common.functions";
import { I_Media } from "@/util/types/chat.types";
import { AntDesign, Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface MediaItemProps extends I_Media {
  containerClassName?: string;
}

const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

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
    if (mediaType === "audio") return;

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

  return (
    <>
      <Pressable onPress={handlePress}>
        <RenderContent
          mediaType={mediaType!}
          mediaUrl={mediaUrl!}
          containerClassName={containerClassName}
          iconColor={iconColor}
        />
      </Pressable>

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

const RenderContent = ({
  mediaType,
  mediaUrl,
  containerClassName,
  iconColor,
}: {
  mediaType: string;
  mediaUrl: string;
  containerClassName?: string;
  iconColor: string;
}) => {
  const containerStyle =
    containerClassName || "h-24 w-24 items-center justify-center";

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
      generateThumbnail(mediaUrl!),
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
    return <AudioMessage mediaUrl={mediaUrl!} />;
  }

  // if the file is an pdf
  if (mediaUrl?.split(".").pop() === "pdf") {
    const fileName = mediaUrl?.split("/").pop();
    const formatedName = fileName!.charAt(0).toUpperCase() + fileName!.slice(1);
    return (
      <View
        className={`min-w-24 bg-light-background-secondary/10 dark:bg-dark-background-secondary/10 rounded-xl flex-row w-full h-auto p-5 items-center justify-start`}
      >
        <FontAwesome6 name="file-pdf" size={24} color={iconColor} />
        <Text
          className="ml-2 text-light-text-primary dark:text-dark-text-primary"
          numberOfLines={2}
        >
          {formatedName}
        </Text>
      </View>
    );
  }

  const fileName = mediaUrl?.split("/").pop();
  const formatedName = fileName!.charAt(0).toUpperCase() + fileName!.slice(1);

  return (
    <View
      className={`min-w-24 bg-light-background-secondary/10 dark:bg-dark-background-secondary/10 rounded-xl flex-row w-full h-auto p-5 items-center justify-start`}
    >
      <Feather name="file" size={24} color={iconColor} />
      <Text
        className="ml-2 text-light-text-primary dark:text-dark-text-primary"
        numberOfLines={2}
      >
        {formatedName}
      </Text>
    </View>
  );
};

const AudioMessage = ({ mediaUrl }: { mediaUrl: string }) => {
  const player = useAudioPlayer(mediaUrl);
  const status = useAudioPlayerStatus(player);
  const theme = useColorScheme();
  const secondaryText =
    theme === "light"
      ? ColorTheme.light.text.secondaryDark
      : ColorTheme.dark.text.secondaryDark;

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View className="flex-row items-center w-64 p-3 gap-2 bg-light-background-secondary/10 dark:bg-dark-background-secondary/10 rounded-xl">
      <View className="items-center justify-center h-10 w-10 bg-gradientSecond rounded-full">
        {status.isBuffering || !status.isLoaded ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Pressable onPress={togglePlayback}>
            <Ionicons
              name={status.playing ? "pause" : "play"}
              size={20}
              color="#fff"
            />
          </Pressable>
        )}
      </View>

      <View className="flex-1 gap-y-0.5">
        <Slider
          style={{ width: "100%", height: 30 }}
          minimumValue={0}
          maximumValue={status.duration}
          value={status.currentTime}
          onSlidingComplete={(val) => player.seekTo(val)}
          minimumTrackTintColor={ColorTheme.gradientSecond}
          maximumTrackTintColor={secondaryText}
          thumbTintColor={ColorTheme.gradientSecond}
        />
        <View className="flex-row justify-start px-2">
          <Text className="text-sm text-light-text-secondaryDark dark:text-dark-text-secondaryDark">
            {status.playing
              ? formatTime(status.currentTime)
              : formatTime(status.duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};
