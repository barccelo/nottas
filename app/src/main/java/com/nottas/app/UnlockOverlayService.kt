package com.nottas.app

import android.app.KeyguardManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs
import kotlin.math.roundToInt

class UnlockOverlayService : Service() {
    companion object {
        private const val CHANNEL_ID = "nottas_unlock"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_SHOW_REMINDER = "com.nottas.app.ACTION_SHOW_REMINDER"
        const val EXTRA_REMINDER_ID = "reminder_id"
        const val EXTRA_REMINDER_TEXT = "reminder_text"
    }

    private var armedForWake = true
    private var reminderView: View? = null
    private var reminderId: String? = null
    private var reminderText: String? = null

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> armedForWake = true
                Intent.ACTION_USER_PRESENT -> launchQuickCaptureIfArmed()
                Intent.ACTION_SCREEN_ON -> {
                    val keyguard = getSystemService(KeyguardManager::class.java)
                    if (!keyguard.isKeyguardLocked) launchQuickCaptureIfArmed()
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startAsForeground()

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(screenReceiver, filter)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_SHOW_REMINDER) {
            val id = intent.getStringExtra(EXTRA_REMINDER_ID)
            val text = intent.getStringExtra(EXTRA_REMINDER_TEXT)
            if (!id.isNullOrBlank() && !text.isNullOrBlank()) {
                showReminderOverlay(id, text)
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        removeReminderOverlay()
        try {
            unregisterReceiver(screenReceiver)
        } catch (_: Throwable) {
        }
        super.onDestroy()
    }

    private fun wakeEnabled(): Boolean =
        getSharedPreferences(NottasWeb.PREFS, MODE_PRIVATE)
            .getBoolean(NottasWeb.PREF_WAKE_ENABLED, true)

    private fun launchQuickCaptureIfArmed() {
        if (!armedForWake) return
        if (!wakeEnabled() || !Settings.canDrawOverlays(this)) return

        armedForWake = false

        val intent = Intent(this, QuickCaptureActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
            )
        }

        try {
            startActivity(intent)
        } catch (_: Throwable) {
            armedForWake = true
        }
    }

