package com.nottas.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class NottasWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { appWidgetId ->
            val views = RemoteViews(context.packageName, R.layout.nottas_widget)

            views.setOnClickPendingIntent(
                R.id.widgetTask,
                capturePendingIntent(
                    context,
                    QuickCaptureActivity.MODE_TASKS,
                    appWidgetId * 10 + 1
                )
            )

            views.setOnClickPendingIntent(
                R.id.widgetNote,
                capturePendingIntent(
                    context,
                    QuickCaptureActivity.MODE_NOTES,
                    appWidgetId * 10 + 2
                )
            )

            views.setOnClickPendingIntent(
                R.id.widgetTitle,
                PendingIntent.getActivity(
                    context,
                    appWidgetId * 10 + 3,
                    Intent(context, MainActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private fun capturePendingIntent(
        context: Context,
        mode: String,
        requestCode: Int
    ): PendingIntent {
        val intent = Intent(context, QuickCaptureActivity::class.java).apply {
            putExtra(QuickCaptureActivity.EXTRA_CAPTURE_MODE, mode)
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
            )
        }

        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
