package app.lovable.cymaticdiscipline;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/** Removes notifications from blocked apps while lockdown is active. */
public class NotificationBlockerService extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        if (LockdownStore.isSuppressing(this) && LockdownStore.blocked(this).contains(sbn.getPackageName())) {
            cancelNotification(sbn.getKey());
        }
    }

    @Override
    public void onListenerConnected() {
        if (!LockdownStore.isSuppressing(this)) return;
        StatusBarNotification[] active = getActiveNotifications();
        if (active == null) return;
        for (StatusBarNotification sbn : active) onNotificationPosted(sbn);
    }
}
