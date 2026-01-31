import { BlurView } from "expo-blur";
import React from "react";
import { useColorScheme } from "react-native";

const MyBlurView = ({
  children,
  className = "flex-1",
  themeTint = false,
}: {
  children: React.ReactNode;
  className?: string;
  themeTint?: boolean;
}) => {
  const theme = useColorScheme();

  return (
    <BlurView
      intensity={40}
      blurReductionFactor={20}
      experimentalBlurMethod="dimezisBlurView"
      tint={!themeTint ? "dark" : theme === "light" ? "dark" : "light"}
      className={className}
    >
      {children}
    </BlurView>
  );
};

export default MyBlurView;
