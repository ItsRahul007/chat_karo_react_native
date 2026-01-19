import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SwipeToReplyProps {
  children: React.ReactNode;
  onReply: () => void;
}

const SwipeToReply = ({ children, onReply }: SwipeToReplyProps) => {
  const translateX = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Prevents vertical scroll interference
    .onUpdate((event) => {
      // Limit the swipe distance (e.g., max 80px)
      const x = event.translationX;
      if (x > 0) {
        translateX.value = x / 1.5; // Add some resistance

        // Trigger haptic once when passing 50px
        if (x > 50 && !hasTriggered.value) {
          hasTriggered.value = true;
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    })
    .onEnd(() => {
      // If swiped far enough, trigger the reply callback
      if (translateX.value > 50) {
        runOnJS(onReply)();
      }

      // Reset position with a nice spring
      translateX.value = withSpring(0, { damping: 60 });
      hasTriggered.value = false;
    });

  const rMessageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rIconStyle = useAnimatedStyle(() => {
    // Icon fades in and grows as we swipe
    const opacity = interpolate(
      translateX.value,
      [0, 40],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, 40],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View className="relative justify-center w-full my-1">
      {/* Background Icon (The Reply Arrow) */}
      <Animated.View className="absolute left-4" style={rIconStyle}>
        <Ionicons name="arrow-undo" size={20} color="#9ca3af" />
      </Animated.View>

      {/* The Actual Content */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={rMessageStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

export default SwipeToReply;
