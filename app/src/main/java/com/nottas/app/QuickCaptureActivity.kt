package com.nottas.app

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.view.WindowInsets
import android.webkit.WebView

class QuickCaptureActivity : Activity() {
    private lateinit var webView: WebView
    private var backInFlight = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        NottasWeb.configure(
            webView,
            NottasWeb.NativeBridge(this)
        )
        setContentView(webView)
        webView.loadUrl(NottasWeb.ASSET_URL)
    }

    @Deprecated("Deprecated in Android SDK; retained for WebView back-level handling")
    override fun onBackPressed() {
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
                overridePendingTransition(0, 0)
            }
        }
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("NottasNative")
        webView.destroy()
        super.onDestroy()
    }
}
