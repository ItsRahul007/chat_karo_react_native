import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

export type ToastType = "success" | "error" | "alert";

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset opacity to 0 before starting animation
    opacity.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animation.start((result) => {
      // Only call onHide if the animation finished normally (wasn't stopped)
      if (result.finished) {
        onHide();
      }
    });

    return () => {
      animation.stop();
    };
  }, [message]); // Re-run animation when message changes

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "alert":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "alert":
        return "warning";
      default:
        return "information-circle";
    }
  };

  return (
    <Animated.View
      style={{
        opacity,
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 100,
      }}
    >
      <View
        className={`${getBackgroundColor()} flex-row items-center p-4 rounded-lg shadow-lg`}
      >
        <Ionicons name={getIconName()} size={24} color="white" />
        <Text className="text-white font-medium ml-3 flex-1">{message}</Text>
        <TouchableOpacity onPress={onHide}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
