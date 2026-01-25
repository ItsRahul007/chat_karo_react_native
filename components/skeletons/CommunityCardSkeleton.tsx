import { ColorTheme } from "@/constants/colors";
import React from "react";
import { useColorScheme, View } from "react-native";
import SkeletonBase from "./SkeletonBase";

const CommunityCardSkeleton = () => {
  const theme = useColorScheme();
  const skeletonColor =
    theme === "light"
      ? ColorTheme.light.background.primary
      : ColorTheme.dark.background.primary;

  const cardBackgroundColor =
    theme === "light"
      ? ColorTheme.light.comunityCard.background
      : ColorTheme.dark.comunityCard.background;

  return (
    <View className="bg-light-comunityCard-background dark:bg-dark-comunityCard-background w-[26rem] h-44 flex flex-col rounded-3xl px-4 py-2 justify-evenly">
      {/* Top Section */}
      <View className="flex-row gap-2 items-center">
        {/* Avatar Box */}
        <SkeletonBase
          width={56}
          height={56}
          borderRadius={12}
          style={{ backgroundColor: skeletonColor }}
        />
        {/* Right Side */}
        <View className="flex-1 flex-row justify-between items-center gap-x-3">
          <View className="flex-1 gap-y-2">
            {/* Name */}
            <SkeletonBase
              width={120}
              height={20}
              borderRadius={4}
              style={{ backgroundColor: skeletonColor }}
            />
            {/* MessageBox: Sender + Text */}
            <View className="flex-row items-center gap-x-2">
              <SkeletonBase
                width={50}
                height={16}
                borderRadius={4}
                style={{ backgroundColor: skeletonColor }}
              />
              <SkeletonBase
                width={100}
                height={16}
                borderRadius={4}
                style={{ backgroundColor: skeletonColor }}
              />
            </View>
          </View>
          {/* Unread Message Count */}
          <SkeletonBase
            width={24}
            height={24}
            borderRadius={12}
            style={{ backgroundColor: skeletonColor }}
          />
        </View>
      </View>

      {/* Avatar Group */}
      <View className="flex-row items-center justify-start ml-2">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBase
            key={i}
            width={48}
            height={48}
            borderRadius={24}
            style={{
              backgroundColor: skeletonColor,
              marginLeft: i === 0 ? 0 : -12,
              zIndex: 4 - i,
              borderWidth: 3,
              borderColor: cardBackgroundColor,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default CommunityCardSkeleton;
