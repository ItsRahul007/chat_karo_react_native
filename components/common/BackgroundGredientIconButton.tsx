import { ColorTheme } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, View } from "react-native";

const BackgroundGredientIconButton = ({
  icon,
  onPress,
  size,
  className,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  size: number;
  className?: string;
}) => {
  return (
    <Pressable onPress={onPress} className={className}>
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
          {icon}
        </LinearGradient>
      </View>
    </Pressable>
  );
};

export default BackgroundGredientIconButton;
