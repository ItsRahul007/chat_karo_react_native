import React from "react";
import { Text, View } from "react-native";

const UnreadMessageCount = ({ count }: { count: number }) => {
  return (
    <View className="bg-messageCountBackground rounded-3xl h-6 w-7 justify-center items-center">
      <Text className="text-white text-sm">{count > 99 ? "99+" : count}</Text>
    </View>
  );
};

export default UnreadMessageCount;
