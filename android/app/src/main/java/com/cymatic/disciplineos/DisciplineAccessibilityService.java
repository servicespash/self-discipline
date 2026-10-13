package com.cymatic.disciplineos;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.util.Log;

public class DisciplineAccessibilityService extends AccessibilityService {
    private static final String TAG = "DisciplineAccessibilityService";
    private static DisciplineAccessibilityService instance;

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    public static void blockApp() {
        if (instance != null) {
            instance.performGlobalAction(GLOBAL_ACTION_HOME);
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
            Log.d(TAG, "Package changed: " + packageName);
        }
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted");
    }
}
