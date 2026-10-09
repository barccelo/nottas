package com.nottas.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

class AssistantMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        getSharedPreferences("nottas_assistant", MODE_PRIVATE)
            .edit().putString("fcm_token", token).remove("fcm_error").apply()
        AssistantEventStore.enqueue(
            this,
            JSONObject().put("type", "push_token").put("fcmToken", token)
        )
        AssistantPush.ensureServerRegistration(this)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val type = data["type"].orEmpty()
        getSharedPreferences("nottas_assistant", MODE_PRIVATE)
            .edit()
            .putLong("last_fcm_received_at", System.currentTimeMillis())
            .putString("last_fcm_received_type", type)
            .apply()
        val event = JSONObject()
        data.forEach { (key, value) -> event.put(key, value) }
        AssistantEventStore.enqueue(this, event)

        when (type) {
            "assistant_call" -> {
                AssistantCallNotifier.show(
                    this,
                    data["callId"].orEmpty(),
                    data["callerName"].orEmpty().ifBlank { "Tu jefe" },
                    data["workspaceName"].orEmpty().ifBlank { "Asistente" }
                )
            }
            "assistant_call_response" -> {
                val who = data["fromName"].orEmpty().ifBlank { "Asistente" }
                val response = when (data["response"]) {
                    "coming" -> "Voy"
                    "five_min" -> "En 5 min"
                    "unavailable" -> "No disponible"
                    else -> "Respondió"
                }
                if (!AssistantForegroundBridge.isForeground()) {
                    AssistantNotification.show(
                        this,
                        "Respuesta de " + who,
                        response,
                        ("call_response_" + data["callId"].orEmpty()).hashCode()
                    )
                }
            }
            "sync" -> {
                if (!AssistantForegroundBridge.isForeground()) {
                    AssistantNotification.show(
                        this,
                        "Cambios en Asistente",
                        "Hay información nueva para sincronizar.",
                        ("assistant_sync_" + data["workspaceId"].orEmpty()).hashCode()
                    )
                }
            }
        }
    }
}

object AssistantNotification {
    private const val CHANNEL_ID = "assistant_updates"

    fun show(context: Context, title: String, text: String, id: Int) {
        ensureChannel(context)
        val intent = Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pending = PendingIntent.getActivity(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
        }
        val notification = builder
            .setSmallIcon(R.drawable.ic_nottas)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(pending)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_STATUS)
            .build()
        context.getSystemService(NotificationManager::class.java).notify(id, notification)
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "Asistente · Actualizaciones",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Cambios y respuestas del espacio compartido de Nottas." }
        )
    }
}

object AssistantCallNotifier {
    const val CHANNEL_ID = "assistant_calls"

    fun show(context: Context, callId: String, callerName: String, workspaceName: String) {
        if (callId.isBlank()) return
        ensureChannel(context)
        val intent = Intent(context, AssistantCallActivity::class.java).apply {
            putExtra(AssistantCallActivity.EXTRA_CALL_ID, callId)
            putExtra(AssistantCallActivity.EXTRA_CALLER_NAME, callerName)
            putExtra(AssistantCallActivity.EXTRA_WORKSPACE_NAME, workspaceName)
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            )
        }
        val pending = PendingIntent.getActivity(
            context,
            callId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
        }
        val notification = builder
            .setSmallIcon(R.drawable.ic_nottas)
            .setContentTitle(callerName + " te llama")
            .setContentText(workspaceName)
            .setContentIntent(pending)
            .setFullScreenIntent(pending, true)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_CALL)
            .setOngoing(false)
            .build()
        context.getSystemService(NotificationManager::class.java)
            .notify(callId.hashCode(), notification)

        try {
            context.startActivity(intent)
        } catch (_: Throwable) {
            // Full-screen notification remains available when Android blocks background starts.
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "Asistente · Llamadas",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Llamadas urgentes entre jefe y asistente."
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setShowBadge(true)
            }
        )
    }
}
