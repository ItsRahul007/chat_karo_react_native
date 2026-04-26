import SocketProvider from "@/context/SocketContext";
import { usePushNotification } from "@/custom-hooks/usePushNotification";
import { useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  const queryClient = useQueryClient();

  usePushNotification(queryClient);

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
