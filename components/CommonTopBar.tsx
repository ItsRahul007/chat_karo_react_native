import { ColorTheme } from "@/constants/colors";
import { Entypo } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Pressable, Text, useColorScheme, View } from "react-native";

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
  const theme = useColorScheme();
  const iconColor =
    theme === "light"
      ? ColorTheme.light.text.primary
      : ColorTheme.dark.text.primary;

  return (
    <View className="flex-row items-center justify-between px-6 h-10 w-full">
      <View className="flex-row gap-x-4 items-center">
        {showBackButton ? (
          <Pressable onPress={onBackPress}>
            <Entypo name="chevron-left" size={30} color={iconColor} />
          </Pressable>
        ) : null}
        <View className="rounded-full h-14 w-14 overflow-hidden">
          <LinearGradient
            colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 56, width: 56 }}
          >
            <Image source={{ uri: image }} className="w-full h-full" />
          </LinearGradient>
        </View>
        <Text className="text-light-text-primary dark:text-dark-text-primary text-2xl font-bold">
          {name}
        </Text>
      </View>
      <Pressable onPress={onPress}>
        <FontAwesome name="search" size={26} color={iconColor} />
      </Pressable>
    </View>
  );
};

export default CommonTopBar;
