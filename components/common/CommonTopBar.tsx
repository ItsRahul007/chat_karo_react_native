import { ColorTheme } from "@/constants/colors";
import { getIconColor } from "@/util/common.functions";
import { SearchParams } from "@/util/enum";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import CommonBackButton from "./CommonBackButton";

interface CommonTopBarProps {
  name?: string;
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
  const router = useRouter();
  const iconColor = getIconColor();

  return (
    <View className="flex-row items-center justify-between px-6 h-10 w-full">
      <View className="flex-row gap-x-4 items-center">
        {showBackButton ? <CommonBackButton /> : null}
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
        {name ? (
          <Text className="text-light-text-primary dark:text-dark-text-primary text-2xl font-bold">
            {name}
          </Text>
        ) : null}
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
