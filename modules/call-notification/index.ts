/**
 * Android incoming-call notification rendered with `NotificationCompat.CallStyle`.
 *
 * notifee (v9) can only post plain text actions, which render the Accept /
 * Decline buttons as flat grey labels. CallStyle is what gives a call
 * notification the real treatment: a filled green Answer pill and a red Decline
 * pill, the caller's avatar, and top-of-shade ranking — the same look as the
 * system dialer and WhatsApp.
 *
 * iOS keeps using the notifee category (see `util/callNotifications.ts`).
 */
import CallNotification from "./src/CallNotificationModule";

export type {
  NativeCallAction,
  NativeIncomingCallOptions,
} from "./src/CallNotificationModule";

export default CallNotification;

/** True when the CallStyle notification can be used on this device. */
export const isNativeCallNotificationAvailable = () => CallNotification != null;
