import { useIconColor } from "@/util/common.functions";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Keyboard, Pressable } from "react-native";

const CommonBackButton = ({
  className,
  onBackPress,
  dismissKeyboard = false,
}: {
  className?: string;
  onBackPress?: () => void;
  dismissKeyboard?: boolean;
}) => {
  const router = useRouter();
  const iconColor = useIconColor();

  const handlePress = () => {
    if (dismissKeyboard) {
      Keyboard.dismiss();
    }
    onBackPress ? onBackPress() : router.back();
  };

  return (
    <Pressable onPress={handlePress} className={className}>
      <Entypo name="chevron-left" size={30} color={iconColor} />
    </Pressable>
  );
};

export default CommonBackButton;
