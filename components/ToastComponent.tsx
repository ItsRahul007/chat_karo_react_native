import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ToastType = "success" | "error" | "alert" | "loading";

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
}

export const ToastComponent: React.FC<ToastProps> = ({
  message,
  type,
  onHide,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 100) {
          Animated.timing(translateX, {
            toValue: gestureState.dx > 0 ? 500 : -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onHide());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    // Reset opacity and translateX before starting animation
    opacity.setValue(0);
    translateX.setValue(0);

    const sequence = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ];

    if (type !== "loading") {
      sequence.push(Animated.delay(3000));
      sequence.push(
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      );
    }

    const animation = Animated.sequence(sequence);

    animation.start((result) => {
      // Only call onHide if the animation finished normally (wasn't stopped)
      // and it's not a loading toast (which stays visible)
      if (result.finished && type !== "loading") {
        onHide();
      }
    });

    return () => {
      animation.stop();
    };
  }, [message, type]); // Re-run animation when message or type changes

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "alert":
        return "bg-yellow-500";
      case "loading":
        return "bg-gray-800";
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
        transform: [{ translateX }],
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 100,
      }}
      {...panResponder.panHandlers}
    >
      <View
        className={`${getBackgroundColor()} flex-row items-center p-4 rounded-lg shadow-lg`}
      >
        {type === "loading" ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name={getIconName()} size={24} color="white" />
        )}
        <Text className="text-white font-medium ml-3 flex-1">{message}</Text>
        <TouchableOpacity onPress={onHide}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
