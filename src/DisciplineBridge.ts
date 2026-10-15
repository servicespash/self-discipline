/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Event-Driven Production DisciplineBridge - Native OS Intent Interceptor & Strict Interminable Lockdown Engine
 */

import { supabase } from './utils/supabase';
import { governanceService } from './utils/governanceService';
import { PackageManager } from './utils/packageManager';

export interface DeviceAppRecord {
  id: string; // Android package name e.g. com.instagram.android
  name: string; // App label e.g. Instagram
  category: 'Productivity' | 'Social' | 'Entertainment' | 'Utility' | 'Finance' | 'Restricted' | 'system';
  dopamineLevel: 'extreme' | 'high' | 'moderate' | 'low' | 'neutral';
  isSystem?: boolean;
  defaultRestricted?: boolean;
}

export const SOCIAL_MEDIA_PACKAGES: string[] = [];

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
      this.broadcastChannel.onmessage = (event: MessageEvent) => {
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

  public on(event: 'lockdownChange', listener: (payload: SystemLockdownPayload) => void): void {
    this.events[event].push(listener);
  }

  private loadPersistedState(): void {
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

  public off(event: 'lockdownChange', listener: (payload: SystemLockdownPayload) => void): void {
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  private emit(event: 'lockdownChange', payload: SystemLockdownPayload): void {
    this.events[event].forEach(listener => listener(payload));
  }

  private saveState(): void {
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

  private async dispatchNativeInterception(active: boolean): Promise<void> {
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const plugin = window.Capacitor.Plugins.DisciplineNative;
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

  public async isSocialMediaPackage(packageId: string): Promise<boolean> {
    const apps = await PackageManager.fetchAllApps();
    const app = apps.find(a => a.packageName === packageId);
    return app ? app.category === 'social' || app.category === 'messaging' : false;
  }

  public isValidPackageName(packageName: string): boolean {
    const pkgRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;
    return pkgRegex.test(packageName);
  }

  public async terminateLockdown(): Promise<void> {
    if (this.lockdownState.active && Date.now() < this.lockdownState.endTime) {
      console.warn('Security Violation: Attempted early termination of lockdown - rejection enforced');
      // Enforce strict interminable lockdown: keep native suppression and intent interception active
      await this.dispatchNativeInterception(true);
      return;
    }
    this.lockdownState.active = false;
    this.lockdownState.endTime = 0;
    this.saveState();
  }

  public async initiateLockdown(
    durationMinutes: number, 
    packagesCsv?: string,
    allowedSocialPkg?: string | null,
    contractId?: string | null
  ): Promise<SystemLockdownPayload> {
    const now = Date.now();

    if (contractId) {
      try {
        let contract: any = null;
        try {
          const { data, error } = await supabase
            .from('governance_contracts')
            .select('*')
            .eq('id', contractId)
            .maybeSingle();
          if (!error && data) {
            contract = data;
          }
        } catch {}

        if (!contract) {
          contract = await governanceService.getContractById(contractId);
        }

        if (!contract) {
          console.warn('[DisciplineBridge] Security Violation: Attempted lockdown with invalid or missing contract ID:', contractId);
          throw new Error('Lockdown rejected: Associated governance contract not found.');
        }

        if (contract.status !== 'active') {
          console.warn('[DisciplineBridge] Security Violation: Attempted lockdown with inactive contract status:', contract.status);
          throw new Error(`Lockdown rejected: Governance contract is not active (status: ${contract.status}).`);
        }

        // Validate time windows if present
        if (Array.isArray(contract.agreed_time_windows) && contract.agreed_time_windows.length > 0) {
          const currentDate = new Date(now);
          const currentDay = currentDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
          const currentTimeStr = currentDate.toTimeString().slice(0, 5); // "HH:MM"

          const validWindow = contract.agreed_time_windows.some((w: any) => {
            const wDay = (w.day || '').toLowerCase();
            const matchesDay = !wDay || wDay === 'daily' || wDay === currentDay;
            const matchesTime = (!w.startTime || !w.endTime) || (currentTimeStr >= w.startTime && currentTimeStr <= w.endTime);
            return matchesDay && matchesTime;
          });

          if (!validWindow) {
            console.warn('[DisciplineBridge] Security Violation: Lockdown attempted outside agreed contract time windows.');
            throw new Error('Lockdown rejected: Attempted outside agreed governance contract time windows.');
          }
        }

        // Verify requested packages against agreed packages
        if (packagesCsv && Array.isArray(contract.agreed_packages)) {
          const requestedPkgs = packagesCsv.split(',').map(s => s.trim()).filter(Boolean);
          const agreedPkgs = contract.agreed_packages as string[];
          const unagreed = requestedPkgs.filter(p => !agreedPkgs.includes(p));

          if (unagreed.length > 0) {
            console.warn('[DisciplineBridge] Security Violation: Lockdown requested unagreed packages:', unagreed);
            throw new Error(`Lockdown rejected: Requested restricted packages [${unagreed.join(', ')}] are not authorized in the active governance contract.`);
          }
        }
      } catch (err: any) {
        console.error('[DisciplineBridge] Governance validation error:', err);
        throw err;
      }
    }

    const endTime = now + durationMinutes * 60 * 1000;
    const pkgRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;
    let restricted = packagesCsv 
      ? packagesCsv.split(',').map(s => s.trim()).filter(p => pkgRegex.test(p))
      : [];

    if (allowedSocialPkg && pkgRegex.test(allowedSocialPkg)) {
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
    
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      const plugin = window.Capacitor.Plugins.DisciplineNative;
      await plugin.startVpnTunnel();
    }
    
    return this.lockdownState;
  }

  public async checkPermissions(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        return await window.Capacitor.Plugins.DisciplineNative.checkPermissions();
      } catch (e) {
        console.error('[DisciplineBridge] Native permission check failed:', e);
      }
    }
    return true;
  }

  public categorizePackageName(pkgName: string, nativeCategory?: string): {
    category: 'Productivity' | 'Social' | 'Entertainment' | 'Utility' | 'Finance' | 'Restricted' | 'system';
    dopamineLevel: 'extreme' | 'high' | 'moderate' | 'low' | 'neutral';
  } {
    // 1. Use native categorization if provided by PackageManager
    if (nativeCategory) {
       const cat = nativeCategory.toLowerCase();
       if (cat === 'social' || cat === 'messaging') return { category: 'Social', dopamineLevel: 'extreme' };
       if (cat === 'productivity' || cat === 'work') return { category: 'Productivity', dopamineLevel: 'low' };
       if (cat === 'entertainment' || cat === 'media') return { category: 'Entertainment', dopamineLevel: 'high' };
       if (cat === 'finance') return { category: 'Finance', dopamineLevel: 'low' };
       if (cat === 'system') return { category: 'system', dopamineLevel: 'neutral' };
    }

    // 2. Fallback to generic patterns
    const lower = pkgName.toLowerCase();
    if (lower.includes('bank') || lower.includes('finance') || lower.includes('wallet') || lower.includes('pay') || lower.includes('money')) return { category: 'Finance', dopamineLevel: 'low' };
    if (lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('signal') || lower.includes('messenger')) return { category: 'Utility', dopamineLevel: 'moderate' };
    if (lower.includes('instagram') || lower.includes('tiktok') || lower.includes('facebook') || lower.includes('twitter')) return { category: 'Social', dopamineLevel: 'extreme' };
    if (lower.includes('youtube') || lower.includes('netflix') || lower.includes('spotify')) return { category: 'Entertainment', dopamineLevel: 'high' };
    if (lower.includes('settings') || lower.includes('dialer') || lower.includes('camera')) return { category: 'system', dopamineLevel: 'neutral' };
    if (lower.includes('calc') || lower.includes('notes') || lower.includes('docs')) return { category: 'Productivity', dopamineLevel: 'low' };
    return { category: 'Restricted', dopamineLevel: 'moderate' };
  }

  public async fetchInstalledApps(): Promise<DeviceAppRecord[]> {
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const result = await window.Capacitor.Plugins.DisciplineNative.fetchInstalledApps();
        const rawApps = JSON.parse(result) as Array<{ packageName?: string; name?: string }>;
        const parsed = rawApps.map((app) => {
          const pkgName = app.packageName || '';
          const scoring = this.categorizePackageName(pkgName);
          return {
            id: pkgName,
            name: app.name || pkgName,
            category: scoring.category,
            dopamineLevel: scoring.dopamineLevel
          };
        });
        if (parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('[DisciplineBridge] Native app fetch fallback active:', e);
      }
    }

    try {
      const saved = localStorage.getItem('sdc_user_configured_packages_v1') || localStorage.getItem('sdc_user_configured_apps_v1');
      if (saved) {
        return JSON.parse(saved) as DeviceAppRecord[];
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

  public async requestSystemOverlayPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const plugin = window.Capacitor.Plugins.DisciplineNative as any;
        return await plugin.requestSystemOverlayPermission();
      } catch (e) {
        console.error('[DisciplineBridge] Overlay permission request failed:', e);
      }
    }
    return false;
  }

  public async setSystemOverlayMode(active: boolean): Promise<void> {
    if (typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        const plugin = window.Capacitor.Plugins.DisciplineNative as any;
        await plugin.setSystemOverlayMode({ active });
      } catch (e) {
        console.error('[DisciplineBridge] Overlay mode toggle failed:', e);
      }
    }
  }

  private micActive: boolean = false;

  public setMicrophoneActive(active: boolean) {
    if (this.micActive === active) return;
    console.log(`[DisciplineBridge] Microphone state transition: ${this.micActive} -> ${active}`);
    this.micActive = active;
  }

  public isMicrophoneAllowed(): boolean {
    // Check lockdown or other constraints
    return !this.lockdownState.active;
  }

  public getState(): SystemLockdownPayload {
    return this.lockdownState;
  }
}

export const DisciplineBridge = new DisciplineBridgeEngine();
