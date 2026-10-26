package com.nottas.app

import android.app.Activity
import android.app.NotificationManager
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.math.roundToInt

/** Acknowledgement screen for a notice sent by an authorized workspace assistant. */
class AssistantNoticeActivity : Activity() {
    companion object {
        const val EXTRA_NOTICE_ID = "assistant_notice_id"
        const val EXTRA_FROM_NAME = "assistant_notice_from_name"
        const val EXTRA_MESSAGE = "assistant_notice_message"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        renderNotice()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        renderNotice()
    }

    private fun renderNotice() {
        val noticeId = intent.getStringExtra(EXTRA_NOTICE_ID).orEmpty()
        if (noticeId.isBlank()) { finish(); return }
        val who = intent.getStringExtra(EXTRA_FROM_NAME).orEmpty().ifBlank { "Asistente" }
        val message = intent.getStringExtra(EXTRA_MESSAGE).orEmpty().take(280)
        if (message.isBlank()) { finish(); return }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val density = resources.displayMetrics.density
        fun dp(i: Int) = (i * density).roundToInt()
        val background = Color.rgb(245,245,247)
        val ink = Color.rgb(29,29,31)
        val gray = Color.rgb(99,99,102)
        val blue = Color.rgb(22,119,255)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(35), dp(24), dp(28))
            setBackgroundColor(background)
        }
        root.addView(TextView(this).apply {
            text = "Nottas · Aviso"
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(gray)
            gravity = Gravity.CENTER
        })
        root.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))
        root.addView(TextView(this).apply {
            text = who
            textSize = 33f
            typeface = Typeface.create("sans", Typeface.BOLD)
            setTextColor(ink)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(-1, -2))
        root.addView(TextView(this).apply {
            text = "te ha enviado un aviso"
            textSize = 18f
            setTextColor(gray)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(7) })
        val scroller = ScrollView(this).apply { isFillViewport = false }
        scroller.addView(TextView(this).apply {
            text = message
            textSize = 27f
            setTextColor(blue)
            typeface = Typeface.create("sans", Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(10), dp(8), dp(10))
        })
        root.addView(scroller, LinearLayout.LayoutParams(-1, 0, 2f).apply {
            topMargin = dp(18)
        })
        val close = TextView(this).apply {
            text = "Entendido"
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(blue)
                cornerRadius = dp(16).toFloat()
            }
            setOnClickListener { finish() }
        }
        root.addView(close, LinearLayout.LayoutParams(-1, dp(58)))
        setContentView(root)
        getSystemService(NotificationManager::class.java)
            .cancel(AssistantNoticeNotifier.notificationId(noticeId))
    }
}
