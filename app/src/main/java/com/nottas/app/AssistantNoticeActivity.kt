package com.nottas.app

import android.app.Activity
import android.app.NotificationManager
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.text.InputFilter
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.math.roundToInt

/**
 * Full-screen, bidirectional assistant messages. Replies are persisted via the
 * authenticated Worker; the screen only closes after the server confirms save.
 */
class AssistantNoticeActivity : Activity() {
    companion object {
        const val EXTRA_NOTICE_ID = "assistant_notice_id"
        const val EXTRA_FROM_NAME = "assistant_notice_from_name"
        const val EXTRA_MESSAGE = "assistant_notice_message"
        const val EXTRA_WORKSPACE_ID = "assistant_notice_workspace_id"
        const val EXTRA_FROM_ROLE = "assistant_notice_from_role"
    }

    private var sending = false
    private var noticeId = ""
    private var workspaceId = ""
    private lateinit var replyText: EditText
    private lateinit var sendButton: TextView
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        renderNotice()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        sending = false
        renderNotice()
    }

    private fun rounded(color: Int, radius: Int): GradientDrawable {
        val dp = resources.displayMetrics.density
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius * dp
        }
    }

    private fun renderNotice() {
        noticeId = intent.getStringExtra(EXTRA_NOTICE_ID).orEmpty()
        workspaceId = intent.getStringExtra(EXTRA_WORKSPACE_ID).orEmpty()
        if (noticeId.isBlank()) { finish(); return }
        val who = intent.getStringExtra(EXTRA_FROM_NAME).orEmpty().ifBlank { "Asistente" }
        val message = intent.getStringExtra(EXTRA_MESSAGE).orEmpty().take(280)
        val fromRole = intent.getStringExtra(EXTRA_FROM_ROLE).orEmpty()
        if (message.isBlank()) { finish(); return }
        val canReply = workspaceId.isNotBlank()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or
            WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN)
        // Android 11+ and targetSdk 35+ may lay full-screen windows behind the
        // keyboard. Let the root handle IME and system-bar insets explicitly.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        }
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.rgb(245,245,247)
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.rgb(245,245,247)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val density = resources.displayMetrics.density
        fun dp(i: Int) = (i*density).roundToInt()
        val pageBackground = Color.rgb(245,245,247)
        val ink = Color.rgb(29,29,31)
        val gray = Color.rgb(99,99,102)
        val blue = Color.rgb(22,119,255)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(23),dp(30),dp(23),dp(22))
            setBackgroundColor(pageBackground)
            gravity = Gravity.CENTER_HORIZONTAL
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            root.setOnApplyWindowInsetsListener { view, insets ->
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                val keyboard = insets.getInsets(WindowInsets.Type.ime())
                val bottom = maxOf(bars.bottom, keyboard.bottom)
                view.setPadding(dp(23), bars.top + dp(15), dp(23), bottom + dp(10))
                insets
            }
        }
        // The scroll area contains the title, message and quick replies;
        // only the composer and dismiss action stay anchored above the IME.
        val head = TextView(this).apply {
            text = "Nottas · Mensajes"
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(gray)
        }
        val senderView = TextView(this).apply {
            text = who
            textSize = 30f
            typeface = Typeface.create("sans",Typeface.BOLD)
            gravity = Gravity.CENTER
            setTextColor(ink)
        }
        val subtitleView = TextView(this).apply {
            text = "te ha enviado un mensaje"
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(gray)
        }

        val scroll = ScrollView(this).apply {
            isFillViewport = false
            isVerticalScrollBarEnabled = false
            clipToPadding = false
        }
        val messageArea = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(2),dp(15),dp(2),dp(15))
        }
        messageArea.addView(head, LinearLayout.LayoutParams(-1,-2))
        messageArea.addView(senderView,LinearLayout.LayoutParams(-1,-2).apply { topMargin=dp(15) })
        messageArea.addView(subtitleView,LinearLayout.LayoutParams(-1,-2).apply { topMargin=dp(4) })
        messageArea.addView(TextView(this).apply {
            text = message
            textSize = 25f
            typeface = Typeface.create("sans",Typeface.BOLD)
            gravity = Gravity.CENTER
            setTextColor(blue)
        },LinearLayout.LayoutParams(-1,-2).apply {
            topMargin=dp(36)
            bottomMargin=dp(20)
        })
        scroll.addView(messageArea)
        root.addView(scroll,LinearLayout.LayoutParams(-1,0,1f).apply {
            bottomMargin=dp(8)
        })

        if (canReply) {
            messageArea.addView(TextView(this).apply {
                text = "Responder"
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(gray)
            },LinearLayout.LayoutParams(-1,-2).apply { bottomMargin=dp(7) })
            val choices=if(fromRole=="assistant")
                listOf("Hazlo pasar","En 5 minutos","Que espere","Gracias")
            else
                listOf("Voy","En 5 minutos","Entendido","Ahora mismo")
            for (rowIndex in 0..1) {
                val row=LinearLayout(this).apply { orientation=LinearLayout.HORIZONTAL }
                for (column in 0..1) {
                    val preset=choices[rowIndex*2+column]
                    row.addView(TextView(this).apply {
                        text=preset
                        textSize=13f
                        typeface=Typeface.create("sans-medium",Typeface.NORMAL)
                        gravity=Gravity.CENTER
                        setTextColor(ink)
                        background=rounded(Color.WHITE,12)
                        setOnClickListener { sendReply(preset) }
                    },LinearLayout.LayoutParams(0,dp(43),1f).apply {
                        if(column==1)leftMargin=dp(7)
                    })
                }
                messageArea.addView(row,LinearLayout.LayoutParams(-1,-2).apply {
                    bottomMargin=dp(7)
                })
            }
            val inputRow=LinearLayout(this).apply {
                orientation=LinearLayout.HORIZONTAL
                gravity=Gravity.CENTER_VERTICAL
            }
            replyText=EditText(this).apply {
                hint="Escribir respuesta…"
                textSize=15f
                minLines=1
                maxLines=3
                inputType=InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES or
                    InputType.TYPE_TEXT_FLAG_MULTI_LINE
                filters=arrayOf(InputFilter.LengthFilter(280))
                setTextColor(ink)
                setHintTextColor(gray)
                setPadding(dp(12),dp(7),dp(10),dp(7))
                background=rounded(Color.WHITE,12)
            }
            inputRow.addView(replyText,LinearLayout.LayoutParams(0,-2,1f))
            sendButton=TextView(this).apply {
                text="Enviar"
                textSize=14f
                typeface=Typeface.DEFAULT_BOLD
                gravity=Gravity.CENTER
                setTextColor(Color.WHITE)
                background=rounded(blue,12)
                setOnClickListener { sendReply(replyText.text.toString()) }
            }
            inputRow.addView(sendButton,LinearLayout.LayoutParams(dp(74),dp(43)).apply {
                leftMargin=dp(7)
            })
            root.addView(inputRow,LinearLayout.LayoutParams(-1,-2))
        }
        statusText=TextView(this).apply {
            text=""
            textSize=12f
            gravity=Gravity.CENTER
            setTextColor(gray)
        }
        root.addView(statusText,LinearLayout.LayoutParams(-1,-2).apply { topMargin=dp(5) })
        root.addView(TextView(this).apply {
            text="Cerrar"
            textSize=16f
            typeface=Typeface.DEFAULT_BOLD
            gravity=Gravity.CENTER
            setTextColor(gray)
            setOnClickListener { finishNotice() }
        },LinearLayout.LayoutParams(-1,dp(48)).apply { topMargin=dp(5) })
        root.isFocusableInTouchMode = true
        setContentView(root)
        root.requestFocus()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) root.requestApplyInsets()
        getSystemService(NotificationManager::class.java)
            .cancel(AssistantNoticeNotifier.notificationId(noticeId))
        if(canReply)AssistantPush.markNoticeRead(applicationContext,workspaceId,noticeId)
    }

    private fun sendReply(value: String) {
        val text=value.trim()
        if(sending || text.isBlank() || text.length>280)return
        sending=true
        sendButton.isEnabled=false
        statusText.text="Enviando respuesta…"
        AssistantPush.replyToNotice(applicationContext,workspaceId,noticeId,text) { success ->
            runOnUiThread {
                if(isFinishing || isDestroyed)return@runOnUiThread
                sending=false
                sendButton.isEnabled=true
                if(success) {
                    finishNotice()
                } else {
                    statusText.text="Sin conexión o sesión no válida. Inténtalo de nuevo."
                }
            }
        }
    }

    private fun finishNotice() {
        getSystemService(NotificationManager::class.java)
            .cancel(AssistantNoticeNotifier.notificationId(noticeId))
        finish()
    }
}
