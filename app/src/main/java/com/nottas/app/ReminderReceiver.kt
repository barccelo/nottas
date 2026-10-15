package com.nottas.app

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.abs

object ReminderScheduler {
    private const val PREFS = "nottas_reminders"
    private const val KEY_ITEMS = "items"
    private const val CHANNEL_ID = "nottas_reminders"
    const val ACTION_REMINDER = "com.nottas.app.ACTION_TASK_REMINDER"

    fun sync(context: Context, json: String): Boolean {
        return try {
            val previous = readItems(context)
            val input = JSONArray(json)
            val activeTaskIds = mutableSetOf<String>()

            for (i in 0 until input.length()) {
                val item = input.optJSONObject(i) ?: continue
                val taskId = item.optString("id").trim()
                if (taskId.isNotEmpty()) activeTaskIds.add(taskId)
            }

            val previousKeys = mutableListOf<String>()
            previous.keys().forEach { previousKeys.add(it) }
            previousKeys.forEach { cancelAlarm(context, it) }

            val stored = JSONObject()
            val now = System.currentTimeMillis()

            for (i in 0 until input.length()) {
                val item = input.optJSONObject(i) ?: continue
                val taskId = item.optString("id").trim()
                val alarmId = item.optString("alarmId").trim().ifEmpty { taskId }
                val text = item.optString("text").trim()
                val at = item.optLong("at", 0L)
                if (taskId.isEmpty() || alarmId.isEmpty() || text.isEmpty() || at <= now) continue

                stored.put(
                    alarmId,
                    JSONObject()
                        .put("taskId", taskId)
                        .put("text", text)
                        .put("at", at)
                        .put("snoozed", false)
                )
                scheduleAlarm(context, alarmId, taskId, text, at)
            }

            // A snoozed reminder is independent from the event's other future alerts.
            previousKeys.forEach { alarmId ->
                val old = previous.optJSONObject(alarmId) ?: return@forEach
                if (!old.optBoolean("snoozed", false)) return@forEach
                val taskId = old.optString("taskId", alarmId.substringBefore("::")).trim()
                val text = old.optString("text").trim()
                val at = old.optLong("at", 0L)
                if (taskId.isEmpty() || text.isEmpty() || at <= now || !activeTaskIds.contains(taskId)) return@forEach
                stored.put(alarmId, old)
                scheduleAlarm(context, alarmId, taskId, text, at)
            }

            previousKeys.forEach { alarmId ->
                val old = previous.optJSONObject(alarmId)
                val taskId = old?.optString("taskId", alarmId.substringBefore("::"))?.trim().orEmpty()
                if (taskId.isNotEmpty() && !activeTaskIds.contains(taskId)) cancelNotification(context, taskId)
            }

            saveItems(context, stored)
            true
        } catch (_: Throwable) {
            false
        }
    }

    fun rescheduleAll(context: Context) {
        try {
            val items = readItems(context)
            val now = System.currentTimeMillis()
            val cleaned = JSONObject()
            val keys = mutableListOf<String>()
            items.keys().forEach { keys.add(it) }

            keys.forEach { alarmId ->
                val item = items.optJSONObject(alarmId) ?: return@forEach
                val taskId = item.optString("taskId", alarmId.substringBefore("::")).trim()
                val text = item.optString("text").trim()
                val at = item.optLong("at", 0L)
                if (taskId.isNotEmpty() && text.isNotEmpty() && at > now) {
                    cleaned.put(alarmId, item)
                    scheduleAlarm(context, alarmId, taskId, text, at)
                }
            }
            saveItems(context, cleaned)
        } catch (_: Throwable) {
        }
    }

    @Synchronized
    fun claimDueGroup(context: Context, triggerAlarmId: String): JSONArray {
        val items = readItems(context)
        val trigger = items.optJSONObject(triggerAlarmId) ?: return JSONArray()
        val triggerAt = trigger.optLong("at", 0L)
        if (triggerAt <= 0L) return JSONArray()

        val group = JSONArray()
        val claimedAlarmIds = mutableListOf<String>()
        val keys = mutableListOf<String>()
        items.keys().forEach { keys.add(it) }

        keys.forEach { alarmId ->
            val item = items.optJSONObject(alarmId) ?: return@forEach
            val at = item.optLong("at", 0L)
            if (abs(at - triggerAt) > 1_000L) return@forEach
            val taskId = item.optString("taskId", alarmId.substringBefore("::")).trim()
            val text = item.optString("text").trim()
            if (taskId.isEmpty() || text.isEmpty()) return@forEach
            group.put(
                JSONObject()
                    .put("id", taskId)
                    .put("alarmId", alarmId)
                    .put("text", text)
                    .put("at", at)
                    .put("snoozed", item.optBoolean("snoozed", false))
            )
            claimedAlarmIds.add(alarmId)
        }

        if (claimedAlarmIds.isEmpty()) return JSONArray()
        claimedAlarmIds.forEach { alarmId ->
            cancelAlarm(context, alarmId)
            items.remove(alarmId)
        }
        saveItems(context, items)
        return group
    }

    fun snooze(context: Context, taskId: String, text: String, minutes: Int) {
        try {
            val safeMinutes = minutes.coerceIn(1, 120)
            val at = System.currentTimeMillis() + safeMinutes * 60_000L
            val alarmId = taskId + "::snooze"
            cancelAlarm(context, alarmId)
            cancelNotification(context, taskId)

            val items = readItems(context)
            items.put(
                alarmId,
                JSONObject()
                    .put("taskId", taskId)
                    .put("text", text)
                    .put("at", at)
                    .put("snoozed", true)
            )
            saveItems(context, items)
            scheduleAlarm(context, alarmId, taskId, text, at)
        } catch (_: Throwable) {
        }
    }

