import { ColorTheme } from "@/constants/colors";
import { fontAssets } from "@/constants/fonts";
import AuthProvider, { AuthContext } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

const queryClient = new QueryClient();

// Keep the splash visible until Poppins is ready, so no frame renders with the
// system font and then reflows.
SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const authState = useContext(AuthContext);
  const theme = colorScheme ?? "light";
  const backgroundColor =
    theme === "light"
      ? ColorTheme.light.background.primary
      : ColorTheme.dark.background.primary;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
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
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Render nothing while the splash is still up; fall through on a font error
  // rather than blocking the app on it.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
