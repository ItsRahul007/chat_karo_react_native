import { ColorTheme } from "@/constants/colors";
import { Stack } from "expo-router";
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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
      <Stack>
        <Stack.Screen
          name="(protected)"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "none" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
