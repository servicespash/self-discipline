package app.lovable.cymaticdiscipline;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.net.VpnService;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "DisciplineNative")
public class DisciplineNativePlugin extends Plugin {

    private Context ctx() { return getContext(); }

    @PluginMethod
    public void fetchInstalledApps(PluginCall call) {
        PackageManager pm = ctx().getPackageManager();
        Intent launcher = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> list = pm.queryIntentActivities(launcher, 0);
        Set<String> seen = new HashSet<>();
        JSONArray apps = new JSONArray();
        for (ResolveInfo ri : list) {
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(ctx().getPackageName()) || !seen.add(pkg)) continue;
            try {
                ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                JSObject o = new JSObject();
                o.put("packageName", pkg);
                o.put("name", String.valueOf(ri.loadLabel(pm)));
                o.put("isSystem", (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                o.put("versionName", pm.getPackageInfo(pkg, 0).versionName);
                apps.put(o);
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("apps", apps);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(permissionStatus());
    }

    private JSObject permissionStatus() {
        JSObject r = new JSObject();
        r.put("accessibility", isAccessibilityEnabled());
        r.put("notificationListener", isNotificationListenerEnabled());
        r.put("vpn", VpnService.prepare(ctx()) == null);
        r.put("overlay", Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(ctx()));
        return r;
    }

    /** Opens the system screen for one permission: accessibility | notificationListener | vpn | overlay. */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        String which = call.getString("permission", "");
        Intent i;
        switch (which) {
            case "accessibility":
                i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS); break;
            case "notificationListener":
                i = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"); break;
            case "overlay":
                i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx().getPackageName())); break;
            case "vpn":
                Intent prep = VpnService.prepare(ctx());
                if (prep == null) { call.resolve(permissionStatus()); return; }
                startActivityForResult(call, prep, "vpnResult");
                return;
            default:
                call.reject("Unknown permission: " + which);
                return;
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx().startActivity(i);
        call.resolve(permissionStatus());
    }

    @ActivityCallback
    private void vpnResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK) call.resolve(permissionStatus());
        else call.reject("VPN permission was declined");
    }

    @PluginMethod
    public void enforceIntentInterception(PluginCall call) {
        boolean active = Boolean.TRUE.equals(call.getBoolean("active", false));
        Set<String> pkgs = new HashSet<>();
        JSArray arr = call.getArray("packages");
        if (arr != null) {
            try { for (Object o : arr.toList()) if (o != null) pkgs.add(o.toString()); } catch (Exception ignored) {}
        }
        long end = call.getLong("endTime", 0L);
        if (active) {
            if (!isAccessibilityEnabled()) {
                LockdownStore.setInterception(ctx(), true, pkgs, end);
                call.reject("ACCESSIBILITY_DISABLED", "Turn on Cymatic in Accessibility settings so blocked apps can be closed.");
                return;
            }
            LockdownStore.setInterception(ctx(), true, pkgs, end);
        } else {
            LockdownStore.clear(ctx());
            stopVpn();
        }
        call.resolve(permissionStatus());
    }

    @PluginMethod
    public void suppressNotifications(PluginCall call) {
        boolean suppress = Boolean.TRUE.equals(call.getBoolean("suppress", false));
        LockdownStore.setSuppressNotifications(ctx(), suppress);
        if (suppress && !isNotificationListenerEnabled()) {
            call.reject("NOTIFICATION_ACCESS_DISABLED", "Allow Cymatic notification access so blocked apps stay silent.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void startVpnTunnel(PluginCall call) {
        if (VpnService.prepare(ctx()) != null) {
            call.reject("VPN_NOT_GRANTED", "Allow the Cymatic focus VPN first.");
            return;
        }
        Intent i = new Intent(ctx(), FocusVpnService.class);
        if (Build.VERSION.SDK_INT >= 26) ctx().startForegroundService(i); else ctx().startService(i);
        call.resolve();
    }

    @PluginMethod
    public void terminateLockdown(PluginCall call) {
        LockdownStore.clear(ctx());
        stopVpn();
        call.resolve();
    }

    @PluginMethod
    public void bringToFront(PluginCall call) {
        Intent i = new Intent(ctx(), MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        ctx().startActivity(i);
        call.resolve();
    }

    private void stopVpn() {
        Intent i = new Intent(ctx(), FocusVpnService.class).setAction(FocusVpnService.ACTION_STOP);
        try { ctx().startService(i); } catch (Exception ignored) {}
    }

    private boolean isAccessibilityEnabled() {
        String enabled = Settings.Secure.getString(ctx().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (TextUtils.isEmpty(enabled)) return false;
        String me = new ComponentName(ctx(), AppBlockerService.class).flattenToString();
        for (String s : enabled.split(":")) if (s.equalsIgnoreCase(me)) return true;
        return false;
    }

    private boolean isNotificationListenerEnabled() {
        String flat = Settings.Secure.getString(ctx().getContentResolver(), "enabled_notification_listeners");
        return flat != null && flat.contains(ctx().getPackageName());
    }
}
