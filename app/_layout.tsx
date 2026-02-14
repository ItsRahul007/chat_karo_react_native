import { ColorTheme } from "@/constants/colors";
import AuthProvider, { AuthContext } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const authState = useContext(AuthContext);
  const theme = colorScheme ?? "light";
  const backgroundColor =
    theme === "light"
      ? ColorTheme.light.background.primary
      : ColorTheme.dark.background.primary;

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (authState.isReady) {
      // await SplashScreen.hideAsync();
    }
  }, [authState.isReady]);

  if (!authState.isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor }}
      onLayout={onLayoutRootView}
    >
      <Stack>
        <Stack.Protected guard={authState.isLoggedIn}>
          <Stack.Screen
            name="(protected)"
            options={{ headerShown: false, animation: "none" }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!authState.isLoggedIn}>
          <Stack.Screen
            name="login"
            options={{ headerShown: false, animation: "none" }}
          />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
};

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ToastProvider>
  );
}
