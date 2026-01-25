import { useIconColor } from "@/util/common.functions";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

const CommonBackButton = ({
  className,
  onBackPress,
}: {
  className?: string;
  onBackPress?: () => void;
}) => {
  const router = useRouter();
  const iconColor = useIconColor();

  return (
    <Pressable onPress={onBackPress ?? router.back} className={className}>
      <Entypo name="chevron-left" size={30} color={iconColor} />
    </Pressable>
  );
};

export default CommonBackButton;
