package app.lovable.cymaticdiscipline;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

/** Sends the user home and back to Cymatic whenever a blocked app opens during lockdown. */
public class AppBlockerService extends AccessibilityService {
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence pkg = event.getPackageName();
        if (pkg == null) return;
        String name = pkg.toString();
        if (name.equals(getPackageName())) return;
        if (!LockdownStore.isBlocked(this, name)) return;

        performGlobalAction(GLOBAL_ACTION_HOME);
        Intent open = new Intent(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        open.putExtra("blockedPackage", name);
        startActivity(open);
    }

    @Override
    public void onInterrupt() {}
}
