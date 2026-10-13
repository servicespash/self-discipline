package com.cymatic.disciplineos

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import kotlinx.coroutines.*
import java.util.*

class FocusMonitorService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var isMonitoring = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(1, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isMonitoring) {
            isMonitoring = true
            startMonitoring()
        }
        return START_STICKY
    }

    private fun startMonitoring() {
        serviceScope.launch {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            while (isMonitoring) {
                val prefs = getSharedPreferences("discipline_prefs", Context.MODE_PRIVATE)
                val blockedAppsSet = prefs.getStringSet("blocked_apps", emptySet()) ?: emptySet()
                
                val endTime = System.currentTimeMillis()
                val startTime = endTime - 1000 * 5 // Last 5 seconds

                val stats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    startTime,
                    endTime
                )

                if (stats != null) {
                    var lastEventApp: String? = null
                    var lastTime = 0L

                    for (stat in stats) {
                        if (stat.lastTimeUsed > lastTime) {
                            lastTime = stat.lastTimeUsed
                            lastEventApp = stat.packageName
                        }
                    }

                    if (lastEventApp != null && blockedAppsSet.contains(lastEventApp)) {
                        DisciplineAccessibilityService.blockApp()
                    }
                }
                delay(1000)
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "lockdown_channel",
                "Lockdown Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, "lockdown_channel")
                .setContentTitle("Focus Mode Active")
                .setContentText("Discipline OS is maintaining lockdown.")
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("Focus Mode Active")
                .setContentText("Discipline OS is maintaining lockdown.")
                .build()
        }
    }

    override fun onDestroy() {
        isMonitoring = false
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
