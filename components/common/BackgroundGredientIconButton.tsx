import { ColorTheme } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

const BackgroundGredientIconButton = ({
  icon,
  onPress,
  size,
  className,
  isLoading = false,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  size: number;
  className?: string;
  isLoading?: boolean;
}) => {
  return (
    <Pressable onPress={isLoading ? undefined : onPress} className={className}>
      <View className="rounded-full h-16 w-16 overflow-hidden items-center justify-center">
        <LinearGradient
          colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isLoading ? <ActivityIndicator color="white" /> : icon}
        </LinearGradient>
      </View>
    </Pressable>
  );
};


export default BackgroundGredientIconButton;
