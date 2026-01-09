import { ColorTheme } from "@/constants/colors";
import { FontAwesome } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view"; // 👈 Required for gradient icon
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

// --- CONFIGURATION ---
const TRACK_WIDTH = 110;
const TRACK_HEIGHT = 44;
const THUMB_SIZE = 36;
const PADDING = 4;
const ICON_SIZE = 16; // Defined icon size for masking

interface CustomIconSwitchProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  activeGradientColors?: [string, string, ...string[]];
}

const CustomIconSwitch = ({
  value,
  onValueChange,
  activeGradientColors = [ColorTheme.gradientFirst, ColorTheme.gradientSecond],
}: CustomIconSwitchProps) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_WIDTH - THUMB_SIZE - PADDING],
  });

  const offStateOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const onStateOpacity = animatedValue;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      className="active:opacity-90"
    >
      {/* --- TRACK --- */}
      <View
        className="justify-center overflow-hidden bg-white dark:bg-dark-viewProfileButtonBg"
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
        }}
      >
        {/* Optional: Add a Gradient overlay to the TRACK when Active if desired */}
        <Animated.View
          className="absolute w-full h-full"
          style={{ opacity: onStateOpacity }}
        >
          <LinearGradient
            colors={activeGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 opacity-90"
          />
        </Animated.View>

        {/* --- MOVING THUMB --- */}
        <Animated.View
          className="absolute items-center justify-center shadow-sm z-10"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            transform: [{ translateX }],
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
          }}
        >
          {/* === LAYER 1: THUMB BACKGROUNDS === */}

          {/* 1a. White Background (Visible when ON) */}
          <View className="absolute inset-0 bg-white rounded-full" />

          {/* 1b. Gradient Background (Visible when OFF - Fades out) */}
          <Animated.View
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ opacity: offStateOpacity }}
          >
            <LinearGradient
              colors={activeGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1"
            />
          </Animated.View>

          {/* === LAYER 2: ICONS === */}
          <View className="items-center justify-center relative w-full h-full">
            {/* 2a. White Icon (Visible when OFF - sits on top of Gradient Thumb) */}
            <Animated.View
              className="absolute"
              style={{ opacity: offStateOpacity }}
            >
              <FontAwesome name="bell-slash" size={ICON_SIZE} color="white" />
            </Animated.View>

            {/* 2b. Gradient Icon (Visible when ON - sits on top of White Thumb) */}
            <Animated.View
              className="absolute"
              style={{ opacity: onStateOpacity }}
            >
              <MaskedView
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
                maskElement={
                  <View className="bg-transparent items-center justify-center flex-1">
                    <FontAwesome name="bell" size={ICON_SIZE} color="black" />
                  </View>
                }
              >
                <LinearGradient
                  colors={activeGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 2, y: 1 }}
                  className="flex-1"
                />
              </MaskedView>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

export default CustomIconSwitch;
