// Custom entry point. Registers notifee handlers at the top level — before the
// React tree mounts — so call-notification actions work while the app is
// backgrounded (and, on Android, when launched headless for a background event).
import notifee from "@notifee/react-native";
import {
  cancelAllCallNotifications,
  dispatchNotifeeEvent,
} from "@/util/callNotifications";

// Background event handler: fires for action-button presses / taps while the
// app is backgrounded or quit. dispatchNotifeeEvent re-broadcasts the action on
// an in-process event bus, which the CallContext picks up while the JS runtime
// is alive (kept alive by the ongoing-call foreground service). If the app was
// killed, there's no live call to drive, so we just clear the notification.
notifee.onBackgroundEvent(async (event) => {
  const action = dispatchNotifeeEvent(event);
  if (action === "decline" || action === "hangup") {
    // Best-effort cleanup; the CallContext also handles this if it's alive.
    await cancelAllCallNotifications();
  }
});

// The foreground service must be registered exactly once. notifee keeps the
// returned promise pending for the service's lifetime; teardown happens via
// stopForegroundService() in the call notification helpers.
notifee.registerForegroundService(() => new Promise(() => {}));

// Hand off to expo-router's real entry (registers the root component). This
// import is intentionally last: the notifee handlers above must be registered
// before the React tree mounts.
// eslint-disable-next-line import/first
import "expo-router/entry";
