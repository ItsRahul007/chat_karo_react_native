import IncomingCallOverlay from "@/components/call/IncomingCallOverlay";
import CallProvider from "@/context/CallContext";
import SocketProvider from "@/context/SocketContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/*
 * Push notifications are set up inside SocketProvider — it owns the socket and
 * the logged-in user, which the notification quick actions (Reply / Mark as
 * read) need. Registering the hook here as well would double-handle every
 * notification response and send inline replies twice.
 */
export default function ProtectedLayout() {
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

