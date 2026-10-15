/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dynamic Package Manager - Real-time system and installed application authority engine
 * Connects directly to native Android Capacitor bridge or persisted device package authority registry.
 * Zero hardcoded third-party social apps: dynamically queries system installed applications.
 */

import { supabase } from './supabase';

export interface AppPackageInfo {
  packageName: string;
  appName: string;
  category: 'system' | 'installed' | 'social' | 'productivity' | 'messaging' | 'entertainment';
  isSystemApp: boolean;
  versionName?: string;
  iconUrl?: string;
  permissions?: string[];
  userAdded?: boolean;
}

const CONFIGURED_APPS_KEY = 'sdc_user_configured_apps_v1';
const BLOCKED_PACKAGES_KEY = 'sdc_blocked_packages_v1';

// Universal neutral core device utilities (standard across Android/Linux OS, not third-party commercial apps)
export const BASELINE_REAL_PACKAGES: AppPackageInfo[] = [
  {
    packageName: 'com.android.chrome',
    appName: 'Web Browser',
    category: 'system',
    isSystemApp: true,
    versionName: 'System',
    permissions: ['INTERNET']
  },
  {
    packageName: 'com.android.settings',
    appName: 'System Settings',
    category: 'system',
    isSystemApp: true,
    versionName: 'System',
    permissions: ['WRITE_SETTINGS']
  },
  {
    packageName: 'com.google.android.dialer',
    appName: 'Phone / Communications',
    category: 'system',
    isSystemApp: true,
    versionName: 'System',
    permissions: ['CALL_PHONE']
  }
];

export class PackageManager {
  /**
   * Fetch applications dynamically from native Capacitor DisciplineNative plugin on Android device.
   * If not on native device, returns user's configured package registry without hardcoded assumptions.
   */
  public static async fetchAllApps(): Promise<AppPackageInfo[]> {
    // 1. Check native Android Capacitor DisciplineNative plugin
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const nativeResult = await window.Capacitor.Plugins.DisciplineNative.fetchInstalledApps();
        const parsed = typeof nativeResult === 'string' ? JSON.parse(nativeResult) : nativeResult;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: AppPackageInfo[] = parsed.map((app: any) => ({
            packageName: app.packageName || app.id || `app.${(app.name || 'custom').toLowerCase().replace(/\s+/g, '_')}`,
            appName: app.name || app.appName || (app.packageName || '').split('.').pop() || 'Installed App',
            category: app.isSystem ? 'system' : (app.category || 'installed'),
            isSystemApp: Boolean(app.isSystem),
            versionName: app.versionName || '1.0.0',
            permissions: app.permissions || []
          }));
          
          // Cache discovered apps locally
          this.saveUserConfiguredApps(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[PackageManager] Native device bridge fetch:', err);
      }
    }

    // 2. Query PWA or web installed app hints if supported
    if (typeof window !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      try {
        const relatedApps = await (navigator as any).getInstalledRelatedApps();
        if (Array.isArray(relatedApps) && relatedApps.length > 0) {
          const current = this.getUserConfiguredApps();
          const existingIds = new Set(current.map(a => a.packageName));
          const newApps: AppPackageInfo[] = [];
          for (const rel of relatedApps) {
            const id = rel.id || rel.url || rel.platform;
            if (id && !existingIds.has(id)) {
              newApps.push({
                packageName: id,
                appName: rel.name || id,
                category: 'installed',
                isSystemApp: false,
                versionName: rel.version || '1.0'
              });
            }
          }
          if (newApps.length > 0) {
            const combined = [...current, ...newApps];
            this.saveUserConfiguredApps(combined);
            return combined;
          }
        }
      } catch (e) {
        // Safe fallback
      }
    }

    // 3. Load configured package registry from persistent storage
    return this.getUserConfiguredApps();
  }

  public static async syncFromRemoteAppSettings(userUid: string): Promise<AppPackageInfo[] | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('allowed_apps')
        .eq('user_uid', userUid)
        .maybeSingle();

      if (!error && data && Array.isArray(data.allowed_apps) && data.allowed_apps.length > 0) {
        localStorage.setItem(CONFIGURED_APPS_KEY, JSON.stringify(data.allowed_apps));
        return data.allowed_apps as AppPackageInfo[];
      }
    } catch (err) {
      console.warn('[PackageManager] Remote sync error:', err);
    }
    return null;
  }

  public static getUserConfiguredApps(): AppPackageInfo[] {
    try {
      const saved = localStorage.getItem(CONFIGURED_APPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[PackageManager] Failed to load stored package registry:', e);
    }

    // Default initialization with baseline neutral packages
    this.saveUserConfiguredApps(BASELINE_REAL_PACKAGES);
    return BASELINE_REAL_PACKAGES;
  }

  public static saveUserConfiguredApps(apps: AppPackageInfo[], userUid?: string): void {
    try {
      localStorage.setItem(CONFIGURED_APPS_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error('[PackageManager] Failed to save package registry:', e);
    }

    if (userUid) {
      try {
        supabase.from('app_settings').upsert({
          user_uid: userUid,
          allowed_apps: apps,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_uid' }).then(({ error }) => {
          if (error) console.warn('[PackageManager] Remote app settings sync note:', error.message);
        });
      } catch {}
    }
  }

  public static addConfiguredApp(app: AppPackageInfo): AppPackageInfo[] {
    const current = this.getUserConfiguredApps();
    const filtered = current.filter(a => a.packageName.toLowerCase() !== app.packageName.toLowerCase());
    const updated = [{ ...app, userAdded: true }, ...filtered];
    this.saveUserConfiguredApps(updated);
    return updated;
  }

  public static removeConfiguredApp(packageName: string): AppPackageInfo[] {
    const current = this.getUserConfiguredApps();
    const updated = current.filter(a => a.packageName !== packageName);
    this.saveUserConfiguredApps(updated);
    return updated;
  }

  public static getBlockedPackages(): string[] {
    try {
      const saved = localStorage.getItem(BLOCKED_PACKAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[PackageManager] Error loading blocked packages:', e);
    }
    // No hardcoded default blocked apps: user selects explicitly
    return [];
  }

  public static saveBlockedPackages(packages: string[]): void {
    try {
      localStorage.setItem(BLOCKED_PACKAGES_KEY, JSON.stringify(packages));
    } catch (e) {
      console.error('[PackageManager] Error saving blocked packages:', e);
    }
  }

  public static toggleBlockPackage(packageName: string): string[] {
    const current = this.getBlockedPackages();
    const exists = current.includes(packageName);
    const updated = exists ? current.filter(p => p !== packageName) : [...current, packageName];
    this.saveBlockedPackages(updated);
    return updated;
  }
}
