import { ColorTheme } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
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

export default AudioMessage;
