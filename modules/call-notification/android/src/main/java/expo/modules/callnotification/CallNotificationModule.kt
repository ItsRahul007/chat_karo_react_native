package expo.modules.callnotification

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val ON_CALL_ACTION = "onCallAction"

class CallNotificationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("CallNotification")

    Events(ON_CALL_ACTION)

    OnCreate {
      appContext.reactContext?.let { IncomingCallNotifier.ensureChannels(it) }
    }

    OnStartObserving(ON_CALL_ACTION) {
      CallActionBridge.setListener { action ->
        sendEvent(ON_CALL_ACTION, mapOf("action" to action))
      }
      // A cold start from Accept / a body tap carries the action on the launch
      // intent, which the OnNewIntent hook never sees. Drain it now that a
      // listener is attached.
      consumeIntent(appContext.currentActivity?.intent)
    }

    OnStopObserving(ON_CALL_ACTION) {
      CallActionBridge.setListener(null)
    }

    // Accept / body tap while the app is already running.
    OnNewIntent { intent -> consumeIntent(intent) }

    AsyncFunction("showIncomingCall") { options: IncomingCallOptions ->
      IncomingCallNotifier.show(context, options)
    }

    AsyncFunction("hideIncomingCall") {
      IncomingCallNotifier.hide(context)
    }
  }

  private fun consumeIntent(intent: Intent?) {
    val action = intent?.getStringExtra(EXTRA_CALL_ACTION) ?: return
    // Clear it so a later foreground/background cycle can't replay the action.
    intent.removeExtra(EXTRA_CALL_ACTION)
    CallActionBridge.dispatch(action)
  }
}
