package com.nottas.app

import android.app.Application

class NottasApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AssistantPush.initializeFirebase(this)
        AssistantPush.refreshToken(this)
    }
}
