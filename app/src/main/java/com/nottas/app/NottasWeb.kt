package com.nottas.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.HapticFeedbackConstants
import android.view.WindowManager
import android.widget.Toast
import java.io.File
import org.json.JSONObject

object NottasWeb {
    const val ASSET_URL = "file:///android_asset/nottas.html"
    const val PREFS = "nottas_settings"
    const val PREF_WAKE_ENABLED = "wake_enabled"
    const val PREF_WAKE_SNOOZE_UNTIL = "wake_snooze_until"
    const val PREF_DARK_MODE = "dark_mode"
    const val PREF_WORK_HOURS_ENABLED = "work_hours_enabled"
    const val PREF_WORK_HOURS_START = "work_hours_start"
    const val PREF_WORK_HOURS_END = "work_hours_end"

    fun applySystemBars(activity: Activity, dark: Boolean) {
        val barColor = if (dark) 0xFF000000.toInt() else 0xFFF5F5F7.toInt()
        @Suppress("DEPRECATION")
        activity.window.statusBarColor = barColor
        @Suppress("DEPRECATION")
        activity.window.navigationBarColor = barColor
        activity.window.decorView.setBackgroundColor(barColor)
        activity.findViewById<android.view.View>(android.R.id.content)?.setBackgroundColor(barColor)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val lightMask =
                android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                    android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            activity.window.insetsController?.setSystemBarsAppearance(
                if (dark) 0 else lightMask,
                lightMask
            )
        } else {
            @Suppress("DEPRECATION")
            activity.window.decorView.systemUiVisibility =
                if (dark) {
                    0
                } else {
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
                        android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    fun configure(webView: WebView, bridge: NativeBridge) {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
        }
        val dark = webView.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(PREF_DARK_MODE, false)
        webView.setBackgroundColor(if (dark) 0xFF000000.toInt() else 0xFFF5F5F7.toInt())
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(bridge, "NottasNative")
    }

    class NativeBridge(
        private val context: Context,
        private val onCloseOverlay: (() -> Unit)? = null,
        private val onImportRequested: (() -> Unit)? = null
    ) {
        private val mainHandler = Handler(Looper.getMainLooper())

        @JavascriptInterface
        fun isWakeEnabled(): Boolean = context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(PREF_WAKE_ENABLED, true)

        @JavascriptInterface
        fun setWakeEnabled(enabled: Boolean) {
            val editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(PREF_WAKE_ENABLED, enabled)
            if (enabled) editor.remove(PREF_WAKE_SNOOZE_UNTIL)
            editor.apply()
        }

        @JavascriptInterface
        fun snoozeWake(minutes: Int): Long {
            val safeMinutes = minutes.coerceIn(1, 12 * 60)
            val until = System.currentTimeMillis() + safeMinutes * 60_000L
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(PREF_WAKE_ENABLED, true)
                .putLong(PREF_WAKE_SNOOZE_UNTIL, until)
                .apply()
            return until
        }

        @JavascriptInterface
        fun clearWakeSnooze() {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(PREF_WAKE_SNOOZE_UNTIL)
                .apply()
        }

        @JavascriptInterface
        fun wakeControlStatus(): String {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val enabled = prefs.getBoolean(PREF_WAKE_ENABLED, true)
            val snoozeUntil = prefs.getLong(PREF_WAKE_SNOOZE_UNTIL, 0L)
            val snoozed = snoozeUntil > System.currentTimeMillis()
            val workStatus = try {
                JSONObject(WorkHoursPolicy.status(context))
            } catch (_: Throwable) {
                JSONObject()
            }
            return JSONObject()
                .put("enabled", enabled)
                .put("snoozed", snoozed)
                .put("snoozeUntil", snoozeUntil)
                .put("workHoursEnabled", workStatus.optBoolean("enabled", false))
                .put("withinHours", workStatus.optBoolean("withinHours", false))
                .put("allowedNow", enabled && !snoozed && WorkHoursPolicy.allowsWakeOverlay(context))
                .toString()
        }

        @JavascriptInterface
        fun setDarkMode(enabled: Boolean) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean(PREF_DARK_MODE, enabled).apply()
            mainHandler.post {
                val activity = context as? Activity ?: return@post
                applySystemBars(activity, enabled)
            }
        }

        @JavascriptInterface
        fun setWorkHours(enabled: Boolean, start: String, end: String) {
            val timePattern = Regex("""^(?:[01]\d|2[0-3]):[0-5]\d$""")
            val safeStart = if (timePattern.matches(start)) start else "08:00"
            val safeEnd = if (timePattern.matches(end)) end else "17:00"
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(PREF_WORK_HOURS_ENABLED, enabled)
                .putString(PREF_WORK_HOURS_START, safeStart)
                .putString(PREF_WORK_HOURS_END, safeEnd)
                .commit()
        }

        @JavascriptInterface
        fun workHoursStatus(): String = WorkHoursPolicy.status(context)

        @JavascriptInterface
        fun setSearchKeyboardMode(active: Boolean) {
            mainHandler.post {
                val activity = context as? Activity ?: return@post
                activity.window.setSoftInputMode(
                    if (active) {
                        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
                    } else {
                        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
                    }
                )
                activity.window.decorView.requestApplyInsets()
            }
        }

        @JavascriptInterface
        fun consumeReminderActions(): String = ReminderActionStore.consume(context)

        @JavascriptInterface
        fun hapticTick() {
            mainHandler.post {
                val activity = context as? Activity ?: return@post
                activity.window.decorView.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
            }
        }

        @JavascriptInterface
        fun openUnlockNotificationSettings() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            mainHandler.post {
                try {
                    val intent = Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                        putExtra(Settings.EXTRA_CHANNEL_ID, UnlockOverlayService.CHANNEL_ID)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                } catch (_: Throwable) {
                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                }
            }
        }

