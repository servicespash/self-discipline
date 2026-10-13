package com.cymatic.disciplineos;

import android.net.VpnService;
import android.content.Intent;
import android.util.Log;
import android.os.ParcelFileDescriptor;

public class DisciplineVpnService extends VpnService {
    private static final String TAG = "DisciplineVpnService";
    private ParcelFileDescriptor vpnInterface;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Starting VPN tunnel");
        // Simplified setup for demonstration; in production, this needs actual IP/MTU config
        try {
            vpnInterface = new Builder()
                    .setSession("DisciplineOS_VPN")
                    .addAddress("10.0.0.2", 24)
                    .addDnsServer("8.8.8.8")
                    .addRoute("0.0.0.0", 0)
                    .establish();
        } catch (Exception e) {
            Log.e(TAG, "Failed to establish VPN", e);
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "VPN tunnel stopped");
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (Exception e) {
                Log.e(TAG, "Failed to close VPN interface", e);
            }
        }
    }
}
