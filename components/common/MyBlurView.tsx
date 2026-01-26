import { BlurView } from "expo-blur";
import React from "react";

const MyBlurView = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <BlurView
      intensity={40}
      blurReductionFactor={20}
      experimentalBlurMethod="dimezisBlurView"
      tint="dark"
      className={className ?? "flex-1"}
    >
      {children}
    </BlurView>
  );
};

export default MyBlurView;
