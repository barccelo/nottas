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
    private lateinit var snoozeLabel: TextView

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
            setPadding(dp(28), dp(26), dp(28), dp(26))
        }
        root.addView(
            content,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        val brand = TextView(this).apply {
            text = "Nottas"
            textSize = 17f
            setTextColor(Color.rgb(99, 99, 102))
            gravity = Gravity.START or Gravity.CENTER_VERTICAL
            typeface = Typeface.create("sans", Typeface.BOLD)
        }
        content.addView(
            brand,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(54)
            )
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

        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 1.18f))

        val gestureHost = FrameLayout(this).apply {
            clipChildren = false
            clipToPadding = false
        }
        content.addView(
            gestureHost,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(220)
            )
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
        gestureHost.addView(
            knob,
            FrameLayout.LayoutParams(knobSize, knobSize, Gravity.CENTER)
        )

        bindActionGesture(knob)

        val snoozeRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        val snoozeParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(72)
        ).apply {
            topMargin = dp(2)
        }
        content.addView(snoozeRow, snoozeParams)

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
                    updateSnoozeLabel()
                }
            }
        }
        snoozeRow.addView(
            minus,
            LinearLayout.LayoutParams(dp(58), dp(58))
        )

        snoozeLabel = TextView(this).apply {
            text = snoozeText()
            textSize = 17f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            typeface = Typeface.create("sans", Typeface.BOLD)
            background = roundedBackground(Color.rgb(0, 122, 255), dp(30))
            isClickable = true
        }
        val middleParams = LinearLayout.LayoutParams(0, dp(62), 1f).apply {
            marginStart = dp(18)
            marginEnd = dp(18)
        }
        snoozeRow.addView(snoozeLabel, middleParams)

        bindSnoozeButtonGesture(snoozeLabel)

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
                    updateSnoozeLabel()
                }
            }
        }
        snoozeRow.addView(
            plus,
            LinearLayout.LayoutParams(dp(58), dp(58))
        )

        return root
    }

    private fun bindActionGesture(knob: TextView) {
        fun dp(value: Int): Int =
            (value * resources.displayMetrics.density).roundToInt()

        var startX = 0f
        var startY = 0f
        var direction = 0

        val lock = dp(8).toFloat()
        val threshold = dp(52).toFloat()
        val maxTravel = dp(64).toFloat()

        fun showDefaultIcon() {
            knob.setCompoundDrawablesWithIntrinsicBounds(0, 0, 0, 0)
            knob.text = "×"
            knob.setTextColor(Color.rgb(99, 99, 102))
        }

        fun showCompleteIcon() {
            knob.setCompoundDrawablesWithIntrinsicBounds(0, 0, 0, 0)
            knob.text = "✓"
            knob.setTextColor(Color.rgb(52, 199, 89))
        }

        fun showSnoozeIcon() {
            knob.text = ""
            knob.setTextColor(Color.rgb(0, 122, 255))
            knob.setCompoundDrawablesWithIntrinsicBounds(
                R.drawable.ic_snooze_clock,
                0,
                0,
                0
            )
        }

        fun resetPosition(view: View) {
            view.animate()
                .translationX(0f)
                .translationY(0f)
                .setDuration(160)
                .start()
            showDefaultIcon()
        }

        knob.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.rawX
                    startY = event.rawY
                    direction = 0
                    view.animate().cancel()
                    showDefaultIcon()
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - startX
                    val dy = event.rawY - startY
                    val ax = abs(dx)
                    val ay = abs(dy)

                    if (direction == 0 && maxOf(ax, ay) >= lock) {
                        direction = if (ay >= ax) {
                            if (dy < 0) 1 else 2
                        } else {
                            if (dx < 0) 3 else 4
                        }

                        if (direction == 2) showSnoozeIcon() else showCompleteIcon()
                        view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                    }

                    when (direction) {
                        1 -> {
                            view.translationX = 0f
                            view.translationY = dy.coerceIn(-maxTravel, 0f)
                        }
                        2 -> {
                            view.translationX = 0f
                            view.translationY = dy.coerceIn(0f, maxTravel)
                        }
                        3 -> {
                            view.translationY = 0f
                            view.translationX = dx.coerceIn(-maxTravel, 0f)
                        }
                        4 -> {
                            view.translationY = 0f
                            view.translationX = dx.coerceIn(0f, maxTravel)
                        }
                    }
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (event.actionMasked != MotionEvent.ACTION_UP) {
                        resetPosition(view)
                        return@setOnTouchListener true
                    }

                    val dx = event.rawX - startX
                    val dy = event.rawY - startY

                    val completed = when (direction) {
                        1 -> -dy >= threshold
                        3 -> -dx >= threshold
                        4 -> dx >= threshold
                        else -> false
                    }

                    val snoozed = direction == 2 && dy >= threshold

                    when {
                        completed -> {
                            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                            completeReminder()
                        }
                        snoozed -> {
                            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                            snoozeReminder()
                        }
                        else -> resetPosition(view)
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun bindSnoozeButtonGesture(button: TextView) {
        fun dp(value: Int): Int =
            (value * resources.displayMetrics.density).roundToInt()
        var startY = 0f
        var startMinutes = snoozeMinutes
        var moved = false
        var lastMinutes = snoozeMinutes
        val dragThreshold = dp(7).toFloat()
        val minuteStep = dp(18).toFloat()

        button.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startY = event.rawY
                    startMinutes = snoozeMinutes
                    lastMinutes = snoozeMinutes
                    moved = false
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dy = event.rawY - startY
                    if (abs(dy) >= dragThreshold) moved = true
                    if (moved) {
                        val delta = (-dy / minuteStep).roundToInt()
                        val next = (startMinutes + delta).coerceIn(1, 120)
                        if (next != snoozeMinutes) {
                            snoozeMinutes = next
                            updateSnoozeLabel()
                            if (next != lastMinutes) {
                                lastMinutes = next
                                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                            }
                        }
                    }
                    true
                }

                MotionEvent.ACTION_UP -> {
                    if (!moved) {
                        snoozeReminder()
                    } else {
                        view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                    }
                    true
                }

                MotionEvent.ACTION_CANCEL -> true
                else -> false
            }
        }
    }

    private fun updateSnoozeLabel() {
        if (::snoozeLabel.isInitialized) {
            snoozeLabel.text = snoozeText()
        }
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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // A reminder must be completed or snoozed; Back intentionally does nothing.
    }
}
