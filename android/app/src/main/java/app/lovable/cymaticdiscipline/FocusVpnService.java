package app.lovable.cymaticdiscipline;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.util.Set;

/**
 * Local-only VPN: routes traffic of blocked apps into a tunnel that is never forwarded,
 * so those apps lose internet. Nothing leaves the phone.
 */
public class FocusVpnService extends VpnService {
    public static final String ACTION_STOP = "app.lovable.cymaticdiscipline.STOP_VPN";
    private static final String CHANNEL = "cymatic_focus";
    private ParcelFileDescriptor tun;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopTunnel();
            return START_NOT_STICKY;
        }
        startForegroundCompat();
        Set<String> blocked = LockdownStore.blocked(this);
        if (!LockdownStore.isActive(this) || blocked.isEmpty()) {
            stopTunnel();
            return START_NOT_STICKY;
        }
        try {
            if (tun != null) tun.close();
            Builder b = new Builder()
                .setSession("Cymatic Focus")
                .addAddress("10.111.0.1", 32)
                .addRoute("0.0.0.0", 0)
                .addAddress("fd00:111::1", 128)
                .addRoute("::", 0);
            int added = 0;
            for (String pkg : blocked) {
                try { b.addAllowedApplication(pkg); added++; }
                catch (PackageManager.NameNotFoundException ignored) {}
            }
            if (added == 0) { stopTunnel(); return START_NOT_STICKY; }
            tun = b.establish();
        } catch (Exception e) {
            Log.e("FocusVpn", "Could not start tunnel", e);
            stopTunnel();
        }
        return START_STICKY;
    }

    private void startForegroundCompat() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm != null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Focus lockdown", NotificationManager.IMPORTANCE_LOW));
        }
        Notification.Builder nb = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        Notification n = nb.setContentTitle("Focus lockdown active")
            .setContentText("Blocked apps have no internet")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .build();
        startForeground(7701, n);
    }

    private void stopTunnel() {
        try { if (tun != null) tun.close(); } catch (Exception ignored) {}
        tun = null;
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onRevoke() { stopTunnel(); }

    @Override
    public void onDestroy() {
        try { if (tun != null) tun.close(); } catch (Exception ignored) {}
        super.onDestroy();
    }
}
