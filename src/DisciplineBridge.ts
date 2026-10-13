/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Event-Driven Production DisciplineBridge - Native OS Intent Interceptor
 */

export interface DeviceAppRecord {
  id: string; // Android package name e.g. com.instagram.android
  name: string; // App label e.g. Instagram
  category: 'social' | 'entertainment' | 'messaging' | 'productivity' | 'system';
  dopamineLevel: 'extreme' | 'high' | 'moderate' | 'low' | 'neutral';
  isSystem?: boolean;
  defaultRestricted?: boolean;
}

export const SOCIAL_MEDIA_PACKAGES: string[] = [
  'com.whatsapp',
  'com.instagram.android',
  'com.zhiliaoapp.musically', // TikTok
  'com.twitter.android',
  'com.facebook.katana',
  'com.snapchat.android',
  'com.reddit.frontpage',
  'com.google.android.youtube',
  'com.pinterest'
];

export const DEFAULT_DEVICE_APPS: DeviceAppRecord[] = [];

export interface SystemLockdownPayload {
  active: boolean;
  durationMinutes: number;
  endTime: number;
  restrictedPackages: string[];
  whitelistedPackages: string[];
  allowedSocialPackage?: string | null;
}

class DisciplineBridgeEngine {
  private events: {
    lockdownChange: Array<(payload: SystemLockdownPayload) => void>
  } = {
    lockdownChange: []
  };
  private broadcastChannel: BroadcastChannel | null = null;
  private lockdownState: SystemLockdownPayload = {
    active: false,
    durationMinutes: 0,
    endTime: 0,
    restrictedPackages: [],
    whitelistedPackages: []
  };

  constructor() {
    this.loadPersistedState();
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      this.broadcastChannel = new BroadcastChannel('sdc_discipline_event_bus');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          this.lockdownState = event.data as SystemLockdownPayload;
          this.emit('lockdownChange', this.lockdownState);
        }
      };
    }
  }

  public subscribe(listener: (payload: SystemLockdownPayload) => void): () => void {
    this.on('lockdownChange', listener);
    return () => this.off('lockdownChange', listener);
  }

  public on(event: 'lockdownChange', listener: (payload: SystemLockdownPayload) => void) {
    this.events[event].push(listener);
  }

  private loadPersistedState() {
    try {
      const saved = localStorage.getItem('sdc_discipline_engine_v3');
      if (saved) {
        const parsed: SystemLockdownPayload = JSON.parse(saved);
        if (parsed.active && parsed.endTime > Date.now()) {
          this.lockdownState = parsed;
          this.dispatchNativeInterception(true);
        } else {
          this.lockdownState.active = false;
        }
      }
    } catch (e) {
      console.error('[DisciplineBridge] State load error:', e);
    }
  }

  public off(event: 'lockdownChange', listener: (payload: SystemLockdownPayload) => void) {
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  private emit(event: 'lockdownChange', payload: SystemLockdownPayload) {
    this.events[event].forEach(listener => listener(payload));
  }

  // ... (loadPersistedState, saveState, initiateLockdown, etc. same as before, but call emit instead of notifyListeners)
  private saveState() {
    try {
      localStorage.setItem('sdc_discipline_engine_v3', JSON.stringify(this.lockdownState));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(this.lockdownState);
      }
      this.emit('lockdownChange', this.lockdownState);
      this.dispatchNativeInterception(this.lockdownState.active);
    } catch (e) {
      console.error('[DisciplineBridge] State save error:', e);
    }
  }
  
  // ... (rest of methods)


  private async dispatchNativeInterception(active: boolean) {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const plugin = (window as any).Capacitor.Plugins.DisciplineNative;
        if (active) {
          await plugin.suppressNotifications({ suppress: true });
          await plugin.enforceIntentInterception({ active: true, packages: this.lockdownState.restrictedPackages });
        } else {
          await plugin.suppressNotifications({ suppress: false });
          await plugin.enforceIntentInterception({ active: false });
        }
      } catch (e) {
        console.warn('[DisciplineBridge] Native plugin event dispatch fallback active:', e);
      }
    }
  }

  public isSocialMediaPackage(packageId: string): boolean {
    return SOCIAL_MEDIA_PACKAGES.includes(packageId);
  }

  public async initiateLockdown(
    durationMinutes: number, 
    packagesCsv?: string,
    allowedSocialPkg?: string | null
  ): Promise<SystemLockdownPayload> {
    const now = Date.now();
    const endTime = now + durationMinutes * 60 * 1000;
    let restricted = packagesCsv ? packagesCsv.split(',').map(s => s.trim()).filter(Boolean) : [];

    // If a specific social app is allowed, ensure it's not in the restricted list
    if (allowedSocialPkg) {
      restricted = restricted.filter(p => p !== allowedSocialPkg);
    }

    this.lockdownState = {
      active: true,
      durationMinutes,
      endTime,
      restrictedPackages: restricted,
      whitelistedPackages: allowedSocialPkg ? [allowedSocialPkg] : [],
      allowedSocialPackage: allowedSocialPkg || null
    };

    this.saveState();
    
    // Activate VPN and system lockdown
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      const plugin = (window as any).Capacitor.Plugins.DisciplineNative;
      await plugin.startVpnTunnel();
    }
    
    return this.lockdownState;
  }

  public async terminateLockdown(): Promise<void> {
    this.lockdownState.active = false;
    this.lockdownState.endTime = 0;
    this.saveState();
  }

  public async checkPermissions(): Promise<boolean> {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        return await (window as any).Capacitor.Plugins.DisciplineNative.checkPermissions();
      } catch (e) {
        console.error('[DisciplineBridge] Native permission check failed:', e);
      }
    }
    return true;
  }

  public async fetchInstalledApps(): Promise<DeviceAppRecord[]> {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const result = await (window as any).Capacitor.Plugins.DisciplineNative.fetchInstalledApps();
        const parsed = JSON.parse(result).map((app: any) => ({
          id: app.packageName,
          name: app.name,
          category: SOCIAL_MEDIA_PACKAGES.includes(app.packageName) ? 'social' : 'productivity',
          dopamineLevel: SOCIAL_MEDIA_PACKAGES.includes(app.packageName) ? 'extreme' : 'low'
        }));
        if (parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('[DisciplineBridge] Native app fetch fallback active:', e);
      }
    }

    // Load persisted real user configured package registry
    try {
      const saved = localStorage.getItem('sdc_user_configured_packages_v1') || localStorage.getItem('sdc_user_configured_apps_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[DisciplineBridge] Configured packages load fallback:', e);
    }

    return DEFAULT_DEVICE_APPS;
  }

  public async registerCustomPackage(pkg: DeviceAppRecord): Promise<DeviceAppRecord[]> {
    const existing = await this.fetchInstalledApps();
    const updated = [pkg, ...existing.filter(a => a.id !== pkg.id)];
    try {
      localStorage.setItem('sdc_user_configured_packages_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('[DisciplineBridge] Failed to save package:', e);
    }
    return updated;
  }

  public getState(): SystemLockdownPayload {
    return this.lockdownState;
  }
}

export const DisciplineBridge = new DisciplineBridgeEngine();
