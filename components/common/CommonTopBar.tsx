import { ColorTheme } from "@/constants/colors";
import { useIconColor } from "@/util/common.functions";
import { SearchParams } from "@/util/enum";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import CommonBackButton from "./CommonBackButton";

type BaseProps = {
  name?: string;
  image?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

type WithSearchProps = BaseProps & {
  showSearch?: true;
  searchParams: SearchParams;
  communityId?: string;
};

type WithoutSearchProps = BaseProps & {
  showSearch: false;
  searchParams?: never;
  communityId?: never;
};

type CommonTopBarProps = WithSearchProps | WithoutSearchProps;

const CommonTopBar = (props: CommonTopBarProps) => {
  const {
    name,
    image,
    showBackButton = false,
    onBackPress,
    searchParams,
    showSearch = true,
    communityId,
  } = props;
  const iconColor = useIconColor();

  return (
    <View className="flex-row items-center justify-between px-6 h-10 w-full">
      <View className="flex-row gap-x-4 items-center">
        {showBackButton ? <CommonBackButton onBackPress={onBackPress} /> : null}
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
        <Link
          href={`/search?for=${searchParams}${communityId ? `&communityId=${communityId}` : ""}`}
          asChild
        >
          <Pressable>
            <FontAwesome name="search" size={26} color={iconColor} />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
};

export default CommonTopBar;
