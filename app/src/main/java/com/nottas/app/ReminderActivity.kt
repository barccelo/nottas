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
import android.widget.ScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray
import kotlin.math.abs
import kotlin.math.roundToInt

class ReminderActivity : Activity() {
    companion object {
        const val EXTRA_TASK_ID = "task_id"
        const val EXTRA_TASK_TEXT = "task_text"
        const val EXTRA_REMINDERS_JSON = "reminders_json"
    }

    private data class ReminderItem(val id: String, val text: String)

    private var taskId: String = ""
    private var taskText: String = ""
    private var snoozeMinutes = 5
    private lateinit var snoozeLabel: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val reminders = readReminderItems()
        if (reminders.isEmpty()) {
            finish()
            return
        }
        taskId = reminders.first().id
        taskText = reminders.first().text

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

        setContentView(if (reminders.size > 1) buildGroupedContent(reminders) else buildContent())
    }

    private fun readReminderItems(): List<ReminderItem> {
        val raw = intent.getStringExtra(EXTRA_REMINDERS_JSON).orEmpty()
        if (raw.isNotBlank()) {
            try {
                val array = JSONArray(raw)
                val out = mutableListOf<ReminderItem>()
                val seen = mutableSetOf<String>()
                for (i in 0 until array.length()) {
                    val item = array.optJSONObject(i) ?: continue
                    val id = item.optString("id").trim()
                    val text = item.optString("text").trim()
                    if (id.isEmpty() || text.isEmpty() || !seen.add(id)) continue
                    out.add(ReminderItem(id, text))
                }
                if (out.isNotEmpty()) return out
            } catch (_: Throwable) {
            }
        }

        val id = intent.getStringExtra(EXTRA_TASK_ID).orEmpty().trim()
        val text = intent.getStringExtra(EXTRA_TASK_TEXT).orEmpty().trim()
        return if (id.isNotEmpty() && text.isNotEmpty()) {
            listOf(ReminderItem(id, text))
        } else {
            emptyList()
        }
    }

    private fun buildGroupedContent(reminders: List<ReminderItem>): View {
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).roundToInt()

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.rgb(245, 245, 247))
        }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(22), dp(20), dp(22))
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
            typeface = Typeface.create("sans", Typeface.BOLD)
            gravity = Gravity.START or Gravity.CENTER_VERTICAL
        }
        content.addView(
            brand,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(46)
            )
        )

        var remaining = reminders.size
        val heading = TextView(this).apply {
            textSize = 26f
            setTextColor(Color.rgb(29, 29, 31))
            typeface = Typeface.create("sans", Typeface.BOLD)
        }
        fun refreshHeading() {
            heading.text =
                if (remaining == 1) "1 recordatorio" else "$remaining recordatorios"
        }
        refreshHeading()
        content.addView(
            heading,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp(4)
                bottomMargin = dp(14)
            }
        )

        val scroll = ScrollView(this).apply {
            isVerticalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            clipToPadding = false
        }
        val list = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(2), 0, dp(14))
        }
        scroll.addView(
            list,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            )
        )
        content.addView(
            scroll,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        )

        reminders.forEachIndexed { index, reminder ->
            var cardSnoozeMinutes = 5
            var startX = 0f
            var startY = 0f
            var horizontal = false
            var thresholdBuzzed = false
            val threshold = dp(68).toFloat()
            val maxTravel =
                (resources.displayMetrics.widthPixels * 0.46f)
                    .coerceAtLeast(dp(150).toFloat())

            val host = FrameLayout(this).apply {
                background = roundedBackground(Color.WHITE, dp(18))
                clipToOutline = true
                clipChildren = true
                clipToPadding = true
            }
            list.addView(
                host,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(142)
                ).apply { bottomMargin = dp(10) }
            )

            val actionLayer = FrameLayout(this).apply {
                background = roundedBackground(Color.rgb(52, 199, 89), dp(18))
            }
            host.addView(
                actionLayer,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )

            val completeIcon = TextView(this).apply {
                text = "✓"
                textSize = 26f
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                typeface = Typeface.create("sans", Typeface.BOLD)
            }
            actionLayer.addView(
                completeIcon,
                FrameLayout.LayoutParams(
                    dp(44),
                    dp(44),
                    Gravity.START or Gravity.CENTER_VERTICAL
                ).apply { marginStart = dp(14) }
            )

            val snoozeIcon = ImageView(this).apply {
                setImageResource(R.drawable.ic_snooze_clock)
                setColorFilter(Color.WHITE)
                scaleType = ImageView.ScaleType.CENTER_INSIDE
                visibility = View.GONE
            }
            actionLayer.addView(
                snoozeIcon,
                FrameLayout.LayoutParams(
                    dp(30),
                    dp(30),
                    Gravity.END or Gravity.CENTER_VERTICAL
                ).apply { marginEnd = dp(22) }
            )

            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(16), dp(13), dp(16), dp(12))
                background = roundedBackground(Color.WHITE, dp(18))
                elevation = 0f
                isClickable = true
            }
            host.addView(
                card,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )

            val position = TextView(this).apply {
                text = "RECORDATORIO " + (index + 1)
                textSize = 9f
                letterSpacing = 0.08f
                setTextColor(Color.rgb(142, 142, 147))
            }
            card.addView(
                position,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            )

            val title = TextView(this).apply {
                text = reminder.text
                textSize = 20f
                setTextColor(Color.rgb(29, 29, 31))
                typeface = Typeface.create("sans", Typeface.BOLD)
                maxLines = 2
                setLineSpacing(0f, 1.03f)
            }
            card.addView(
                title,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    0,
                    1f
                ).apply { topMargin = dp(5) }
            )

            val controls = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
            }
            card.addView(
                controls,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dp(42)
                )
            )

            fun circleButton(label: String, onClick: () -> Unit): TextView =
                TextView(this).apply {
                    text = label
                    textSize = 22f
                    gravity = Gravity.CENTER
                    setTextColor(Color.rgb(99, 99, 102))
                    background = circularBackground(
                        Color.rgb(242, 242, 247),
                        Color.TRANSPARENT,
                        0
                    )
                    isClickable = true
                    setOnClickListener { onClick() }
                }

            val snoozeValue = TextView(this).apply {
                textSize = 14f
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                typeface = Typeface.create("sans", Typeface.BOLD)
                background = roundedBackground(Color.rgb(0, 122, 255), dp(22))
                isClickable = true
            }

            fun refreshSnooze() {
                snoozeValue.text =
                    if (cardSnoozeMinutes == 1) "Posponer 1 min"
                    else "Posponer $cardSnoozeMinutes min"
            }
            refreshSnooze()

            fun resolveComplete() {
                ReminderActionStore.enqueueComplete(this, reminder.id)
                ReminderScheduler.remove(this, reminder.id)
                ReminderScheduler.cancelNotification(this, reminder.id)
            }

            fun resolveSnooze() {
                ReminderScheduler.snooze(
                    this,
                    reminder.id,
                    reminder.text,
                    cardSnoozeMinutes
                )
            }

            fun finishCard(toRight: Boolean) {
                card.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                val target =
                    if (toRight) resources.displayMetrics.widthPixels.toFloat()
                    else -resources.displayMetrics.widthPixels.toFloat()
                card.animate()
                    .translationX(target)
                    .alpha(0f)
                    .setDuration(145)
                    .withEndAction {
                        list.removeView(host)
                        remaining -= 1
                        refreshHeading()
                        if (list.childCount == 0) finishQuietly()
                    }
                    .start()
            }

            fun resetCard() {
                card.animate()
                    .translationX(0f)
                    .alpha(1f)
                    .setDuration(145)
                    .start()
            }

            val minus = circleButton("−") {
                if (cardSnoozeMinutes > 1) {
                    cardSnoozeMinutes -= 1
                    refreshSnooze()
                    card.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                }
            }
            controls.addView(minus, LinearLayout.LayoutParams(dp(36), dp(36)))
            controls.addView(
                snoozeValue,
                LinearLayout.LayoutParams(0, dp(40), 1f).apply {
                    marginStart = dp(10)
                    marginEnd = dp(10)
                }
            )
            val plus = circleButton("+") {
                if (cardSnoozeMinutes < 120) {
                    cardSnoozeMinutes += 1
                    refreshSnooze()
                    card.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                }
            }
            controls.addView(plus, LinearLayout.LayoutParams(dp(36), dp(36)))

            var snoozeStartY = 0f
            var snoozeStartMinutes = cardSnoozeMinutes
            var snoozeMoved = false
            var snoozeLastMinutes = cardSnoozeMinutes
            val snoozeDragThreshold = dp(7).toFloat()
            val snoozeMinuteStep = dp(18).toFloat()

            snoozeValue.setOnTouchListener { view, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        snoozeStartY = event.rawY
                        snoozeStartMinutes = cardSnoozeMinutes
                        snoozeLastMinutes = cardSnoozeMinutes
                        snoozeMoved = false
                        true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        val dy = event.rawY - snoozeStartY
                        if (abs(dy) >= snoozeDragThreshold) snoozeMoved = true
                        if (snoozeMoved) {
                            val delta = (-dy / snoozeMinuteStep).roundToInt()
                            val next = (snoozeStartMinutes + delta).coerceIn(1, 120)
                            if (next != cardSnoozeMinutes) {
                                cardSnoozeMinutes = next
                                refreshSnooze()
                                if (next != snoozeLastMinutes) {
                                    snoozeLastMinutes = next
                                    view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                }
                            }
                        }
                        true
                    }

                    MotionEvent.ACTION_UP -> {
                        if (!snoozeMoved) {
                            resolveSnooze()
                            finishCard(false)
                        } else {
                            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                        }
                        true
                    }

                    MotionEvent.ACTION_CANCEL -> true
                    else -> false
                }
            }

            // Grouped reminders inherit the normal reminder actions horizontally:
            // swipe left = snooze, swipe right = complete.
            card.setOnTouchListener { view, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        startX = event.rawX
                        startY = event.rawY
                        horizontal = false
                        thresholdBuzzed = false
                        view.animate().cancel()
                        true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - startX
                        val dy = event.rawY - startY
                        if (!horizontal && abs(dx) > dp(8) && abs(dx) > abs(dy) * 1.15f) {
                            horizontal = true
                            scroll.requestDisallowInterceptTouchEvent(true)
                        }
                        if (!horizontal) return@setOnTouchListener false

                        val travel = dx.coerceIn(-maxTravel, maxTravel)
                        view.translationX = travel

                        if (travel < 0f) {
                            actionLayer.background =
                                roundedBackground(Color.rgb(0, 122, 255), dp(18))
                            completeIcon.visibility = View.GONE
                            snoozeIcon.visibility = View.VISIBLE
                        } else {
                            actionLayer.background =
                                roundedBackground(Color.rgb(52, 199, 89), dp(18))
                            completeIcon.visibility = View.VISIBLE
                            snoozeIcon.visibility = View.GONE
                        }

                        val reached = abs(travel) >= threshold
                        if (reached && !thresholdBuzzed) {
                            thresholdBuzzed = true
                            view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                        } else if (!reached) {
                            thresholdBuzzed = false
                        }
                        true
                    }

                    MotionEvent.ACTION_UP -> {
                        scroll.requestDisallowInterceptTouchEvent(false)
                        if (!horizontal) {
                            resetCard()
                            return@setOnTouchListener true
                        }

                        val dx = event.rawX - startX
                        when {
                            dx <= -threshold -> {
                                resolveSnooze()
                                finishCard(false)
                            }

                            dx >= threshold -> {
                                resolveComplete()
                                finishCard(true)
                            }

                            else -> resetCard()
                        }
                        true
                    }

                    MotionEvent.ACTION_CANCEL -> {
                        scroll.requestDisallowInterceptTouchEvent(false)
                        resetCard()
                        true
                    }

                    else -> false
                }
            }
        }

        return root
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

        val knob = FrameLayout(this).apply {
            background = circularBackground(Color.WHITE, Color.rgb(209, 209, 214), dp(1))
            elevation = dp(7).toFloat()
            isClickable = true
            clipChildren = false
            clipToPadding = false
        }
        val knobSymbol = TextView(this).apply {
            text = "×"
            textSize = 42f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(99, 99, 102))
        }
        knob.addView(
            knobSymbol,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        val knobIcon = ImageView(this).apply {
            setImageResource(R.drawable.ic_snooze_clock)
            scaleType = ImageView.ScaleType.CENTER_INSIDE
            visibility = View.GONE
        }
        knob.addView(
            knobIcon,
            FrameLayout.LayoutParams(dp(34), dp(34), Gravity.CENTER)
        )

        val knobSize = dp(92)
        gestureHost.addView(
            knob,
            FrameLayout.LayoutParams(knobSize, knobSize, Gravity.CENTER)
        )

        bindActionGesture(knob, knobSymbol, knobIcon)

        val snoozeRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        val snoozeParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(72)
        ).apply {
            topMargin = dp(16)
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

    private fun bindActionGesture(
        knob: FrameLayout,
        symbol: TextView,
        snoozeIcon: ImageView
    ) {
        fun dp(value: Int): Int =
            (value * resources.displayMetrics.density).roundToInt()

        var startX = 0f
        var startY = 0f
        var direction = 0

        val lock = dp(8).toFloat()
        val threshold = dp(38).toFloat()
        val maxTravel = dp(48).toFloat()

        fun showDefaultIcon() {
            snoozeIcon.visibility = View.GONE
            symbol.visibility = View.VISIBLE
            symbol.text = "×"
            symbol.setTextColor(Color.rgb(99, 99, 102))
        }

        fun showCompleteIcon() {
            snoozeIcon.visibility = View.GONE
            symbol.visibility = View.VISIBLE
            symbol.text = "✓"
            symbol.setTextColor(Color.rgb(52, 199, 89))
        }

        fun showSnoozeIcon() {
            symbol.visibility = View.GONE
            snoozeIcon.visibility = View.VISIBLE
        }

        fun resetPosition(view: View) {
            view.animate()
                .translationX(0f)
                .translationY(0f)
                .setDuration(150)
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
