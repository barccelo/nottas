package com.nottas.app

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
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

class ReminderActivity : Activity() {
    companion object {
        const val EXTRA_TASK_ID = "task_id"
        const val EXTRA_TASK_TEXT = "task_text"
    }

    private var taskId: String = ""
    private var taskText: String = ""
    private var snoozeMinutes = 5

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        taskId = intent.getStringExtra(EXTRA_TASK_ID).orEmpty()
        taskText = intent.getStringExtra(EXTRA_TASK_TEXT).orEmpty()
        if (taskId.isBlank() || taskText.isBlank()) {
            finish()
            return
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

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
                View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        setContentView(buildContent())
    }

    private fun buildContent(): View {
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).roundToInt()

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.rgb(245, 245, 247))
        }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(24), dp(24), dp(28))
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
            text = "Recordatorio"
            textSize = 15f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.CENTER_VERTICAL
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
            text = "×"
            textSize = 30f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(142, 142, 147))
            background = roundedBackground(Color.WHITE, dp(22))
            isClickable = true
            setOnClickListener { finishQuietly() }
        }
        topRow.addView(
            close,
            FrameLayout.LayoutParams(dp(44), dp(44), Gravity.END or Gravity.CENTER_VERTICAL)
        )

        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))

        val title = TextView(this).apply {
            text = taskText
            textSize = 30f
            setTextColor(Color.rgb(29, 29, 31))
            gravity = Gravity.CENTER
            typeface = Typeface.create("sans", Typeface.BOLD)
            maxLines = 5
        }

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(34), dp(28), dp(34))
            background = roundedBackground(Color.WHITE, dp(28))
            elevation = dp(10).toFloat()
            addView(
                title,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            )
        }
        content.addView(
            card,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        val status = TextView(this).apply {
            text = "← Posponer 5 min     Completar →"
            textSize = 15f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.CENTER
        }
        content.addView(
            status,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(64)
            )
        )

        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))

        val instruction = TextView(this).apply {
            text = "Desliza a la derecha para completar.\nDesliza a la izquierda para posponer; luego sube o baja para ajustar los minutos."
            textSize = 13f
            setTextColor(Color.rgb(142, 142, 147))
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.18f)
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
                        val tx = dx.coerceAtLeast(0f).coerceAtMost(dp(160).toFloat())
                        view.translationX = tx
                        view.translationY = 0f
                        status.text =
                            if (tx >= horizontalThreshold) "Suelta para completar ✓"
                            else "Completar →"
                        status.setTextColor(Color.rgb(52, 199, 89))
                    } else if (direction == -1) {
                        val tx = dx.coerceAtMost(0f).coerceAtLeast(-dp(160).toFloat())
                        view.translationX = tx
                        view.translationY = (dy * 0.08f).coerceIn(
                            -dp(18).toFloat(),
                            dp(18).toFloat()
                        )

                        val nextMinutes =
                            (5 + (-dy / minuteStep).roundToInt()).coerceIn(1, 120)
                        if (nextMinutes != snoozeMinutes) {
                            snoozeMinutes = nextMinutes
                            view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                        }
                        status.text =
                            if (-tx >= horizontalThreshold) {
                                "Suelta para posponer $snoozeMinutes min"
                            } else {
                                "← Posponer $snoozeMinutes min"
                            }
                        status.setTextColor(Color.rgb(0, 122, 255))
                    }
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val dx = event.rawX - startX
                    if (
                        event.actionMasked == MotionEvent.ACTION_UP &&
                        direction == 1 &&
                        dx >= horizontalThreshold
                    ) {
                        ReminderActionStore.enqueueComplete(this, taskId)
                        ReminderScheduler.remove(this, taskId)
                        ReminderScheduler.cancelNotification(this, taskId)
                        finishQuietly()
                    } else if (
                        event.actionMasked == MotionEvent.ACTION_UP &&
                        direction == -1 &&
                        -dx >= horizontalThreshold
                    ) {
                        ReminderScheduler.snooze(this, taskId, taskText, snoozeMinutes)
                        finishQuietly()
                    } else {
                        view.animate()
                            .translationX(0f)
                            .translationY(0f)
                            .setDuration(180)
                            .start()
                        status.text = "← Posponer 5 min     Completar →"
                        status.setTextColor(Color.rgb(99, 99, 102))
                    }
                    true
                }

                else -> false
            }
        }

        return root
    }

    private fun roundedBackground(color: Int, radius: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }

    private fun finishQuietly() {
        finish()
        overridePendingTransition(0, 0)
    }

    override fun onBackPressed() {
        finishQuietly()
    }
}
