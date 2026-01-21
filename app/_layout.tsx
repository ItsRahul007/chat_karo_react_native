import { ColorTheme } from "@/constants/colors";
import { usePushNotification } from "@/custom-hooks/usePushNotification";
import * as Device from "expo-device";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const backgroundColor =
    theme === "light"
      ? ColorTheme.light.background.primary
      : ColorTheme.dark.background.primary;

  if (Device.isDevice) {
    usePushNotification();
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
