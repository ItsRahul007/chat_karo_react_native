// Custom entry point. Registers notifee handlers at the top level — before the
// React tree mounts — so call- and message-notification actions work while the
// app is backgrounded (and, on Android, when launched headless for a
// background event).
import notifee from "@notifee/react-native";
import {
  cancelAllCallNotifications,
  dispatchNotifeeEvent,
} from "@/util/callNotifications";
import { registerBackgroundMessageTask } from "@/util/backgroundMessageTask";
import { handleMessageNotifeeEvent } from "@/util/messageNotificationActions";

// Background event handler: fires for action-button presses / taps while the
// app is backgrounded or quit. Notifee allows exactly one of these, so message
// actions get first refusal and call actions handle whatever is left.
notifee.onBackgroundEvent(async (event) => {
  if (await handleMessageNotifeeEvent(event)) return;

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

// Rebuilds incoming message pushes as threaded notifications. Registered here
// so it is in place before the React tree mounts, and survives a killed app.
registerBackgroundMessageTask();

// Hand off to expo-router's real entry (registers the root component). This
// import is intentionally last: the notifee handlers above must be registered
// before the React tree mounts.
// eslint-disable-next-line import/first
import "expo-router/entry";
