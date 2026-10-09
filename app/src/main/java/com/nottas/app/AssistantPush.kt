package com.nottas.app

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject

object AssistantPush {
    private const val PREFS = "nottas_assistant"
    private const val KEY_API_KEY = "firebase_api_key"
    private const val KEY_APP_ID = "firebase_app_id"
    private const val KEY_PROJECT_ID = "firebase_project_id"
    private const val KEY_SENDER_ID = "firebase_sender_id"
    private const val KEY_FCM_TOKEN = "fcm_token"
    private const val KEY_FCM_ERROR = "fcm_error"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_SESSION_TOKEN = "session_token"
    private const val KEY_DEVICE_ID = "device_id"

    fun deviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val existing = prefs.getString(KEY_DEVICE_ID, "").orEmpty()
        if (existing.isNotBlank()) return existing
        val created = "android_" + UUID.randomUUID().toString()
        prefs.edit().putString(KEY_DEVICE_ID, created).apply()
        return created
    }

    fun configureFirebase(context: Context, json: String): String {
        val payload = try { JSONObject(json) } catch (_: Throwable) { JSONObject() }
        val apiKey = payload.optString("apiKey").trim()
        val appId = payload.optString("appId").trim()
        val projectId = payload.optString("projectId").trim()
        val senderId = payload.optString("senderId").trim()
        if (apiKey.isEmpty() || appId.isEmpty() || projectId.isEmpty() || senderId.isEmpty()) {
            return JSONObject().put("ok", false).put("error", "firebase_config_incomplete").toString()
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_API_KEY, apiKey)
            .putString(KEY_APP_ID, appId)
            .putString(KEY_PROJECT_ID, projectId)
            .putString(KEY_SENDER_ID, senderId)
            .remove(KEY_FCM_ERROR)
            .apply()

        val initialized = initializeFirebase(context)
        if (initialized) refreshToken(context)
        return status(context)
    }

    fun initializeFirebase(context: Context): Boolean {
        return try {
            if (FirebaseApp.getApps(context).isNotEmpty()) return true
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val apiKey = prefs.getString(KEY_API_KEY, "").orEmpty()
            val appId = prefs.getString(KEY_APP_ID, "").orEmpty()
            val projectId = prefs.getString(KEY_PROJECT_ID, "").orEmpty()
            val senderId = prefs.getString(KEY_SENDER_ID, "").orEmpty()
            if (apiKey.isBlank() || appId.isBlank() || projectId.isBlank() || senderId.isBlank()) return false
            val options = FirebaseOptions.Builder()
                .setApiKey(apiKey)
                .setApplicationId(appId)
                .setProjectId(projectId)
                .setGcmSenderId(senderId)
                .build()
            FirebaseApp.initializeApp(context, options)
            FirebaseApp.getApps(context).isNotEmpty()
        } catch (error: Throwable) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_FCM_ERROR, error.message ?: "firebase_init_failed").apply()
            false
        }
    }

    fun refreshToken(context: Context): Boolean {
        if (!initializeFirebase(context)) return false
        return try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                if (task.isSuccessful && !task.result.isNullOrBlank()) {
                    prefs.edit()
                        .putString(KEY_FCM_TOKEN, task.result)
                        .remove(KEY_FCM_ERROR)
                        .apply()
                    AssistantEventStore.enqueue(
                        context,
                        JSONObject().put("type", "push_token").put("fcmToken", task.result)
                    )
                } else {
                    prefs.edit()
                        .putString(KEY_FCM_ERROR, task.exception?.message ?: "token_failed")
                        .apply()
                }
            }
            true
        } catch (error: Throwable) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_FCM_ERROR, error.message ?: "token_failed").apply()
            false
        }
    }

    fun status(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val configured =
            !prefs.getString(KEY_API_KEY, "").isNullOrBlank() &&
                !prefs.getString(KEY_APP_ID, "").isNullOrBlank() &&
                !prefs.getString(KEY_PROJECT_ID, "").isNullOrBlank() &&
                !prefs.getString(KEY_SENDER_ID, "").isNullOrBlank()
        return JSONObject()
            .put("configured", configured)
            .put("initialized", FirebaseApp.getApps(context).isNotEmpty())
            .put("fcmToken", prefs.getString(KEY_FCM_TOKEN, "").orEmpty())
            .put("error", prefs.getString(KEY_FCM_ERROR, "").orEmpty())
            .put("deviceId", deviceId(context))
            .put("serverConfigured", !prefs.getString(KEY_SERVER_URL, "").isNullOrBlank())
            .put("sessionConfigured", !prefs.getString(KEY_SESSION_TOKEN, "").isNullOrBlank())
            .toString()
    }

    fun setSession(context: Context, serverUrl: String, sessionToken: String): Boolean {
        val safeUrl = serverUrl.trim().trimEnd('/')
        if (safeUrl.isBlank()) return false
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_SERVER_URL, safeUrl)
            .putString(KEY_SESSION_TOKEN, sessionToken.trim())
            .apply()
        return true
    }

    fun clearSession(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().remove(KEY_SERVER_URL).remove(KEY_SESSION_TOKEN).apply()
    }

    fun respondToCall(context: Context, callId: String, response: String) {
        val safeResponse = when (response) {
            "coming", "five_min", "unavailable" -> response
            else -> return
        }
        Thread {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val server = prefs.getString(KEY_SERVER_URL, "").orEmpty().trimEnd('/')
            val token = prefs.getString(KEY_SESSION_TOKEN, "").orEmpty()
            val sent = if (server.isNotBlank() && token.isNotBlank()) {
                postJson(
                    server + "/v1/calls/" + callId.trim() + "/respond",
                    token,
                    JSONObject().put("response", safeResponse)
                )
            } else {
                false
            }
            AssistantEventStore.enqueue(
                context,
                JSONObject()
                    .put("type", if (sent) "call_response_sent" else "call_response_pending")
                    .put("callId", callId)
                    .put("response", safeResponse)
            )
        }.start()
    }

    private fun postJson(url: String, token: String, payload: JSONObject): Boolean {
        var connection: HttpURLConnection? = null
        return try {
            connection = URL(url).openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 8000
            connection.readTimeout = 8000
            connection.doOutput = true
            connection.setRequestProperty("Authorization", "Bearer " + token)
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            connection.responseCode in 200..299
        } catch (_: Throwable) {
            false
        } finally {
            connection?.disconnect()
        }
    }
}

object AssistantEventStore {
    private const val PREFS = "nottas_assistant_events"
    private const val KEY_QUEUE = "queue"

    @Synchronized
    fun enqueue(context: Context, event: JSONObject) {
        val queue = read(context)
        queue.put(event.put("receivedAt", System.currentTimeMillis()))
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_QUEUE, queue.toString()).apply()
    }

    @Synchronized
    fun consume(context: Context): String {
        val queue = read(context)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().remove(KEY_QUEUE).apply()
        return queue.toString()
    }

    private fun read(context: Context): JSONArray {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_QUEUE, "[]").orEmpty()
        return try { JSONArray(raw) } catch (_: Throwable) { JSONArray() }
    }
}
