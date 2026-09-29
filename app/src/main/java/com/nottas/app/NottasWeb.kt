package com.nottas.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
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
import android.widget.Toast
import java.io.File

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
        fun isNativeApp(): Boolean = true

        private fun toast(message: String) {
            mainHandler.post { Toast.makeText(context, message, Toast.LENGTH_SHORT).show() }
        }
    }
}