        @JavascriptInterface
        fun isUnlockNotificationChannelBlocked(): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
            return try {
                val manager = context.getSystemService(NotificationManager::class.java)
                manager.getNotificationChannel(UnlockOverlayService.CHANNEL_ID)?.importance ==
                    NotificationManager.IMPORTANCE_NONE
            } catch (_: Throwable) {
                false
            }
        }

        @JavascriptInterface
        fun hasExactAlarmAccess(): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
            return try {
                context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()
            } catch (_: Throwable) {
                false
            }
        }

        @JavascriptInterface
        fun requestExactAlarmAccess() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
            mainHandler.post {
                try {
                    val manager = context.getSystemService(AlarmManager::class.java)
                    if (manager.canScheduleExactAlarms()) return@post
                    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                } catch (_: Throwable) {
                }
            }
        }

        @JavascriptInterface
        fun requestNotificationPermission() {
            if (Build.VERSION.SDK_INT < 33) return
            mainHandler.post {
                val activity = context as? Activity ?: return@post
                if (activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4204)
                }
            }
        }

        @JavascriptInterface
        fun hasNotificationPermission(): Boolean {
            return Build.VERSION.SDK_INT < 33 ||
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        }

        @JavascriptInterface
        fun syncReminders(json: String): Boolean = ReminderScheduler.sync(context, json)

        @JavascriptInterface
        fun closeOverlay() {
            mainHandler.post { onCloseOverlay?.invoke() }
        }

        @JavascriptInterface
        fun requestImport() {
            mainHandler.post {
                if (onImportRequested != null) {
                    onImportRequested.invoke()
                } else {
                    val intent = Intent(context, MainActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        .putExtra(MainActivity.EXTRA_OPEN_IMPORT, true)
                    context.startActivity(intent)
                }
            }
        }

        @JavascriptInterface
        fun saveInternalBackup(json: String): Boolean {
            return try {
                val parsed = JSONObject(json)
                if (!parsed.has("tasks") || !parsed.has("notes") || !parsed.has("categories")) {
                    return false
                }

                val dir = File(context.filesDir, "nottas_backups").apply { mkdirs() }
                val current = File(dir, "current.json")
                val existing = if (current.exists()) current.readText() else null

                if (existing == json) return true

                if (!existing.isNullOrBlank()) {
                    File(dir, "snapshot-" + System.currentTimeMillis() + ".json")
                        .writeText(existing)
                }

                val temp = File(dir, "current.tmp")
                temp.writeText(json)
                if (current.exists()) current.delete()
                if (!temp.renameTo(current)) {
                    current.writeText(json)
                    temp.delete()
                }

                dir.listFiles { file ->
                    file.isFile && file.name.startsWith("snapshot-") && file.name.endsWith(".json")
                }
                    ?.sortedByDescending { it.lastModified() }
                    ?.drop(5)
                    ?.forEach { it.delete() }

                true
            } catch (_: Throwable) {
                false
            }
        }

        @JavascriptInterface
        fun readInternalBackup(): String {
            return try {
                val dir = File(context.filesDir, "nottas_backups")
                val candidates = mutableListOf<File>()
                candidates.add(File(dir, "current.json"))
                dir.listFiles { file ->
                    file.isFile && file.name.startsWith("snapshot-") && file.name.endsWith(".json")
                }
                    ?.sortedByDescending { it.lastModified() }
                    ?.let { candidates.addAll(it) }

                candidates.firstNotNullOfOrNull { file ->
                    if (!file.exists()) return@firstNotNullOfOrNull null
                    val text = file.readText()
                    try {
                        val parsed = JSONObject(text)
                        if (
                            parsed.has("tasks") &&
                            parsed.has("notes") &&
                            parsed.has("categories")
                        ) text else null
                    } catch (_: Throwable) {
                        null
                    }
                } ?: ""
            } catch (_: Throwable) {
                ""
            }
        }

        @JavascriptInterface
        fun internalBackupInfo(): String {
            return try {
                val dir = File(context.filesDir, "nottas_backups")
                val snapshots = dir.listFiles { file ->
                    file.isFile && file.name.startsWith("snapshot-") && file.name.endsWith(".json")
                }
                    ?.sortedByDescending { it.lastModified() }
                    ?: emptyList()

                JSONObject().apply {
                    put("count", snapshots.size)
                    put("latestAt", snapshots.firstOrNull()?.lastModified() ?: 0L)
                }.toString()
            } catch (_: Throwable) {
                """{"count":0,"latestAt":0}"""
            }
        }

        @JavascriptInterface
        fun readPreviousInternalBackup(): String {
            return try {
                val dir = File(context.filesDir, "nottas_backups")
                val snapshot = dir.listFiles { file ->
                    file.isFile && file.name.startsWith("snapshot-") && file.name.endsWith(".json")
                }
                    ?.sortedByDescending { it.lastModified() }
                    ?.firstOrNull()
                    ?: return ""

                val text = snapshot.readText()
                val parsed = JSONObject(text)
                if (
                    parsed.has("tasks") &&
                    parsed.has("notes") &&
                    parsed.has("categories")
                ) text else ""
            } catch (_: Throwable) {
                ""
            }
        }

        @JavascriptInterface
        fun exportJson(json: String) {
            try {
                val fileName = "NottasData-${System.currentTimeMillis()}.json"
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = android.content.ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                        put(MediaStore.Downloads.MIME_TYPE, "application/json")
                        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                        ?: error("No se pudo crear el archivo")
                    context.contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray()) }
                        ?: error("No se pudo escribir el archivo")
                } else {
                    val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                        ?: context.filesDir
                    File(dir, fileName).writeText(json)
                }
                toast("Copia guardada en Descargas")
            } catch (_: Throwable) {
                toast("No pude exportar la copia")
            }
        }

        @JavascriptInterface
        fun exportImportTemplate(json: String) {
            try {
                val fileName = "Nottas-Plantilla-Importacion-" + System.currentTimeMillis() + ".json"
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = android.content.ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                        put(MediaStore.Downloads.MIME_TYPE, "application/json")
                        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                        ?: error("No se pudo crear el archivo")
                    context.contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray()) }
                        ?: error("No se pudo escribir el archivo")
                } else {
                    val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                        ?: context.filesDir
                    File(dir, fileName).writeText(json)
                }
                toast("Plantilla guardada en Descargas")
            } catch (_: Throwable) {
                toast("No pude crear la plantilla")
            }
        }

        @JavascriptInterface
        fun assistantDeviceId(): String = AssistantPush.deviceId(context)

        @JavascriptInterface
        fun configureAssistantPush(json: String): String =
            AssistantPush.configureFirebase(context, json)

        @JavascriptInterface
        fun assistantPushStatus(): String = AssistantPush.status(context)

        @JavascriptInterface
        fun refreshAssistantPushToken(): Boolean = AssistantPush.refreshToken(context)

        @JavascriptInterface
        fun setAssistantSession(serverUrl: String, sessionToken: String): Boolean =
            AssistantPush.setSession(context, serverUrl, sessionToken)

        @JavascriptInterface
        fun clearAssistantSession() {
            AssistantPush.clearSession(context)
        }

        @JavascriptInterface
        fun consumeAssistantEvents(): String = AssistantEventStore.consume(context)

        @JavascriptInterface
        fun previewAssistantCall(callerName: String, workspaceName: String): Boolean {
            return try {
                val id = "preview_" + System.currentTimeMillis()
                AssistantCallNotifier.show(
                    context,
                    id,
                    callerName.trim().ifBlank { "Tu jefe" },
                    workspaceName.trim().ifBlank { "Asistente" }
                )
                true
            } catch (_: Throwable) {
                false
            }
        }

        @JavascriptInterface
        fun appVersion(): String {
            return try {
                context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: ""
            } catch (_: Throwable) {
                ""
            }
        }

        @JavascriptInterface
        fun isNativeApp(): Boolean = true

        private fun toast(message: String) {
            mainHandler.post { Toast.makeText(context, message, Toast.LENGTH_SHORT).show() }
        }
    }
}