    private fun showReminderOverlay(id: String, text: String) {
        if (!Settings.canDrawOverlays(this)) return

        val keyguard = getSystemService(KeyguardManager::class.java)
        if (keyguard.isKeyguardLocked) return

        removeReminderOverlay()
        reminderId = id
        reminderText = text

        val wm = getSystemService(WindowManager::class.java)
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).roundToInt()

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.rgb(245, 245, 247))
            isClickable = true
            isFocusable = true
        }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(42), dp(24), dp(30))
        }
        root.addView(
            content,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        val topRow = FrameLayout(this)
        content.addView(
            topRow,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(52)
            )
        )

        val label = TextView(this).apply {
            this.text = "Recordatorio"
            textSize = 15f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.CENTER_VERTICAL
            typeface = Typeface.create("sans", Typeface.NORMAL)
        }
        topRow.addView(
            label,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
                Gravity.START
            )
        )

        val close = TextView(this).apply {
            this.text = "×"
            textSize = 30f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(142, 142, 147))
            background = roundedBackground(Color.WHITE, dp(22))
            isClickable = true
            setOnClickListener { removeReminderOverlay() }
        }
        topRow.addView(
            close,
            FrameLayout.LayoutParams(dp(44), dp(44), Gravity.END or Gravity.CENTER_VERTICAL)
        )

        val spacerTop = View(this)
        content.addView(
            spacerTop,
            LinearLayout.LayoutParams(1, 0, 1f)
        )

        val actionHint = TextView(this).apply {
            this.text = "Desliza para actuar"
            textSize = 13f
            setTextColor(Color.rgb(142, 142, 147))
            gravity = Gravity.CENTER
        }
        content.addView(
            actionHint,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(28)
            )
        )

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(26), dp(28), dp(26), dp(28))
            background = roundedBackground(Color.WHITE, dp(28))
            elevation = dp(10).toFloat()
        }
        val cardParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            topMargin = dp(10)
        }
        content.addView(card, cardParams)

        val taskText = TextView(this).apply {
            this.text = text
            textSize = 28f
            setTextColor(Color.rgb(29, 29, 31))
            gravity = Gravity.CENTER
            typeface = Typeface.create("sans", Typeface.BOLD)
            maxLines = 5
        }
        card.addView(
            taskText,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        val gestureStatus = TextView(this).apply {
            this.text = "← Posponer 5 min     Completar →"
            textSize = 15f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.CENTER
        }
        val statusParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(52)
        ).apply {
            topMargin = dp(18)
        }
        content.addView(gestureStatus, statusParams)

        val spacerBottom = View(this)
        content.addView(
            spacerBottom,
            LinearLayout.LayoutParams(1, 0, 1f)
        )

        val instruction = TextView(this).apply {
            this.text = "Derecha: completar  ·  Izquierda: posponer\nAl posponer, desliza arriba o abajo para ajustar los minutos."
            textSize = 13f
            setTextColor(Color.rgb(142, 142, 147))
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.15f)
        }
        content.addView(
            instruction,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        var startX = 0f
        var startY = 0f
        var direction = 0
        var snoozeMinutes = 5
        val horizontalThreshold = dp(92).toFloat()
        val directionLock = dp(18).toFloat()
        val minuteStep = dp(26).toFloat()

        card.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.rawX
                    startY = event.rawY
                    direction = 0
                    snoozeMinutes = 5
                    view.animate().cancel()
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - startX
                    val dy = event.rawY - startY

                    if (direction == 0 && abs(dx) >= directionLock) {
                        direction = if (dx > 0) 1 else -1
                    }

                    if (direction == 1) {
                        val tx = dx.coerceAtLeast(0f).coerceAtMost(dp(150).toFloat())
                        view.translationX = tx
                        view.translationY = 0f
                        val progress = (tx / horizontalThreshold).coerceIn(0f, 1f)
                        gestureStatus.text = if (progress >= 1f) "Suelta para completar ✓" else "Completar →"
                        gestureStatus.setTextColor(Color.rgb(52, 199, 89))
                    } else if (direction == -1) {
                        val tx = dx.coerceAtMost(0f).coerceAtLeast(-dp(150).toFloat())
                        view.translationX = tx
                        view.translationY = (dy * 0.08f).coerceIn(-dp(18).toFloat(), dp(18).toFloat())

                        val nextMinutes = (5 + (-dy / minuteStep).roundToInt()).coerceIn(1, 120)
                        if (nextMinutes != snoozeMinutes) {
                            snoozeMinutes = nextMinutes
                            view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                        }
                        gestureStatus.text = if (-tx >= horizontalThreshold) {
                            "Suelta para posponer $snoozeMinutes min"
                        } else {
                            "← Posponer $snoozeMinutes min"
                        }
                        gestureStatus.setTextColor(Color.rgb(0, 122, 255))
                    }
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val dx = event.rawX - startX
                    if (event.actionMasked == MotionEvent.ACTION_UP && direction == 1 && dx >= horizontalThreshold) {
                        completeReminder()
                    } else if (event.actionMasked == MotionEvent.ACTION_UP && direction == -1 && -dx >= horizontalThreshold) {
                        snoozeReminder(snoozeMinutes)
                    } else {
                        view.animate()
                            .translationX(0f)
                            .translationY(0f)
                            .setDuration(180)
                            .start()
                        gestureStatus.text = "← Posponer 5 min     Completar →"
                        gestureStatus.setTextColor(Color.rgb(99, 99, 102))
                    }
                    true
                }

                else -> false
            }
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        try {
            wm.addView(root, params)
            reminderView = root
        } catch (_: Throwable) {
            reminderView = null
            reminderId = null
            reminderText = null
        }
    }

    private fun completeReminder() {
        val id = reminderId ?: return
        ReminderActionStore.enqueueComplete(this, id)
        ReminderScheduler.remove(this, id)
        ReminderScheduler.cancelNotification(this, id)
        removeReminderOverlay()
    }

    private fun snoozeReminder(minutes: Int) {
        val id = reminderId ?: return
        val text = reminderText ?: return
        ReminderScheduler.snooze(this, id, text, minutes)
        removeReminderOverlay()
    }

    private fun removeReminderOverlay() {
        val view = reminderView ?: run {
            reminderId = null
            reminderText = null
            return
        }
        try {
            getSystemService(WindowManager::class.java).removeView(view)
        } catch (_: Throwable) {
        }
        reminderView = null
        reminderId = null
        reminderText = null
    }

    private fun roundedBackground(color: Int, radius: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.overlay_channel_name),
            NotificationManager.IMPORTANCE_MIN
        ).apply {
            description = getString(R.string.overlay_channel_description)
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    private fun startAsForeground() {
        val openIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = android.app.Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_nottas)
            .setContentTitle("Nottas")
            .setContentText("Listo para aparecer al encender o desbloquear")
            .setContentIntent(pendingIntent)
            .setOngoing(false)
            .setCategory(android.app.Notification.CATEGORY_SERVICE)
            .build()

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
}
