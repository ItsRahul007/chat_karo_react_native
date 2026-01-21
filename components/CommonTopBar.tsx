import { ColorTheme } from "@/constants/colors";
import { SearchParams } from "@/util/enum";
import { Entypo } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React from "react";
import { Image, Pressable, Text, useColorScheme, View } from "react-native";

interface CommonTopBarProps {
  name: string;
  searchParams?: SearchParams;
  image?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  onBackPress?: () => void;
}

const CommonTopBar = ({
  name,
  searchParams,
  image,
  showBackButton = false,
  showSearch = true,
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
        {image ? (
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
        ) : null}
        <Text className="text-light-text-primary dark:text-dark-text-primary text-2xl font-bold">
          {name}
        </Text>
      </View>
      {showSearch ? (
        <Link href={`/search?for=${searchParams}`} asChild>
          <Pressable>
            <FontAwesome name="search" size={26} color={iconColor} />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
};

export default CommonTopBar;
