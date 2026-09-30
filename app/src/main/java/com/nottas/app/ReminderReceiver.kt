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

object ReminderScheduler {
    private const val PREFS = "nottas_reminders"
    private const val KEY_ITEMS = "items"
    private const val CHANNEL_ID = "nottas_reminders"
    const val ACTION_REMINDER = "com.nottas.app.ACTION_TASK_REMINDER"

    fun sync(context: Context, json: String): Boolean {
        return try {
            val previous = readItems(context)
            val input = JSONArray(json)
            val activeIds = mutableSetOf<String>()

            for (i in 0 until input.length()) {
                val item = input.optJSONObject(i) ?: continue
                val id = item.optString("id").trim()
                if (id.isNotEmpty()) activeIds.add(id)
            }

            val previousKeys = previous.keys()
            while (previousKeys.hasNext()) {
                cancelAlarm(context, previousKeys.next())
            }

            val stored = JSONObject()
            val now = System.currentTimeMillis()

            for (i in 0 until input.length()) {
                val item = input.optJSONObject(i) ?: continue
                val id = item.optString("id").trim()
                val text = item.optString("text").trim()
                val at = item.optLong("at", 0L)
                if (id.isEmpty() || text.isEmpty()) continue

                val old = previous.optJSONObject(id)
                val snoozedAt = if (old?.optBoolean("snoozed", false) == true) {
                    old.optLong("at", 0L)
                } else {
                    0L
                }

                val targetAt = when {
                    snoozedAt > now -> snoozedAt
                    at > now -> at
                    else -> 0L
                }
                if (targetAt <= now) continue

                val snoozed = snoozedAt > now
                stored.put(
                    id,
                    JSONObject()
                        .put("text", text)
                        .put("at", targetAt)
                        .put("snoozed", snoozed)
                )
                scheduleAlarm(context, id, text, targetAt)
            }

            // Any item no longer present in the live task set is intentionally discarded.
            val staleKeys = previous.keys()
            while (staleKeys.hasNext()) {
                val id = staleKeys.next()
                if (!activeIds.contains(id)) cancelNotification(context, id)
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
            val keys = items.keys()

            while (keys.hasNext()) {
                val id = keys.next()
                val item = items.optJSONObject(id) ?: continue
                val text = item.optString("text").trim()
                val at = item.optLong("at", 0L)
                if (text.isNotEmpty() && at > now) {
                    cleaned.put(id, item)
                    scheduleAlarm(context, id, text, at)
                }
            }

            saveItems(context, cleaned)
        } catch (_: Throwable) {
        }
    }

    fun snooze(context: Context, id: String, text: String, minutes: Int) {
        try {
            val safeMinutes = minutes.coerceIn(1, 120)
            val at = System.currentTimeMillis() + safeMinutes * 60_000L
            cancelAlarm(context, id)
            cancelNotification(context, id)

            val items = readItems(context)
            items.put(
                id,
                JSONObject()
                    .put("text", text)
                    .put("at", at)
                    .put("snoozed", true)
            )
            saveItems(context, items)
            scheduleAlarm(context, id, text, at)
        } catch (_: Throwable) {
        }
    }

    fun remove(context: Context, id: String) {
        try {
            cancelAlarm(context, id)
            val items = readItems(context)
            items.remove(id)
            saveItems(context, items)
        } catch (_: Throwable) {
        }
    }

    fun cancelNotification(context: Context, id: String) {
        try {
            context.getSystemService(NotificationManager::class.java).cancel(id.hashCode())
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

    private fun scheduleAlarm(context: Context, id: String, text: String, at: Long) {
        val manager = context.getSystemService(AlarmManager::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            Intent(context, ReminderReceiver::class.java)
                .setAction(ACTION_REMINDER)
                .putExtra("task_id", id)
                .putExtra("task_text", text),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
    }

    private fun cancelAlarm(context: Context, id: String) {
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id.hashCode(),
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

        val id = intent.getStringExtra("task_id") ?: return
        val text = intent.getStringExtra("task_text") ?: return
        ReminderScheduler.remove(context, id)

        try {
            ReminderScheduler.ensureChannel(context)

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
                .setContentTitle("Recordatorio de Nottas")
                .setContentText(text)
                .setStyle(Notification.BigTextStyle().bigText(text))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .build()

            context.getSystemService(NotificationManager::class.java)
                .notify(id.hashCode(), notification)
        } catch (_: Throwable) {
        }

        try {
            val overlayIntent = Intent(context, UnlockOverlayService::class.java)
                .setAction(UnlockOverlayService.ACTION_SHOW_REMINDER)
                .putExtra(UnlockOverlayService.EXTRA_REMINDER_ID, id)
                .putExtra(UnlockOverlayService.EXTRA_REMINDER_TEXT, text)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(overlayIntent)
            } else {
                context.startService(overlayIntent)
            }
        } catch (_: Throwable) {
            // The notification remains available if Android blocks the overlay service launch.
        }
    }
}
