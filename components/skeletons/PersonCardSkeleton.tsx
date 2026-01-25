import { ColorTheme } from "@/constants/colors";
import React from "react";
import { useColorScheme, View } from "react-native";
import SkeletonBase from "./SkeletonBase";

const PersonCardSkeleton = () => {
  const theme = useColorScheme();
  const skeletonColor =
    theme === "light"
      ? ColorTheme.light.background.primary
      : ColorTheme.dark.background.primary;

  return (
    <View className="w-full flex-row items-center justify-start gap-x-4">
      {/* Avatar Skeleton */}
      <SkeletonBase
        width={64}
        height={64}
        borderRadius={32}
        style={{ backgroundColor: skeletonColor }}
      />

      <View className="flex-1 flex-row items-start justify-between">
        <View className="flex-1 gap-y-2">
          {/* Name Skeleton */}
          <SkeletonBase
            width="60%"
            height={20}
            borderRadius={4}
            style={{ backgroundColor: skeletonColor }}
          />
          {/* Message/Typing Skeleton */}
          <SkeletonBase
            width="80%"
            height={16}
            borderRadius={4}
            style={{ backgroundColor: skeletonColor }}
          />
        </View>

        <View className="items-end gap-y-2">
          {/* Time Skeleton */}
          <SkeletonBase
            width={40}
            height={14}
            borderRadius={4}
            style={{ backgroundColor: skeletonColor }}
          />
          {/* Unread Count Skeleton (optional, maybe just a small circle) */}
          <SkeletonBase
            width={20}
            height={20}
            borderRadius={10}
            style={{ backgroundColor: skeletonColor }}
          />
        </View>
      </View>
    </View>
  );
};

export default PersonCardSkeleton;
