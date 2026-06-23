import { ColorTheme } from "@/constants/colors";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const Dot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.ease }),
          withTiming(0.3, { duration: 350, easing: Easing.ease }),
        ),
      ),
      -1,
      false,
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: ColorTheme.gradientSecond,
        },
        animatedStyle,
      ]}
    />
  );
};

const TypingIndicator = () => {
  return (
    <View className="flex-row items-center gap-x-1.5">
      <Text className="text-base text-gradientSecond font-semibold">
        Typing
      </Text>
      <View className="flex-row items-center gap-x-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
};

export default TypingIndicator;
