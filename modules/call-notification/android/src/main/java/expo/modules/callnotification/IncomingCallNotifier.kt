package expo.modules.callnotification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

// Intent extra carrying the decoded action back into the app / JS.
internal const val EXTRA_CALL_ACTION = "expo.modules.callnotification.CALL_ACTION"
private const val INTENT_ACTION_PREFIX = "expo.modules.callnotification.ACTION_"

internal const val CALL_ACTION_ACCEPT = "accept"
internal const val CALL_ACTION_DECLINE = "decline"
internal const val CALL_ACTION_OPEN = "open"

class IncomingCallOptions : Record {
  @Field val callerName: String = ""

  /** Secondary line, e.g. "Community video call". */
  @Field val subtitle: String? = null

  /** Remote http(s) avatar. Loaded in the background; the notification is
   *  posted immediately and refreshed once the bitmap lands. */
  @Field val avatarUri: String? = null

  @Field val isVideo: Boolean = false

  /** Post quietly: no heads-up, no sound, no full-screen launch. Used while the
   *  app is already in the foreground and showing the in-app ringing UI. */
  @Field val silent: Boolean = false
}

/**
 * Posts the incoming-call notification using `NotificationCompat.CallStyle`, so
 * the system renders real red/green Decline & Accept call buttons (a filled pill
 * pair on Android 12+, a decorated custom view below that) instead of the plain
 * text actions a regular notification gets.
 */
internal object IncomingCallNotifier {
  private const val NOTIFICATION_ID = 51001

  /**
   * Alerting channel — heads-up + full-screen intent. Deliberately silent and
   * vibration-free: the ringtone and haptics are driven from JS by
   * InCallManager, so the channel must not double up on them.
   */
  private const val CHANNEL_ALERTING = "incoming_calls"

  /** Used while the app is open — no heads-up, no sound. */
  private const val CHANNEL_SILENT = "incoming_calls_silent"

  private const val ANSWER_COLOR = 0xFF16A34A.toInt()
  private const val DECLINE_COLOR = 0xFFE53935.toInt()
  private const val ACCENT_COLOR = 0xFF5B2BE0.toInt()

  private const val AVATAR_SIZE_PX = 256
  private const val AVATAR_CACHE_LIMIT = 8

  private val avatarExecutor = Executors.newSingleThreadExecutor()
  private val avatarCache = HashMap<String, Bitmap>()

  // Bumped on every show/hide so a slow avatar download can't repost (or
  // resurrect) a notification for a call that has already been answered.
  private val showToken = AtomicInteger(0)

  // Whether the notification currently on screen (if any) is the quiet variant.
  @Volatile
  private var lastSilent: Boolean? = null

  fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return

    if (manager.getNotificationChannel(CHANNEL_ALERTING) == null) {
      manager.createNotificationChannel(
        NotificationChannel(
          CHANNEL_ALERTING,
          "Incoming Calls",
          NotificationManager.IMPORTANCE_HIGH
        ).apply {
          description = "Ringing audio and video calls"
          setSound(null, null)
          enableVibration(false)
          setShowBadge(false)
          lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
          // No-op unless the user has granted DND access; never throws.
          setBypassDnd(true)
        }
      )
    }

