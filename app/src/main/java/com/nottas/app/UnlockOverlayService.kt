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
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import java.util.Calendar

object WorkHoursPolicy {
    fun isActiveNow(context: Context): Boolean {
        val prefs = context.getSharedPreferences(NottasWeb.PREFS, Context.MODE_PRIVATE)
        if (!prefs.getBoolean(NottasWeb.PREF_WORK_HOURS_ENABLED, false)) return false

        val start = parseMinutes(
            prefs.getString(NottasWeb.PREF_WORK_HOURS_START, "08:00"),
            8 * 60
        )
        val end = parseMinutes(
            prefs.getString(NottasWeb.PREF_WORK_HOURS_END, "17:00"),
            17 * 60
        )
        val now = Calendar.getInstance().let {
            it.get(Calendar.HOUR_OF_DAY) * 60 + it.get(Calendar.MINUTE)
        }

        // Equal endpoints represent an empty/disabled interval, not a 24-hour block.
        return when {
            start == end -> false
            start < end -> now >= start && now < end
            else -> now >= start || now < end
        }
    }

    fun status(context: Context): String {
        val prefs = context.getSharedPreferences(NottasWeb.PREFS, Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean(NottasWeb.PREF_WORK_HOURS_ENABLED, false)
        val start = prefs.getString(NottasWeb.PREF_WORK_HOURS_START, "08:00") ?: "08:00"
        val end = prefs.getString(NottasWeb.PREF_WORK_HOURS_END, "17:00") ?: "17:00"
        return org.json.JSONObject()
            .put("enabled", enabled)
            .put("start", start)
            .put("end", end)
            .put("activeNow", enabled && isActiveNow(context))
            .toString()
    }

    private fun parseMinutes(value: String?, fallback: Int): Int {
        val parts = value?.split(":") ?: return fallback
        if (parts.size != 2) return fallback
        val hour = parts[0].toIntOrNull() ?: return fallback
        val minute = parts[1].toIntOrNull() ?: return fallback
        if (hour !in 0..23 || minute !in 0..59) return fallback
        return hour * 60 + minute
    }
}

class UnlockOverlayService : Service() {
    companion object {
        const val CHANNEL_ID = "nottas_unlock"
        private const val NOTIFICATION_ID = 1001
    }

    private var armedForWake = true

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

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
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
        if (!wakeEnabled() || WorkHoursPolicy.isActiveNow(this) || !Settings.canDrawOverlays(this)) return

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
