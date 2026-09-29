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

class UnlockOverlayService : Service() {
    companion object {
        private const val CHANNEL_ID = "nottas_unlock"
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
            .setSilent(true)
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
