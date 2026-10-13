package com.cymatic.disciplineos;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

public class DisciplineNativePlugin {
    private Context context;

    public DisciplineNativePlugin(Context context) {
        this.context = context;
    }

    public JSONArray fetchInstalledApps() {
        PackageManager pm = context.getPackageManager();
        List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSONArray apps = new JSONArray();
        for (ApplicationInfo packageInfo : packages) {
            try {
                JSONObject app = new JSONObject();
                app.put("name", pm.getApplicationLabel(packageInfo).toString());
                app.put("packageName", packageInfo.packageName);
                apps.put(app);
            } catch (JSONException e) {
                Log.e("DisciplineNative", "Error creating JSON for app: " + packageInfo.packageName);
            }
        }
        return apps;
    }

    public void startVpnTunnel() {
        Intent intent = new Intent(context, DisciplineVpnService.class);
        context.startService(intent);
    }

    public void enforceSystemBlock(String packageName) {
        Log.d("DisciplineNative", "Enforcing block on: " + packageName);
        android.content.SharedPreferences prefs = context.getSharedPreferences("discipline_prefs", Context.MODE_PRIVATE);
        java.util.Set<String> blockedApps = prefs.getStringSet("blocked_apps", new java.util.HashSet<>());
        java.util.Set<String> newBlockedApps = new java.util.HashSet<>(blockedApps);
        newBlockedApps.add(packageName);
        prefs.edit().putStringSet("blocked_apps", newBlockedApps).apply();
    }
    
    public void unblockApp(String packageName) {
        Log.d("DisciplineNative", "Unblocking: " + packageName);
        android.content.SharedPreferences prefs = context.getSharedPreferences("discipline_prefs", Context.MODE_PRIVATE);
        java.util.Set<String> blockedApps = prefs.getStringSet("blocked_apps", new java.util.HashSet<>());
        java.util.Set<String> newBlockedApps = new java.util.HashSet<>(blockedApps);
        newBlockedApps.remove(packageName);
        prefs.edit().putStringSet("blocked_apps", newBlockedApps).apply();
    }
}
