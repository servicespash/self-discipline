package com.cymatic.disciplineos

import android.service.voice.VoiceInteractionService
import android.util.Log

class RamaVoiceInteractionService : VoiceInteractionService() {
    override fun onCreate() {
        super.onCreate()
        Log.d("RamaVoice", "RamaVoiceInteractionService created")
    }
}
