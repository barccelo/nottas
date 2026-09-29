package com.nottas.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val enabled = context.getSharedPreferences(NottasWeb.PREFS, Context.MODE_PRIVATE)
            .getBoolean(NottasWeb.PREF_WAKE_ENABLED, true)
        if (!enabled || !Settings.canDrawOverlays(context)) return

        val serviceIntent = Intent(context, UnlockOverlayService::class.java)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(serviceIntent)
            else context.startService(serviceIntent)
        } catch (_: Throwable) {
            // If the manufacturer blocks the boot start, opening Nottas once restarts the service.
        }
    }
}
