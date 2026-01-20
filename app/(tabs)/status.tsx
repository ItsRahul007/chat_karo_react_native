import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const status = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1"></SafeAreaView>
    </SafeAreaProvider>
  );
};

export default status;