    fun remove(context: Context, taskId: String) {
        try {
            val items = readItems(context)
            val keys = mutableListOf<String>()
            items.keys().forEach { keys.add(it) }
            keys.forEach { alarmId ->
                val item = items.optJSONObject(alarmId)
                val storedTaskId = item?.optString("taskId", alarmId.substringBefore("::"))?.trim().orEmpty()
                if (storedTaskId == taskId || alarmId == taskId) {
                    cancelAlarm(context, alarmId)
                    items.remove(alarmId)
                }
            }
            saveItems(context, items)
            cancelNotification(context, taskId)
        } catch (_: Throwable) {
        }
    }

    fun cancelNotification(context: Context, taskId: String) {
        try {
            context.getSystemService(NotificationManager::class.java).cancel(taskId.hashCode())
        } catch (_: Throwable) {
        }
    }

    private fun saveItems(context: Context, items: JSONObject) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_ITEMS, items.toString())
            .apply()
    }

    private fun readItems(context: Context): JSONObject {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_ITEMS, "{}")
            ?: "{}"
        return try {
            JSONObject(raw)
        } catch (_: Throwable) {
            JSONObject()
        }
    }

    private fun scheduleAlarm(context: Context, alarmId: String, taskId: String, text: String, at: Long) {
        val manager = context.getSystemService(AlarmManager::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId.hashCode(),
            Intent(context, ReminderReceiver::class.java)
                .setAction(ACTION_REMINDER)
                .putExtra("alarm_id", alarmId)
                .putExtra("task_id", taskId)
                .putExtra("task_text", text),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.canScheduleExactAlarms() ->
                    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
                    manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
                    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
                else -> manager.setExact(AlarmManager.RTC_WAKEUP, at, pendingIntent)
            }
        } catch (_: SecurityException) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
        }
    }

    private fun cancelAlarm(context: Context, alarmId: String) {
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId.hashCode(),
            Intent(context, ReminderReceiver::class.java).setAction(ACTION_REMINDER),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        ) ?: return
        context.getSystemService(AlarmManager::class.java).cancel(pendingIntent)
        pendingIntent.cancel()
    }

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Recordatorios",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Avisos de tareas programadas en Nottas."
            setShowBadge(true)
        }
        manager.createNotificationChannel(channel)
    }

    fun channelId(): String = CHANNEL_ID
}

object ReminderActionStore {
    private const val PREFS = "nottas_reminder_actions"
    private const val KEY_QUEUE = "queue"

    @Synchronized
    fun enqueueComplete(context: Context, taskId: String) {
        try {
            val queue = readQueue(context)
            queue.put(
                JSONObject()
                    .put("type", "complete")
                    .put("taskId", taskId)
                    .put("at", System.currentTimeMillis())
            )
            saveQueue(context, queue)
        } catch (_: Throwable) {
        }
    }

    @Synchronized
    fun consume(context: Context): String {
        return try {
            val queue = readQueue(context)
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(KEY_QUEUE)
                .apply()
            queue.toString()
        } catch (_: Throwable) {
            "[]"
        }
    }

    private fun readQueue(context: Context): JSONArray {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_QUEUE, "[]")
            ?: "[]"
        return try {
            JSONArray(raw)
        } catch (_: Throwable) {
            JSONArray()
        }
    }

    private fun saveQueue(context: Context, queue: JSONArray) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_QUEUE, queue.toString())
            .apply()
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != ReminderScheduler.ACTION_REMINDER) return

        val triggerAlarmId = intent.getStringExtra("alarm_id") ?: intent.getStringExtra("task_id") ?: return
        val group = ReminderScheduler.claimDueGroup(context, triggerAlarmId)
        if (group.length() == 0) return

        try {
            ReminderScheduler.ensureChannel(context)
            val manager = context.getSystemService(NotificationManager::class.java)

            for (i in 0 until group.length()) {
                val item = group.optJSONObject(i) ?: continue
                val id = item.optString("id").trim()
                val text = item.optString("text").trim()
                if (id.isEmpty() || text.isEmpty()) continue

                val openIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                val contentIntent = PendingIntent.getActivity(
                    context,
                    id.hashCode(),
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                val notification = Notification.Builder(context, ReminderScheduler.channelId())
                    .setSmallIcon(R.drawable.ic_nottas)
                    .setContentTitle(
                        if (group.length() > 1) {
                            "Recordatorio " + (i + 1) + " de " + group.length()
                        } else {
                            "Recordatorio de Nottas"
                        }
                    )
                    .setContentText(text)
                    .setStyle(Notification.BigTextStyle().bigText(text))
                    .setContentIntent(contentIntent)
                    .setAutoCancel(true)
                    .setCategory(Notification.CATEGORY_REMINDER)
                    .build()

                manager.notify(id.hashCode(), notification)
            }
        } catch (_: Throwable) {
        }

        try {
            val first = group.optJSONObject(0) ?: return
            val reminderIntent = Intent(context, ReminderActivity::class.java).apply {
                putExtra(ReminderActivity.EXTRA_TASK_ID, first.optString("id"))
                putExtra(ReminderActivity.EXTRA_TASK_TEXT, first.optString("text"))
                putExtra(ReminderActivity.EXTRA_REMINDERS_JSON, group.toString())
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS or
                        Intent.FLAG_ACTIVITY_NO_ANIMATION
                )
            }
            context.startActivity(reminderIntent)
        } catch (_: Throwable) {
            // The notifications remain available if Android blocks the full-screen activity.
        }
    }
}
