import { usePushNotification } from "@/custom-hooks/usePushNotification";
import * as Device from "expo-device";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  if (Device.isDevice) {
    usePushNotification();
  }

  const isLogedIn = false;

  if (!isLogedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
