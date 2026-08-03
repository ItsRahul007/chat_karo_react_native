package expo.modules.callnotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Handles the Decline button. Unlike Accept it must not bring the app forward,
 * so it stays a broadcast: cancel the notification immediately (even if the JS
 * runtime is gone) and hand the action off to the module if one is alive.
 */
class CallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.getStringExtra(EXTRA_CALL_ACTION) ?: return
    IncomingCallNotifier.hide(context)
    CallActionBridge.dispatch(action)
  }
}
