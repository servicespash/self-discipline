package app.lovable.cymaticdiscipline;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Shared lockdown state read by the accessibility, notification and VPN services. */
public final class LockdownStore {
    private static final String PREFS = "cymatic_lockdown";

    private LockdownStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void setInterception(Context c, boolean active, Set<String> packages, long endTime) {
        prefs(c).edit()
            .putBoolean("active", active)
            .putStringSet("packages", packages == null ? new HashSet<>() : packages)
            .putLong("endTime", endTime)
            .apply();
    }

    public static void setSuppressNotifications(Context c, boolean suppress) {
        prefs(c).edit().putBoolean("suppress", suppress).apply();
    }

    public static boolean isActive(Context c) {
        SharedPreferences p = prefs(c);
        if (!p.getBoolean("active", false)) return false;
        long end = p.getLong("endTime", 0);
        if (end > 0 && System.currentTimeMillis() > end) {
            clear(c);
            return false;
        }
        return true;
    }

    public static boolean isSuppressing(Context c) {
        return isActive(c) && prefs(c).getBoolean("suppress", false);
    }

    public static Set<String> blocked(Context c) {
        return new HashSet<>(prefs(c).getStringSet("packages", new HashSet<>()));
    }

    public static boolean isBlocked(Context c, String pkg) {
        return pkg != null && isActive(c) && blocked(c).contains(pkg);
    }

    public static void clear(Context c) {
        prefs(c).edit().clear().apply();
    }

    public static Set<String> parse(String csv) {
        Set<String> out = new HashSet<>();
        if (csv == null) return out;
        for (String s : Arrays.asList(csv.split(","))) {
            String t = s.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }
}
