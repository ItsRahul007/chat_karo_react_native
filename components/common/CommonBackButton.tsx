import { getIconColor } from "@/util/common.functions";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

const CommonBackButton = ({ className }: { className?: string }) => {
  const router = useRouter();
  const iconColor = getIconColor();

  return (
    <Pressable onPress={() => router.back()} className={className}>
      <Entypo name="chevron-left" size={30} color={iconColor} />
    </Pressable>
  );
};

export default CommonBackButton;
