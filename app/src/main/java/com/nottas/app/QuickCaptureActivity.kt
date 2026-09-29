package com.nottas.app

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.webkit.WebView
import android.widget.FrameLayout
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher

class QuickCaptureActivity : Activity() {
    private lateinit var webView: WebView
    private var backInFlight = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configureSystemBars()

        webView = WebView(this)
        NottasWeb.configure(
            webView,
            NottasWeb.NativeBridge(this)
        )

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
                        "document.documentElement.style.setProperty('--ime-offset','" +
                            imeOffset + "px')",
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

    override fun onDestroy() {
        webView.removeJavascriptInterface("NottasNative")
        webView.destroy()
        super.onDestroy()
    }
}
