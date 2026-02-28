import { ColorTheme } from "@/constants/colors";
import React from "react";
import { useColorScheme, View } from "react-native";
import SkeletonBase from "./SkeletonBase";

const ChatProfileSkeleton = () => {
  const theme = useColorScheme();
  const skeletonColor =
    theme === "light"
      ? ColorTheme.light.text.secondaryLight
      : ColorTheme.dark.text.secondaryLight;

  return (
    <View className="flex-row items-center gap-x-2 flex-1">
      <SkeletonBase
        width={56}
        height={56}
        borderRadius={28}
        // Using secondary light with opacity for skeleton to match header
        style={{ backgroundColor: skeletonColor, opacity: 0.2 }}
      />
      <View className="flex-1 gap-y-2 justify-center">
        <SkeletonBase
          width="60%"
          height={18}
          borderRadius={4}
          style={{ backgroundColor: skeletonColor, opacity: 0.2 }}
        />
        <SkeletonBase
          width="40%"
          height={14}
          borderRadius={4}
          style={{ backgroundColor: skeletonColor, opacity: 0.2 }}
        />
      </View>
    </View>
  );
};

export default ChatProfileSkeleton;
