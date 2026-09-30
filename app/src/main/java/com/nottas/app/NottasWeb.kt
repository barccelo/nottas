package com.nottas.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.WindowManager
import android.widget.Toast
import java.io.File
import org.json.JSONObject

object NottasWeb {
    const val ASSET_URL = "file:///android_asset/nottas.html"
    const val PREFS = "nottas_settings"
    const val PREF_WAKE_ENABLED = "wake_enabled"

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
        webView.setBackgroundColor(0xFFF5F5F7.toInt())
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
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean(PREF_WAKE_ENABLED, enabled).apply()
        }

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
