import { ColorTheme } from "@/constants/colors";
import React from "react";
import { useColorScheme, View } from "react-native";
import SkeletonBase from "./SkeletonBase";

const MessageListSkeleton = () => {
  const theme = useColorScheme();
  // using secondary background color as it matches chat message bubbles generally or we can use generic skeleton color
  const skeletonColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  return (
    <View className="flex-1 px-4 py-4 gap-y-6">
      <View className="flex-row justify-start">
        <SkeletonBase
          width="60%"
          height={45}
          borderRadius={16}
          style={{
            backgroundColor: skeletonColor,
            opacity: 0.2,
            borderTopLeftRadius: 4,
          }}
        />
      </View>

      <View className="flex-row justify-end">
        <SkeletonBase
          width="50%"
          height={45}
          borderRadius={16}
          style={{
            backgroundColor: skeletonColor,
            opacity: 0.2,
            borderTopRightRadius: 4,
          }}
        />
      </View>

      <View className="flex-row justify-start">
        <SkeletonBase
          width="75%"
          height={65}
          borderRadius={16}
          style={{
            backgroundColor: skeletonColor,
            opacity: 0.2,
            borderTopLeftRadius: 4,
          }}
        />
      </View>

      <View className="flex-row justify-end">
        <SkeletonBase
          width="40%"
          height={45}
          borderRadius={16}
          style={{
            backgroundColor: skeletonColor,
            opacity: 0.2,
            borderTopRightRadius: 4,
          }}
        />
      </View>

      <View className="flex-row justify-start">
        <SkeletonBase
          width="55%"
          height={45}
          borderRadius={16}
          style={{
            backgroundColor: skeletonColor,
            opacity: 0.2,
            borderTopLeftRadius: 4,
          }}
        />
      </View>
    </View>
  );
};

export default MessageListSkeleton;
