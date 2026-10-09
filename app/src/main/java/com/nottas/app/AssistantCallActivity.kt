package com.nottas.app

import android.app.Activity
import android.app.NotificationManager
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

class AssistantCallActivity : Activity() {
    companion object {
        const val EXTRA_CALL_ID = "assistant_call_id"
        const val EXTRA_CALLER_NAME = "assistant_caller_name"
        const val EXTRA_WORKSPACE_NAME = "assistant_workspace_name"
    }

    private lateinit var callId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        callId = intent.getStringExtra(EXTRA_CALL_ID).orEmpty()
        if (callId.isBlank()) {
            finish()
            return
        }
        val caller = intent.getStringExtra(EXTRA_CALLER_NAME).orEmpty().ifBlank { "Tu jefe" }
        val workspace = intent.getStringExtra(EXTRA_WORKSPACE_NAME).orEmpty().ifBlank { "Asistente" }

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
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).roundToInt()
        fun rounded(color: Int, radius: Int) = GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radius).toFloat()
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(40), dp(24), dp(30))
            setBackgroundColor(Color.rgb(245, 245, 247))
        }

        root.addView(TextView(this).apply {
            text = "Nottas · Asistente"
            textSize = 16f
            setTextColor(Color.rgb(99, 99, 102))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        })

        root.addView(TextView(this).apply {
            text = caller
            textSize = 34f
            setTextColor(Color.rgb(29, 29, 31))
            typeface = Typeface.create("sans", Typeface.BOLD)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(74) })

        root.addView(TextView(this).apply {
            text = "te está llamando"
            textSize = 20f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(6) })

        root.addView(TextView(this).apply {
            text = workspace
            textSize = 14f
            setTextColor(Color.rgb(142, 142, 147))
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(12) })

        root.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))

        fun addAction(label: String, response: String, primary: Boolean = false) {
            val button = TextView(this).apply {
                text = label
                textSize = 18f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(if (primary) Color.WHITE else Color.rgb(29, 29, 31))
                background = rounded(
                    if (primary) Color.rgb(22, 119, 255) else Color.WHITE,
                    16
                )
                setOnClickListener { answer(response) }
            }
            root.addView(button, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(58)
            ).apply { topMargin = dp(10) })
        }

        addAction("Voy", "coming", true)
        addAction("En 5 min", "five_min")
        addAction("No disponible", "unavailable")

        setContentView(root)
    }

    private fun answer(response: String) {
        AssistantPush.respondToCall(applicationContext, callId, response)
        try {
            getSystemService(NotificationManager::class.java).cancel(callId.hashCode())
        } catch (_: Throwable) {
        }
        finish()
    }
}
