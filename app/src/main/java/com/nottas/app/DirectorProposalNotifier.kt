package com.nottas.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

/**
 * A persistent approval queue, not a calendar reminder or timed alarm.
 * The queue stays in D1; this Android notification is only its status indicator.
 */
object DirectorProposalNotifier {
    private const val CHANNEL_ID = "director_proposals_v1"
    private const val NOTIFICATION_ID = 340923

    fun sync(context: Context, pendingCount: Int) {
        val manager = context.getSystemService(NotificationManager::class.java)
        if (pendingCount <= 0) {
            manager.cancel(NOTIFICATION_ID)
            return
        }
        show(context, pendingCount, "")
    }

    fun incoming(context: Context, title: String) {
        // A push received while the app is closed immediately revives the
        // persistent status. The next app sync replaces this with the exact count.
        show(context, -1, title.take(120))
    }

    private fun show(context: Context, count: Int, title: String) {
        if (Build.VERSION.SDK_INT >= 33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        ensureChannel(context)
        val pending = PendingIntent.getActivity(
            context, NOTIFICATION_ID,
            Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val header = if (count > 0) {
            if (count == 1) "1 asunto de agenda pendiente" else "$count asuntos de agenda pendientes"
        } else "Nueva propuesta por agendar"
        val text = if (title.isNotBlank()) title else "Abre Nottas para revisar propuestas, reuniones diferidas y sin cerrar."
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
        }
        val notification = builder
            .setSmallIcon(R.drawable.ic_nottas_status)
            .setContentTitle(header)
            .setContentText(text)
            .setContentIntent(pending)
            .setCategory(Notification.CATEGORY_STATUS)
            .setVisibility(Notification.VISIBILITY_PRIVATE)
            .setPriority(Notification.PRIORITY_DEFAULT)
            .setOnlyAlertOnce(true)
            .setOngoing(true)
            .setAutoCancel(false)
            .build()
        try {
            context.getSystemService(NotificationManager::class.java)
                .notify(NOTIFICATION_ID, notification)
        } catch (_: SecurityException) {
            // Bell remains available in app if the user disabled notifications.
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "Dirección · Seguimiento de agenda",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Estado persistente de propuestas y reuniones que necesitan seguimiento."
                lockscreenVisibility = Notification.VISIBILITY_PRIVATE
                setShowBadge(true)
            }
        )
    }
}
