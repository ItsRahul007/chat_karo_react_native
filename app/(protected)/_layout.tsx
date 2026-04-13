import SocketProvider from "@/context/SocketContext";
import { usePushNotification } from "@/custom-hooks/usePushNotification";
import * as Device from "expo-device";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  usePushNotification();

  return (

    <>
      <SocketProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SocketProvider>
      <StatusBar style="auto" />
    </>
  );
}
