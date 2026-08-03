package expo.modules.callnotification

/**
 * Hands notification actions from native (broadcast receiver / activity intent)
 * to the Expo module, which forwards them to JS.
 *
 * Actions can arrive before JS is listening — a cold start from the Accept
 * button, for instance — so they queue until a listener attaches. If the process
 * was killed the queue is simply never drained; the notification is still
 * cancelled natively, which matches how the notifee background handler behaved.
 */
internal object CallActionBridge {
  private const val MAX_PENDING = 4

  private val pending = ArrayDeque<String>()
  private var listener: ((String) -> Unit)? = null

  @Synchronized
  fun setListener(next: ((String) -> Unit)?) {
    listener = next
    if (next == null) return
    while (pending.isNotEmpty()) next(pending.removeFirst())
  }

  @Synchronized
  fun dispatch(action: String) {
    val current = listener
    if (current != null) {
      current(action)
      return
    }
    if (pending.size >= MAX_PENDING) pending.removeFirst()
    pending.addLast(action)
  }
}
