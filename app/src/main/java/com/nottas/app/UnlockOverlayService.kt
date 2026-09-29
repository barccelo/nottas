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
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.TextView

class UnlockOverlayService : Service() {
    companion object {
        private const val CHANNEL_ID = "nottas_unlock"
        private const val NOTIFICATION_ID = 1001
    }

    private lateinit var windowManager: WindowManager
    private var overlayRoot: FrameLayout? = null
    private var overlayWebView: WebView? = null

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> hideOverlay()
                Intent.ACTION_USER_PRESENT -> maybeShowOverlay()
                Intent.ACTION_SCREEN_ON -> {
                    val keyguard = getSystemService(KeyguardManager::class.java)
                    if (!keyguard.isKeyguardLocked) maybeShowOverlay()
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startAsForeground()
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(screenReceiver, filter, Context.RECEIVER_EXPORTED)
        else @Suppress("DEPRECATION") registerReceiver(screenReceiver, filter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        try { unregisterReceiver(screenReceiver) } catch (_: Throwable) {}
        hideOverlay()
        super.onDestroy()
    }

    private fun wakeEnabled(): Boolean = getSharedPreferences(NottasWeb.PREFS, MODE_PRIVATE)
        .getBoolean(NottasWeb.PREF_WAKE_ENABLED, true)

    private fun maybeShowOverlay() {
        if (!wakeEnabled() || !Settings.canDrawOverlays(this)) return
        showOverlay()
    }

    private fun showOverlay() {
        if (overlayRoot != null) return

        val root = FrameLayout(this).apply { setBackgroundColor(0xFFF5F5F7.toInt()) }
        val web = WebView(this)
        NottasWeb.configure(
            web,
            NottasWeb.NativeBridge(
                this,
                onCloseOverlay = { hideOverlay() }
            )
        )
        root.addView(web, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))

        val close = TextView(this).apply {
            text = "×"
            textSize = 27f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(29, 29, 31))
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.argb(235, 233, 233, 238))
            }
            elevation = dp(8).toFloat()
            setOnClickListener { hideOverlay() }
            contentDescription = "Cerrar Nottas"
        }
        val closeParams = FrameLayout.LayoutParams(dp(44), dp(44)).apply {
            gravity = Gravity.TOP or Gravity.END
            topMargin = dp(10)
            marginEnd = dp(10)
        }
        root.addView(close, closeParams)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }

        try {
            windowManager.addView(root, params)
            overlayRoot = root
            overlayWebView = web
            web.loadUrl(NottasWeb.ASSET_URL)
        } catch (_: Throwable) {
            web.destroy()
        }
    }

    private fun hideOverlay() {
        val root = overlayRoot ?: return
        try { windowManager.removeView(root) } catch (_: Throwable) {}
        overlayWebView?.removeJavascriptInterface("NottasNative")
        overlayWebView?.destroy()
        overlayWebView = null
        overlayRoot = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(com.nottas.app.R.string.overlay_channel_name),
            NotificationManager.IMPORTANCE_MIN
        ).apply {
            description = getString(com.nottas.app.R.string.overlay_channel_description)
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
            .setSmallIcon(com.nottas.app.R.drawable.ic_nottas)
            .setContentTitle("Nottas")
            .setContentText("Listo para aparecer al encender o desbloquear")
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(android.app.Notification.CATEGORY_SERVICE)
            .build()

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
