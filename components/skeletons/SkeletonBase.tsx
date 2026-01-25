import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface SkeletonBaseProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
}

const SkeletonBase = ({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonBaseProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#ccc",
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export default SkeletonBase;
