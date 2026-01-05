import { ColorTheme } from "@/constants/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface CommonTopBarProps {
  name: string;
  onPress: () => void;
  image: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const CommonTopBar = ({
  name,
  onPress,
  image,
  showBackButton = false,
  onBackPress,
}: CommonTopBarProps) => {
  return (
    <View className="flex-row items-center justify-between px-6">
      <View className="flex-row gap-x-4 items-center">
        {showBackButton ? (
          <Pressable onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
        ) : null}
        <LinearGradient
          colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-full h-14 w-14 overflow-hidden"
        >
          <Image source={{ uri: image }} className="w-full h-full" />
        </LinearGradient>
        <Text className="text-light-text-primary text-2xl font-bold">
          {name}
        </Text>
      </View>
      <Pressable onPress={onPress}>
        <FontAwesome
          name="search"
          size={26}
          color={ColorTheme.light.text.primary}
        />
      </Pressable>
    </View>
  );
};

export default CommonTopBar;
