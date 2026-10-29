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
import android.widget.TextView
import kotlin.math.roundToInt

/**
 * Full-screen acknowledgement of an assistant's answer to the boss's call.
 * No action is posted to the server: the response has already been recorded.
 */
class AssistantResponseActivity : Activity() {
    companion object {
        const val EXTRA_CALL_ID = "assistant_response_call_id"
        const val EXTRA_FROM_NAME = "assistant_response_from_name"
        const val EXTRA_RESPONSE = "assistant_response_value"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        renderResponse()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        renderResponse()
    }

    private fun renderResponse() {
        val callId = intent.getStringExtra(EXTRA_CALL_ID).orEmpty()
        if (callId.isBlank()) {
            finish()
            return
        }
        val fromName = intent.getStringExtra(EXTRA_FROM_NAME).orEmpty().ifBlank { "Asistente" }
        val response = when (intent.getStringExtra(EXTRA_RESPONSE)) {
            "coming" -> "Voy"
            "five_min" -> "En 5 min"
            "unavailable" -> "No disponible"
            else -> "Respondió"
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).roundToInt()
        val textColor = Color.rgb(29, 29, 31)
        val mutedColor = Color.rgb(99, 99, 102)
        val accent = Color.rgb(22, 119, 255)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(40), dp(24), dp(30))
            setBackgroundColor(Color.rgb(245, 245, 247))
        }

        root.addView(TextView(this).apply {
            text = "Respuesta recibida"
            textSize = 16f
            setTextColor(mutedColor)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        })
        root.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))
        root.addView(TextView(this).apply {
            text = "De $fromName"
            textSize = 15f
            setTextColor(mutedColor)
            typeface = Typeface.create("sans-medium", Typeface.NORMAL)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ))
        root.addView(TextView(this).apply {
            text = "ha respondido"
            textSize = 13f
            setTextColor(mutedColor)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(8) })
        root.addView(TextView(this).apply {
            text = response
            textSize = 39f
            setTextColor(accent)
            typeface = Typeface.create("sans", Typeface.BOLD)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(24) })
        root.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))

        val button = TextView(this).apply {
            text = "Entendido"
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(accent)
                cornerRadius = dp(16).toFloat()
            }
            setOnClickListener { finish() }
        }
        root.addView(button, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dp(58)
        ))
        setContentView(root)

        // The reply is acknowledged by opening the full-screen view.
        getSystemService(NotificationManager::class.java)
            .cancel(AssistantResponseNotifier.notificationId(callId))
    }
}
