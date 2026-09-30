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
    private var snoozeMode = false
    private lateinit var actionHost: FrameLayout

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
            setPadding(dp(28), dp(26), dp(28), dp(28))
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
                dp(54)
            )
        )

        val brand = TextView(this).apply {
            text = "Nottas"
            textSize = 17f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.CENTER_VERTICAL
            typeface = Typeface.create("sans", Typeface.BOLD)
        }
        topRow.addView(
            brand,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
                Gravity.START
            )
        )

        val close = TextView(this).apply {
            text = "×"
            textSize = 28f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(142, 142, 147))
            background = roundedBackground(Color.WHITE, dp(22))
            elevation = dp(1).toFloat()
            isClickable = true
            setOnClickListener { finishQuietly() }
        }
        topRow.addView(
            close,
            FrameLayout.LayoutParams(dp(44), dp(44), Gravity.END or Gravity.CENTER_VERTICAL)
        )

        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 0.9f))

        val reminderLabel = TextView(this).apply {
            text = "RECORDATORIO"
            textSize = 12f
            letterSpacing = 0.12f
            setTextColor(Color.rgb(142, 142, 147))
            gravity = Gravity.CENTER
        }
        content.addView(
            reminderLabel,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        val title = TextView(this).apply {
            text = taskText
            textSize = 31f
            setTextColor(Color.rgb(29, 29, 31))
            gravity = Gravity.CENTER
            typeface = Typeface.create("sans", Typeface.BOLD)
            maxLines = 6
            setLineSpacing(0f, 1.06f)
        }
        val titleParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            topMargin = dp(16)
        }
        content.addView(title, titleParams)

        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 1.25f))

        val gestureHelp = TextView(this).apply {
            text = "← Posponer     Completar →"
            textSize = 13f
            setTextColor(Color.rgb(142, 142, 147))
            gravity = Gravity.CENTER
        }
        content.addView(
            gestureHelp,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(34)
            )
        )

        actionHost = FrameLayout(this).apply {
            clipChildren = false
            clipToPadding = false
        }
        content.addView(
            actionHost,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(164)
            )
        )

        buildGestureControl(gestureHelp)

        val footer = TextView(this).apply {
            text = "Desliza el botón, no la tarjeta."
            textSize = 12f
            setTextColor(Color.rgb(174, 174, 178))
            gravity = Gravity.CENTER
        }
        content.addView(
            footer,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(26)
            )
        )

        return root
    }

    private fun buildGestureControl(help: TextView) {
        snoozeMode = false
        snoozeMinutes = 5
        actionHost.removeAllViews()

        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).roundToInt()

        val leftTarget = TextView(this).apply {
            text = "Posponer"
            textSize = 14f
            setTextColor(Color.rgb(0, 122, 255))
            gravity = Gravity.CENTER
            alpha = 0.42f
        }
        actionHost.addView(
            leftTarget,
            FrameLayout.LayoutParams(dp(94), dp(46), Gravity.START or Gravity.CENTER_VERTICAL)
        )

        val rightTarget = TextView(this).apply {
            text = "Completar"
            textSize = 14f
            setTextColor(Color.rgb(52, 199, 89))
            gravity = Gravity.CENTER
            alpha = 0.42f
        }
        actionHost.addView(
            rightTarget,
            FrameLayout.LayoutParams(dp(94), dp(46), Gravity.END or Gravity.CENTER_VERTICAL)
        )

        val knob = TextView(this).apply {
            text = "×"
            textSize = 42f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(99, 99, 102))
            background = circularBackground(Color.WHITE, Color.rgb(209, 209, 214), dp(1))
            elevation = dp(7).toFloat()
            isClickable = true
        }
        val knobSize = dp(92)
        actionHost.addView(
            knob,
            FrameLayout.LayoutParams(knobSize, knobSize, Gravity.CENTER)
        )

        var startX = 0f
        var direction = 0
        val lock = dp(10).toFloat()
        val threshold = dp(94).toFloat()
        val maxTravel = dp(126).toFloat()

        knob.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.rawX
                    direction = 0
                    view.animate().cancel()
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - startX
                    if (direction == 0 && abs(dx) >= lock) {
                        direction = if (dx > 0) 1 else -1
                        view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                    }

                    val tx = dx.coerceIn(-maxTravel, maxTravel)
                    view.translationX = tx

                    if (direction < 0) {
                        leftTarget.alpha = (0.42f + (abs(tx) / threshold) * 0.58f).coerceIn(0.42f, 1f)
                        rightTarget.alpha = 0.24f
                        help.text = if (abs(tx) >= threshold) "Suelta para elegir el tiempo" else "← Posponer"
                    } else if (direction > 0) {
                        rightTarget.alpha = (0.42f + (abs(tx) / threshold) * 0.58f).coerceIn(0.42f, 1f)
                        leftTarget.alpha = 0.24f
                        help.text = if (tx >= threshold) "Suelta para completar ✓" else "Completar →"
                    }
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val dx = event.rawX - startX
                    if (
                        event.actionMasked == MotionEvent.ACTION_UP &&
                        direction > 0 &&
                        dx >= threshold
                    ) {
                        completeReminder()
                    } else if (
                        event.actionMasked == MotionEvent.ACTION_UP &&
                        direction < 0 &&
                        -dx >= threshold
                    ) {
                        view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                        showSnoozeSelector(help)
                    } else {
                        view.animate().translationX(0f).setDuration(180).start()
                        leftTarget.alpha = 0.42f
                        rightTarget.alpha = 0.42f
                        help.text = "← Posponer     Completar →"
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun showSnoozeSelector(help: TextView) {
        snoozeMode = true
        snoozeMinutes = 5
        actionHost.removeAllViews()
        help.text = "Elige cuánto tiempo quieres posponer"

        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).roundToInt()

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        actionHost.addView(
            row,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                dp(92),
                Gravity.CENTER
            )
        )

        val minus = TextView(this).apply {
            text = "−"
            textSize = 30f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(99, 99, 102))
            background = circularBackground(Color.WHITE, Color.rgb(209, 209, 214), dp(1))
            isClickable = true
            setOnClickListener {
                if (snoozeMinutes > 1) {
                    snoozeMinutes -= 1
                    performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                    updateSnoozeLabel(row)
                }
            }
        }
        row.addView(
            minus,
            LinearLayout.LayoutParams(dp(58), dp(58))
        )

        val snooze = TextView(this).apply {
            tag = "snoozeLabel"
            text = snoozeText()
            textSize = 17f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            typeface = Typeface.create("sans", Typeface.BOLD)
            background = roundedBackground(Color.rgb(0, 122, 255), dp(28))
            isClickable = true
            setOnClickListener { snoozeReminder() }
        }
        val snoozeParams = LinearLayout.LayoutParams(0, dp(62), 1f).apply {
            marginStart = dp(18)
            marginEnd = dp(18)
        }
        row.addView(snooze, snoozeParams)

        val plus = TextView(this).apply {
            text = "+"
            textSize = 30f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(99, 99, 102))
            background = circularBackground(Color.WHITE, Color.rgb(209, 209, 214), dp(1))
            isClickable = true
            setOnClickListener {
                if (snoozeMinutes < 120) {
                    snoozeMinutes += 1
                    performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                    updateSnoozeLabel(row)
                }
            }
        }
        row.addView(
            plus,
            LinearLayout.LayoutParams(dp(58), dp(58))
        )

        val back = TextView(this).apply {
            text = "Volver"
            textSize = 13f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(0, 122, 255))
            isClickable = true
            setOnClickListener {
                help.text = "← Posponer     Completar →"
                buildGestureControl(help)
            }
        }
        actionHost.addView(
            back,
            FrameLayout.LayoutParams(dp(90), dp(40), Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL)
        )
    }

    private fun updateSnoozeLabel(row: LinearLayout) {
        row.findViewWithTag<TextView>("snoozeLabel")?.text = snoozeText()
    }

    private fun snoozeText(): String =
        if (snoozeMinutes == 1) "Posponer 1 min" else "Posponer $snoozeMinutes min"

    private fun completeReminder() {
        ReminderActionStore.enqueueComplete(this, taskId)
        ReminderScheduler.remove(this, taskId)
        ReminderScheduler.cancelNotification(this, taskId)
        finishQuietly()
    }

    private fun snoozeReminder() {
        ReminderScheduler.snooze(this, taskId, taskText, snoozeMinutes)
        finishQuietly()
    }

    private fun roundedBackground(color: Int, radius: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }

    private fun circularBackground(color: Int, strokeColor: Int, strokeWidth: Int): GradientDrawable =
        GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(color)
            setStroke(strokeWidth, strokeColor)
        }

    private fun finishQuietly() {
        finish()
        overridePendingTransition(0, 0)
    }

    override fun onBackPressed() {
        if (snoozeMode) {
            val root = actionHost.parent as? LinearLayout
            val help = root?.let {
                val index = it.indexOfChild(actionHost)
                if (index > 0) it.getChildAt(index - 1) as? TextView else null
            }
            if (help != null) {
                help.text = "← Posponer     Completar →"
                buildGestureControl(help)
                return
            }
        }
        finishQuietly()
    }
}
