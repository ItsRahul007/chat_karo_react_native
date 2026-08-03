import { NativeModule, requireOptionalNativeModule } from "expo";

export type NativeCallAction = "accept" | "decline" | "open";

export interface NativeIncomingCallOptions {
  callerName: string;
  /** Secondary line, e.g. "Community video call". */
  subtitle?: string;
  /** Remote http(s) avatar; loaded in the background, notification refreshes. */
  avatarUri?: string;
  isVideo?: boolean;
  /** No heads-up, no sound, no full-screen launch. */
  silent?: boolean;
}

type CallNotificationEvents = {
  onCallAction: (event: { action: NativeCallAction }) => void;
};

declare class CallNotificationNativeModule extends NativeModule<CallNotificationEvents> {
  /** Post (or update) the ringing CallStyle notification. */
  showIncomingCall(options: NativeIncomingCallOptions): Promise<void>;
  /** Cancel it. Safe to call when nothing is showing. */
  hideIncomingCall(): Promise<void>;
}

// Android-only. `null` on iOS and anywhere the native module isn't linked, so
// every call site must fall back to the notifee notification.
export default requireOptionalNativeModule<CallNotificationNativeModule>(
  "CallNotification",
);
