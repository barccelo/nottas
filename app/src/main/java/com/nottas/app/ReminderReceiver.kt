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
    const val ACTION_REMINDER = "com.nottas.app.ACTION_TASK_REMINDER"

    fun sync(context: Context, json: String): Boolean {
        return try {
            val previous = readItems(context)
            previous.keys().forEach { id -> cancelAlarm(context, id) }

            val input = JSONArray(json)
            val stored = JSONObject()
            val now = System.currentTimeMillis()

            for (i in 0 until input.length()) {
                val item = input.optJSONObject(i) ?: continue
                val id = item.optString("id").trim()
                val text = item.optString("text").trim()
                val at = item.optLong("at", 0L)
                if (id.isEmpty() || text.isEmpty() || at <= now) continue

                stored.put(
                    id,
                    JSONObject()
                        .put("text", text)
                        .put("at", at)
                )
                scheduleAlarm(context, id, text, at)
            }

            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_ITEMS, stored.toString())
                .apply()
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

            items.keys().forEach { id ->
                val item = items.optJSONObject(id) ?: return@forEach
                val text = item.optString("text").trim()
                val at = item.optLong("at", 0L)
                if (text.isNotEmpty() && at > now) {
                    cleaned.put(id, item)
                    scheduleAlarm(context, id, text, at)
                }
            }

            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_ITEMS, cleaned.toString())
                .apply()
        } catch (_: Throwable) {
        }
    }

    fun remove(context: Context, id: String) {
        try {
            cancelAlarm(context, id)
            val items = readItems(context)
            items.remove(id)
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_ITEMS, items.toString())
                .apply()
        } catch (_: Throwable) {
        }
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
}

class ReminderReceiver : BroadcastReceiver() {
    companion object {
        private const val CHANNEL_ID = "nottas_reminders"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != ReminderScheduler.ACTION_REMINDER) return

        val id = intent.getStringExtra("task_id") ?: return
        val text = intent.getStringExtra("task_text") ?: return
        ReminderScheduler.remove(context, id)

        try {
            createChannel(context)

            val openIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            val contentIntent = PendingIntent.getActivity(
                context,
                id.hashCode(),
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = Notification.Builder(context, CHANNEL_ID)
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
    }

    private fun createChannel(context: Context) {
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
}