    if (manager.getNotificationChannel(CHANNEL_SILENT) == null) {
      manager.createNotificationChannel(
        NotificationChannel(
          CHANNEL_SILENT,
          "Incoming Calls (app open)",
          NotificationManager.IMPORTANCE_LOW
        ).apply {
          description = "Incoming calls while the app is already open"
          setSound(null, null)
          enableVibration(false)
          setShowBadge(false)
          lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
        }
      )
    }
  }

  fun show(context: Context, options: IncomingCallOptions) {
    ensureChannels(context)
    val token = showToken.incrementAndGet()

    // Updating a posted notification never re-alerts (onlyAlertOnce is on so a
    // late avatar can't ring twice), so when the quiet notification has to
    // become the alerting one — the user walked away mid-ring — it is cancelled
    // first, otherwise the heads-up would be swallowed.
    if (lastSilent == true && !options.silent) {
      NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }
    lastSilent = options.silent

    val url = options.avatarUri?.takeIf { it.startsWith("http") }
    val cached = url?.let { synchronized(avatarCache) { avatarCache[it] } }
    post(context, options, cached)

    if (url == null || cached != null) return
    avatarExecutor.execute {
      val bitmap = downloadAvatar(url) ?: return@execute
      synchronized(avatarCache) {
        if (avatarCache.size >= AVATAR_CACHE_LIMIT) avatarCache.clear()
        avatarCache[url] = bitmap
      }
      // Still the same ring? Repost so the caller's face shows up. onlyAlertOnce
      // keeps this second post from re-alerting.
      if (showToken.get() == token) post(context, options, bitmap)
    }
  }

  fun hide(context: Context) {
    showToken.incrementAndGet()
    lastSilent = null
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }

  private fun post(context: Context, options: IncomingCallOptions, avatar: Bitmap?) {
    val caller = Person.Builder()
      .setName(options.callerName.ifBlank { "Incoming call" })
      .setImportant(true)
      .apply { avatar?.let { setIcon(IconCompat.createWithBitmap(circleCrop(it))) } }
      .build()

    val style = NotificationCompat.CallStyle
      .forIncomingCall(caller, declineIntent(context), acceptIntent(context))
      .setIsVideo(options.isVideo)
      .setAnswerButtonColorHint(ANSWER_COLOR)
      .setDeclineButtonColorHint(DECLINE_COLOR)

    val openIntent = openIntent(context)
    val notification = NotificationCompat.Builder(
      context,
      if (options.silent) CHANNEL_SILENT else CHANNEL_ALERTING
    )
      .setSmallIcon(R.drawable.ic_call_notification)
      .setStyle(style)
      .setContentText(options.subtitle)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setPriority(
        if (options.silent) NotificationCompat.PRIORITY_LOW else NotificationCompat.PRIORITY_HIGH
      )
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      // Not swipe-away-able while ringing; cleared explicitly on accept/decline.
      .setOngoing(true)
      .setAutoCancel(false)
      // A late avatar repost must not ring a second time.
      .setOnlyAlertOnce(true)
      .setSilent(options.silent)
      .setColor(ACCENT_COLOR)
      .setColorized(true)
      .setContentIntent(openIntent)
      // The platform rejects a CallStyle notification unless it belongs to a
      // foreground service or carries a full-screen intent, so this is attached
      // even for the silent variant — the LOW-importance channel is what stops
      // the system from actually launching it.
      .setFullScreenIntent(openIntent, true)
      .build()

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS not granted — the in-app ringing UI still runs.
    }
  }

  // ─── Intents ──────────────────────────────────────────────────────
  // Accept and body-tap go straight to the activity: a notification action that
  // launches an activity is always allowed to come to the front, whereas a
  // broadcast receiver would hit background-activity-launch limits.

  private fun acceptIntent(context: Context) = PendingIntent.getActivity(
    context,
    1001,
    activityIntent(context, CALL_ACTION_ACCEPT),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )

  private fun openIntent(context: Context) = PendingIntent.getActivity(
    context,
    1002,
    activityIntent(context, CALL_ACTION_OPEN),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )

  private fun declineIntent(context: Context) = PendingIntent.getBroadcast(
    context,
    1003,
    Intent(context, CallActionReceiver::class.java)
      .setAction(INTENT_ACTION_PREFIX + CALL_ACTION_DECLINE)
      .putExtra(EXTRA_CALL_ACTION, CALL_ACTION_DECLINE),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )

  private fun activityIntent(context: Context, callAction: String): Intent {
    val launchComponent = context.packageManager
      .getLaunchIntentForPackage(context.packageName)
      ?.component

    return Intent().apply {
      // Target the main activity explicitly. A plain ACTION_MAIN/LAUNCHER intent
      // is treated as a launcher tap and may be delivered without onNewIntent.
      launchComponent?.let { component = it }
      action = INTENT_ACTION_PREFIX + callAction
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra(EXTRA_CALL_ACTION, callAction)
    }
  }

  // ─── Avatar ───────────────────────────────────────────────────────
  private fun downloadAvatar(url: String): Bitmap? = try {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
      connectTimeout = 5000
      readTimeout = 5000
      instanceFollowRedirects = true
    }
    val bytes = connection.inputStream.use { input ->
      ByteArrayOutputStream().also { input.copyTo(it) }.toByteArray()
    }
    connection.disconnect()
    decodeScaled(bytes)
  } catch (_: Throwable) {
    null
  }

  /** Two-pass decode so an oversized avatar never inflates at full resolution. */
  private fun decodeScaled(bytes: ByteArray): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

    var sample = 1
    while (
      bounds.outWidth / (sample * 2) >= AVATAR_SIZE_PX &&
      bounds.outHeight / (sample * 2) >= AVATAR_SIZE_PX
    ) {
      sample *= 2
    }
    val options = BitmapFactory.Options().apply { inSampleSize = sample }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
  }

  private fun circleCrop(source: Bitmap): Bitmap {
    val size = minOf(source.width, source.height)
    val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val destination = RectF(0f, 0f, size.toFloat(), size.toFloat())

    canvas.drawOval(destination, paint)
    paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
    val left = (source.width - size) / 2
    val top = (source.height - size) / 2
    canvas.drawBitmap(source, Rect(left, top, left + size, top + size), destination, paint)
    return output
  }
}
