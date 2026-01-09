import { ColorTheme } from "@/constants/colors";
import { getChatHistoryById } from "@/controller/chat.controller";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Chat = () => {
  const { id } = useLocalSearchParams();
  const theme = useColorScheme();
    const statusBarBgColor =
    theme === "light"
      ? ColorTheme.light.background.secondary
      : ColorTheme.dark.background.secondary;
  const chat = getChatHistoryById(id as string);

  return (
    <SafeAreaView className="flex-1 bg-light-background-secondary relative">
        <StatusBar backgroundColor={statusBarBgColor} style="auto" />
      <View className="bg-light-background-primary dark:bg-dark-background-secondary h-28">
        <View className="h-full w-full bg-light-background-secondary rounded-b-[2.5rem]">
        <Text>Chat id is {id}</Text>
        </View>
      </View>
      <View className="flex-1 bg-light-background-primary"></View>
    </SafeAreaView>
  );
};

export default Chat;
