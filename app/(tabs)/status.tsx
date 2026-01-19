import SwipeToReply from "@/components/chat/SwipeToReply";
import React from "react";
import { Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const status = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <SwipeToReply onReply={() => {}}>
          <Text className="text-2xl text-black">Swipe to reply</Text>
        </SwipeToReply>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default status;
