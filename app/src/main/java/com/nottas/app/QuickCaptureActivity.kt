package com.nottas.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import org.json.JSONObject
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher

class QuickCaptureActivity : Activity() {
    companion object {
        const val EXTRA_CAPTURE_MODE = "capture_mode"
        const val MODE_TASKS = "tasks"
        const val MODE_NOTES = "notes"
    }

    private lateinit var webView: WebView
    private var backInFlight = false
    private var pendingSharedText: String? = null
    private var pendingCaptureMode: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configureSystemBars()

        webView = WebView(this)
        NottasWeb.configure(
            webView,
            NottasWeb.NativeBridge(this)
        )
        pendingSharedText = extractIncomingText(intent)
        pendingCaptureMode = extractCaptureMode(intent)
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                deliverPendingEntry()
            }
        }

        val root = FrameLayout(this)
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        applySystemBarInsets(root)
        setContentView(root)
        webView.loadUrl(NottasWeb.ASSET_URL)

        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                OnBackInvokedCallback { handleSystemBack() }
            )
        }
    }

    private fun configureSystemBars() {
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING)
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.rgb(245, 245, 247)
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.rgb(245, 245, 247)

        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
                View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
    }

    private fun applySystemBarInsets(root: View) {
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                val ime = insets.getInsets(WindowInsets.Type.ime())
                val imeOffset = (ime.bottom - bars.bottom).coerceAtLeast(0)
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                if (::webView.isInitialized) {
                    webView.evaluateJavascript(
                        "window.NottasSetImeOffset && window.NottasSetImeOffset(" + imeOffset + ")",
                        null
                    )
                }
            } else {
                @Suppress("DEPRECATION")
                view.setPadding(
                    insets.systemWindowInsetLeft,
                    insets.systemWindowInsetTop,
                    insets.systemWindowInsetRight,
                    insets.systemWindowInsetBottom
                )
            }
            insets
        }
        root.requestApplyInsets()
    }

    private fun handleSystemBack() {
        if (backInFlight) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val insets = window.decorView.rootWindowInsets
            if (insets?.isVisible(WindowInsets.Type.ime()) == true) {
                currentFocus?.clearFocus()
                window.insetsController?.hide(WindowInsets.Type.ime())
                return
            }
        }

        backInFlight = true
        webView.evaluateJavascript(
            "(window.NottasHandleBack && window.NottasHandleBack()) === true"
        ) { handled ->
            backInFlight = false
            if (handled != "true") {
                finish()
                @Suppress("DEPRECATION")
                overridePendingTransition(0, 0)
            }
        }
    }

    @Deprecated("Handled through OnBackInvokedDispatcher on Android 13+")
    override fun onBackPressed() {
        if (Build.VERSION.SDK_INT >= 33) return
        handleSystemBack()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingSharedText = extractIncomingText(intent)
        pendingCaptureMode = extractCaptureMode(intent)
        deliverPendingEntry()
    }

    private fun extractCaptureMode(intent: Intent?): String? {
        val mode = intent?.getStringExtra(EXTRA_CAPTURE_MODE)
        return when (mode) {
            MODE_TASKS, MODE_NOTES -> mode
            else -> null
        }
    }

    private fun extractIncomingText(intent: Intent?): String? {
        if (intent == null) return null
        return when (intent.action) {
            Intent.ACTION_SEND -> intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()
            Intent.ACTION_PROCESS_TEXT -> intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
            else -> null
        }?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun deliverPendingEntry() {
        if (!::webView.isInitialized) return

        val text = pendingSharedText
        if (!text.isNullOrBlank()) {
            pendingSharedText = null
            pendingCaptureMode = null
            val quoted = JSONObject.quote(text)
            webView.evaluateJavascript(
                "window.NottasOpenSharedText && window.NottasOpenSharedText($quoted)",
                null
            )
            return
        }

        val mode = pendingCaptureMode ?: return
        pendingCaptureMode = null
        val quotedMode = JSONObject.quote(mode)
        webView.evaluateJavascript(
            "window.NottasOpenQuickCapture && window.NottasOpenQuickCapture($quotedMode)",
            null
        )
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("NottasNative")
        webView.destroy()
        super.onDestroy()
    }
}
