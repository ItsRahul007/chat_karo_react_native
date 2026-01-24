import { ColorTheme } from "@/constants/colors";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable } from "react-native";

interface GredientIconProps {
  icon: React.ReactElement;
  onPress?: () => void;
  size?: number;
}

const GredientIcon = ({ icon, onPress, size = 24 }: GredientIconProps) => {
  return (
    <Pressable onPress={onPress}>
      <MaskedView maskElement={icon}>
        <LinearGradient
          colors={[ColorTheme.gradientFirst, ColorTheme.gradientSecond]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: size, height: size }}
        />
      </MaskedView>
    </Pressable>
  );
};

export default GredientIcon;
