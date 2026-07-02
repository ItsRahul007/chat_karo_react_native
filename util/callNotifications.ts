import notifee, {
  AndroidCategory,
  AndroidForegroundServiceType,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native";
import { DeviceEventEmitter, Platform } from "react-native";
import type { CallType } from "@/context/CallContext";

// ─── Channels / notification ids ───────────────────────────────────
const INCOMING_CHANNEL_ID = "calls_incoming";
const ONGOING_CHANNEL_ID = "calls_ongoing";
// A single, stable id per notification kind so re-displaying updates in place.
const INCOMING_NOTIFICATION_ID = "incoming-call";
const ONGOING_NOTIFICATION_ID = "ongoing-call";

// ─── Action ids ────────────────────────────────────────────────────
// Emitted from notification buttons / taps. Kept as plain strings so the
// background handler (entry point) and the foreground handler (CallContext)
// decode them identically.
export type CallNotificationAction =
  | "open" // body tapped → bring the call screen forward
  | "accept"
  | "decline"
  | "mute"
  | "speaker"
  | "hangup";

// Internal event name used to bridge notifee events to the React tree.
const CALL_ACTION_EVENT = "call-notification-action";

/**
 * Subscribe to notification actions (button presses / taps). Returns an
 * unsubscribe function. The CallContext uses this to drive accept/reject/
 * mute/speaker/hangup and navigation.
 */
export const subscribeToCallActions = (
  cb: (action: CallNotificationAction) => void,
) => {
  const sub = DeviceEventEmitter.addListener(CALL_ACTION_EVENT, cb);
  return () => sub.remove();
};

/**
 * Decode a notifee event into a CallNotificationAction and broadcast it on the
 * internal event bus. Shared by both the foreground and background handlers so
 * a button behaves the same regardless of app state (while the JS runtime is
 * alive). Returns the decoded action, or null if the event isn't relevant.
 */
export const dispatchNotifeeEvent = ({
  type,
  detail,
}: {
  type: EventType;
  detail: { pressAction?: { id?: string } };
}): CallNotificationAction | null => {
  let action: CallNotificationAction | null = null;

  if (type === EventType.PRESS) {
    // Tapped the notification body (not an action button).
    action = "open";
  } else if (type === EventType.ACTION_PRESS) {
    const id = detail.pressAction?.id;
    if (
      id === "accept" ||
      id === "decline" ||
      id === "mute" ||
      id === "speaker" ||
      id === "hangup"
    ) {
      action = id;
    }
  }

  if (action) {
    DeviceEventEmitter.emit(CALL_ACTION_EVENT, action);
  }
  return action;
};

// ─── Setup ─────────────────────────────────────────────────────────
let channelsReady = false;

/**
 * Create the Android notification channels / register the iOS action
 * categories once. iOS has no foreground-service concept, so the ongoing
 * notification is a plain notification there and the buttons come from the
 * registered category (for a true iOS call UX you'd layer CallKit on top).
 */
export const ensureCallChannels = async () => {
  if (channelsReady) return;

  if (Platform.OS === "ios") {
    await notifee.setNotificationCategories([
      {
        id: "incoming-call",
        actions: [
          { id: "decline", title: "Decline", destructive: true },
          { id: "accept", title: "Accept", foreground: true },
        ],
      },
      {
        id: "ongoing-call",
        actions: [
          { id: "mute", title: "Mute" },
          { id: "speaker", title: "Speaker" },
          { id: "hangup", title: "Hang up", destructive: true },
        ],
      },
    ]);
    channelsReady = true;
    return;
  }

  if (Platform.OS !== "android") return;
  await notifee.createChannel({
    id: INCOMING_CHANNEL_ID,
    name: "Incoming Calls",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    // Silent channel: the ringtone + vibration are driven by InCallManager in
    // CallContext (which is alive whenever an incoming call is received over the
    // socket), so we don't double up the audio/haptics here.
    sound: undefined,
    vibration: false,
    bypassDnd: true,
  });
  await notifee.createChannel({
    id: ONGOING_CHANNEL_ID,
    name: "Ongoing Calls",
    importance: AndroidImportance.LOW, // silent, no heads-up for the ongoing bar
    visibility: AndroidVisibility.PUBLIC,
  });
  channelsReady = true;
};

/** Ask for notification permission (Android 13+ / iOS). Safe to call anytime. */
export const requestCallNotificationPermission = async () => {
  await notifee.requestPermission();
};

// ─── Incoming call notification ────────────────────────────────────
export interface IncomingCallNotificationParams {
  callerName: string;
  callType: CallType;
  isCommunity: boolean;
}

export const showIncomingCallNotification = async ({
  callerName,
  callType,
  isCommunity,
}: IncomingCallNotificationParams) => {
  await ensureCallChannels();
  const label = `${isCommunity ? "Community " : ""}${
    callType === "video" ? "Video" : "Audio"
  } call`;

  await notifee.displayNotification({
    id: INCOMING_NOTIFICATION_ID,
    title: callerName || "Incoming call",
    body: label,
    android: {
      channelId: INCOMING_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      // Non-dismissible while ringing; cleared explicitly on accept/reject.
      ongoing: true,
      autoCancel: false,
      // Launch / bring the app to the front and show the ringing UI even from
      // a locked screen.
      fullScreenAction: { id: "open", launchActivity: "default" },
      pressAction: { id: "open", launchActivity: "default" },
      actions: [
        { title: "Decline", pressAction: { id: "decline" } },
        {
          title: "Accept",
          pressAction: { id: "accept", launchActivity: "default" },
        },
      ],
      timestamp: undefined,
    },
    ios: {
      categoryId: "incoming-call",
      critical: true,
    },
  });
};

// ─── Ongoing call notification (foreground service) ─────────────────
export interface OngoingCallNotificationParams {
  remoteName: string;
  callType: CallType;
  isMuted: boolean;
  isSpeakerOn: boolean;
  statusText: string; // e.g. "Ringing…", "Connecting…", "02:14"
}

export const showOngoingCallNotification = async ({
  remoteName,
  callType,
  isMuted,
  isSpeakerOn,
  statusText,
}: OngoingCallNotificationParams) => {
  await ensureCallChannels();

  const fgsTypes =
    callType === "video"
      ? [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
        ]
      : [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE];

  await notifee.displayNotification({
    id: ONGOING_NOTIFICATION_ID,
    title: remoteName || "Ongoing call",
    body: statusText,
    android: {
      channelId: ONGOING_CHANNEL_ID,
      category: AndroidCategory.CALL,
      // Run as a foreground service so the OS keeps the call (and the WebRTC
      // connection) alive while the app is in the background.
      asForegroundService: true,
      foregroundServiceTypes: fgsTypes,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      colorized: true,
      color: "#5b2be0",
      pressAction: { id: "open", launchActivity: "default" },
      actions: [
        { title: isMuted ? "Unmute" : "Mute", pressAction: { id: "mute" } },
        {
          title: isSpeakerOn ? "Speaker off" : "Speaker on",
          pressAction: { id: "speaker" },
        },
        { title: "Hang up", pressAction: { id: "hangup" } },
      ],
    },
    ios: {
      categoryId: "ongoing-call",
    },
  });
};

// ─── Teardown ──────────────────────────────────────────────────────
export const cancelIncomingCallNotification = async () => {
  await notifee.cancelNotification(INCOMING_NOTIFICATION_ID);
};

/** Cancel the ongoing notification and stop the foreground service. */
export const cancelOngoingCallNotification = async () => {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(ONGOING_NOTIFICATION_ID);
};

/** Cancel every call notification and stop the foreground service. */
export const cancelAllCallNotifications = async () => {
  try {
    await notifee.stopForegroundService();
  } catch {
    // no service running; ignore
  }
  await notifee.cancelNotification(INCOMING_NOTIFICATION_ID);
  await notifee.cancelNotification(ONGOING_NOTIFICATION_ID);
};
