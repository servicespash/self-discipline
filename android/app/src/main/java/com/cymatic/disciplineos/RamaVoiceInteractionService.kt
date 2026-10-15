package com.cymatic.disciplineos

import android.content.Intent
import android.service.voice.VoiceInteractionService
import android.service.voice.VoiceInteractionSession
import android.os.Bundle
import android.util.Log

/**
 * Native Android Voice Assistant Integration Scaffolding for Cymatic Discipline OS
 * Enables system-level "Hey Rama" hotword detection and dispatches 'rama-wake-word'
 * events to Capacitor WebView and ambient background listener services.
 */
class RamaVoiceInteractionService : VoiceInteractionService() {

    companion object {
        private const val TAG = "RamaVoiceInteraction"
        const val ACTION_RAMA_WAKE_WORD = "com.cymatic.disciplineos.RAMA_WAKE_WORD"
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "RamaVoiceInteractionService initialized: Hotword engine armed for 'Hey Rama'.")
    }

    override fun onReady() {
        super.onReady()
        Log.i(TAG, "RamaVoiceInteractionService ready. System voice triggers bound.")
    }

    /**
     * Broadcasts the 'rama-wake-word' trigger to the active web layer
     * and brings the floating hub or discipline overlay to the foreground.
     */
    fun triggerWakeWordEvent(confidence: Float = 0.95f) {
        Log.i(TAG, "Hotword 'Hey Rama' detected with confidence: $confidence. Dispatching wake broadcast.")
        val intent = Intent(ACTION_RAMA_WAKE_WORD).apply {
            putExtra("confidence", confidence)
            putExtra("timestamp", System.currentTimeMillis())
            setPackage(packageName)
        }
        sendBroadcast(intent)
    }

    override fun onShutdown() {
        super.onShutdown()
        Log.i(TAG, "RamaVoiceInteractionService shutting down.")
    }
}
