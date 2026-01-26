import React from "react";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const status = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <SimplePunch />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const SimplePunch = () => (
  <View
    style={{
      width: 100,
      height: 100,
      backgroundColor: "#f00",
      overflow: "hidden",
    }}
  >
    <View
      style={{
        position: "absolute",
        bottom: -20, // Move it up and left to center the "punch" at 0,0
        right: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "white", // Matches the screen background
      }}
    />
  </View>
);

export default status;
