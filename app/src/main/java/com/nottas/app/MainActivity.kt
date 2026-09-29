package com.nottas.app

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.WindowInsets
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher

class MainActivity : Activity() {
    companion object {
        const val EXTRA_OPEN_IMPORT = "open_import"
        private const val REQ_OVERLAY = 4101
        private const val REQ_FILE = 4102
        private const val REQ_NOTIFICATIONS = 4103
    }

    private lateinit var webView: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var overlayPromptShown = false
    private var backInFlight = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configureSystemBars()

        webView = WebView(this)
        val bridge = NottasWeb.NativeBridge(this, onImportRequested = { openImportPicker() })
        NottasWeb.configure(webView, bridge)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = filePathCallback
                openImportPicker()
                return true
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

        if (
            Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQ_NOTIFICATIONS)
        }
    }

    override fun onResume() {
        super.onResume()
        if (Settings.canDrawOverlays(this)) {
            startOverlayService()
        } else if (!overlayPromptShown) {
            overlayPromptShown = true
            showOverlayPermissionDialog()
        }

        if (intent?.getBooleanExtra(EXTRA_OPEN_IMPORT, false) == true) {
            intent.removeExtra(EXTRA_OPEN_IMPORT)
            openImportPicker()
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
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
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
            }
        }
    }

    @Deprecated("Handled through OnBackInvokedDispatcher on Android 13+")
    override fun onBackPressed() {
        if (Build.VERSION.SDK_INT >= 33) return
        handleSystemBack()
    }

    private fun showOverlayPermissionDialog() {
        AlertDialog.Builder(this)
            .setTitle("Mostrar Nottas al desbloquear")
            .setMessage(
                "Para que Nottas aparezca automáticamente al encender o desbloquear la pantalla, " +
                    "Android necesita permitir que se muestre sobre otras aplicaciones."
            )
            .setPositiveButton("Conceder permiso") { _, _ ->
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivityForResult(intent, REQ_OVERLAY)
            }
            .setNegativeButton("Ahora no", null)
            .show()
    }

    private fun startOverlayService() {
        val serviceIntent = Intent(this, UnlockOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun openImportPicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/json"
        }
        try {
            startActivityForResult(intent, REQ_FILE)
        } catch (_: Throwable) {
            Toast.makeText(this, "No pude abrir el selector de archivos", Toast.LENGTH_SHORT).show()
            fileCallback?.onReceiveValue(null)
            fileCallback = null
        }
    }

    @Deprecated("Deprecated in Android SDK, retained for broad WebView compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_FILE) {
            val uri = if (resultCode == RESULT_OK) data?.data else null
            val callback = fileCallback
            if (callback != null) {
                callback.onReceiveValue(uri?.let { arrayOf(it) })
                fileCallback = null
            } else if (uri != null) {
                importJson(uri)
            }
        }
    }

    private fun importJson(uri: Uri) {
        try {
            val json = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                ?: error("Archivo vacío")
            val quoted = org.json.JSONObject.quote(json)
            webView.evaluateJavascript(
                "try{const parsed=JSON.parse($quoted);localStorage.setItem('miniapp_local_v3',JSON.stringify(parsed));location.reload();true}catch(e){false}",
                { ok ->
                    Toast.makeText(
                        this,
                        if (ok == "true") "Copia importada" else "El archivo no es válido",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            )
        } catch (_: Throwable) {
            Toast.makeText(this, "El archivo no es válido", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("NottasNative")
        webView.destroy()
        super.onDestroy()
    }
}
