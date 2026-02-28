import { saveMediaIntoDevice } from "@/controller/chat.controller";
import useFetch from "@/custom-hooks/useFetch";
import { generateThumbnail, useIconColor } from "@/util/common.functions";
import { MediaAttachment } from "@/util/interfaces/types";
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
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AudioMessage from "./AudioMessage";

interface MediaItemProps extends MediaAttachment {
  containerClassName?: string;
  isForChat?: boolean;
}

const MediaItem = ({
  type,
  url,
  containerClassName,
  isForChat = false,
}: MediaItemProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const iconColor = useIconColor();

  const player = useVideoPlayer(url!, (player) => {
    player.loop = false;
  });

  const handlePress = async () => {
    if (type === "audio") {
      if (!isForChat) {
        setShowPreview(true);
      }
      return;
    }

    if (type === "image" || type === "video") {
      setShowPreview(true);
      if (type === "video") {
        player.play();
      }
    } else if (url?.split(".").pop() === "pdf") {
      const googleDriveUrl = `https://docs.google.com/viewer?url=${url}`;
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
    if (type === "video") {
      player.pause();
    }
    setShowPreview(false);
  };

  const handleSave = async () => {
    await saveMediaIntoDevice({ type, url });
  };

  return (
    <>
      <Pressable onPress={handlePress}>
        <RenderContent
          mediaType={type!}
          mediaUrl={url!}
          containerClassName={containerClassName}
          iconColor={iconColor}
          isForChat={isForChat}
        />
      </Pressable>

      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <SafeAreaView className="flex-1" edges={["top"]}>
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

            {type === "image" && (
              <Image
                source={{ uri: url }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}

            {type === "video" && (
              <VideoView
                style={{ width: "100%", height: "100%" }}
                player={player}
                fullscreenOptions={{
                  enable: true,
                }}
                nativeControls
              />
            )}

            {type === "audio" && (
              <View className="bg-white dark:bg-black p-4 rounded-2xl">
                <AudioMessage mediaUrl={url!} />
              </View>
            )}
          </View>
        </SafeAreaView>
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
  isForChat,
}: {
  mediaType: string;
  mediaUrl: string;
  containerClassName?: string;
  iconColor: string;
  isForChat: boolean;
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
    if (!isForChat) {
      return (
        <CommonFileBox
          mediaUrl={mediaUrl!}
          iconColor={iconColor}
          isAudio={true}
          containerStyle={containerStyle}
        />
      );
    }
    return <AudioMessage mediaUrl={mediaUrl!} />;
  }

  const fileName = mediaUrl?.split("/").pop();
  const formatedName = fileName!.charAt(0).toUpperCase() + fileName!.slice(1);

  // if the file is an pdf
  if (mediaType === "pdf") {
    if (!isForChat) {
      return (
        <CommonFileBox
          mediaUrl={mediaUrl!}
          iconColor={iconColor}
          isPdf={true}
          containerStyle={containerStyle}
        />
      );
    }

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

  if (!isForChat) {
    return (
      <CommonFileBox
        mediaUrl={mediaUrl!}
        iconColor={iconColor}
        containerStyle={containerStyle}
      />
    );
  }

  return (
    <View
      className={`min-w-24 bg-light-background-secondary/10 dark:bg-dark-background-secondary/10 rounded-xl flex-row w-full h-auto p-5 items-center justify-start`}
    >
      <Feather name="file" size={24} color={iconColor} />
      <Text
        className="ml-2 text-light-text-primary dark:text-dark-text-primary text-ellipsis"
        numberOfLines={2}
      >
        {formatedName}
      </Text>
    </View>
  );
};

const CommonFileBox = ({
  mediaUrl,
  iconColor,
  isPdf = false,
  isAudio = false,
  containerStyle,
}: {
  mediaUrl: string;
  iconColor: string;
  isPdf?: boolean;
  isAudio?: boolean;
  containerStyle?: string;
}) => {
  const fileName = mediaUrl?.split("/").pop();
  const formatedName = fileName!.charAt(0).toUpperCase() + fileName!.slice(1);

  return (
    <View
      className={`${containerStyle ?? ""} bg-white dark:bg-black rounded-xl items-center justify-start gap-y-2 p-1`}
    >
      {isPdf ? (
        <FontAwesome6 name="file-pdf" size={24} color={iconColor} />
      ) : isAudio ? (
        <Ionicons name="musical-note" size={24} color={iconColor} />
      ) : (
        <Feather name="file" size={24} color={iconColor} />
      )}
      <Text
        className="ml-2 text-sm text-light-text-primary dark:text-dark-text-primary text-ellipsis"
        numberOfLines={2}
      >
        {formatedName}
      </Text>
    </View>
  );
};
