import IncomingCallOverlay from "@/components/call/IncomingCallOverlay";
import CallProvider from "@/context/CallContext";
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
        <CallProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <IncomingCallOverlay />
        </CallProvider>
      </SocketProvider>
      <StatusBar style="auto" />
    </>
  );
}

