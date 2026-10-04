/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DisciplineBridge - Core Native & System Orchestrator Engine
 */

export interface SystemLockdownPayload {
  active: boolean;
  durationMinutes: number;
  endTime: number;
  restrictedPackages: string[];
  whitelistedPackages: string[];
}

type DisciplineEventListener = (payload: SystemLockdownPayload) => void;

class DisciplineBridgeEngine {
  private listeners: Set<DisciplineEventListener> = new Set();
  private lockdownState: SystemLockdownPayload = {
    active: false,
    durationMinutes: 0,
    endTime: 0,
    restrictedPackages: ['com.whatsapp', 'com.instagram.android', 'com.zhiliaoapp.musically'],
    whitelistedPackages: ['com.android.dialer', 'com.android.mms', 'com.termux']
  };

  constructor() {
    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      const saved = localStorage.getItem('sdc_discipline_bridge_state');
      if (saved) {
        const parsed: SystemLockdownPayload = JSON.parse(saved);
        if (parsed.active && parsed.endTime > Date.now()) {
          this.lockdownState = parsed;
        } else {
          this.lockdownState.active = false;
        }
      }
    } catch (e) {
      console.error('[DisciplineBridge] Error loading state:', e);
    }
  }

  private saveState() {
    try {
      localStorage.setItem('sdc_discipline_bridge_state', JSON.stringify(this.lockdownState));
      this.notifyListeners();
    } catch (e) {
      console.error('[DisciplineBridge] Error saving state:', e);
    }
  }

  public subscribe(listener: DisciplineEventListener): () => void {
    this.listeners.add(listener);
    listener(this.lockdownState);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.lockdownState));
  }

  // System Permission Checks
  public async checkPermissions(): Promise<boolean> {
    console.log('[DisciplineBridge] Checking UsageStats & AlertWindow Permissions...');
    // Check Capacitor / Web window bridge
    if (window && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        return await (window as any).Capacitor.Plugins.DisciplineNative.checkPermissions();
      } catch (e) {
        console.error('[DisciplineBridge] Native permission check failed:', e);
      }
    }
    return true; // Web fallback mode
  }

  public async requestSystemPermissions(): Promise<void> {
    console.log('[DisciplineBridge] Requesting System Privileges...');
    if (window && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        await (window as any).Capacitor.Plugins.DisciplineNative.requestPermissions();
      } catch (e) {
        console.error('[DisciplineBridge] Native permission request failed:', e);
      }
    }
  }

  // Active Lockdown Triggers
  public async setBlockRule(packageName: string, startTime: string, endTime: string): Promise<void> {
    console.log(`[DisciplineBridge] Setting Block Rule: ${packageName} [${startTime} -> ${endTime}]`);
    if (window && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        await (window as any).Capacitor.Plugins.DisciplineNative.setBlockRule({
          packageName,
          startTime,
          endTime
        });
      } catch (e) {
        console.error('[DisciplineBridge] Failed to set native block rule:', e);
      }
    }
  }

  public async initiateLockdown(durationMinutes: number, targetAppsCsv?: string): Promise<SystemLockdownPayload> {
    const now = Date.now();
    const endTime = now + durationMinutes * 60 * 1000;
    
    // Parse target apps
    const packages = targetAppsCsv 
      ? targetAppsCsv.split(',').map(s => s.trim()).filter(Boolean)
      : this.lockdownState.restrictedPackages;

    this.lockdownState = {
      ...this.lockdownState,
      active: true,
      durationMinutes,
      endTime,
      restrictedPackages: packages
    };

    this.saveState();

    // Trigger Native / Bridge Rule Dispatch
    const startTimeStr = new Date(now).toISOString();
    const endTimeStr = new Date(endTime).toISOString();

    for (const pkg of packages) {
      await this.setBlockRule(pkg, startTimeStr, endTimeStr);
    }

    return this.lockdownState;
  }

  public async terminateLockdown(): Promise<void> {
    console.log('[DisciplineBridge] Emergency Lockdown Termination Triggered.');
    this.lockdownState.active = false;
    this.lockdownState.endTime = 0;
    this.saveState();

    if (window && (window as any).Capacitor?.isPluginAvailable('DisciplineNative')) {
      try {
        await (window as any).Capacitor.Plugins.DisciplineNative.clearAllBlockRules();
      } catch (e) {
        console.error('[DisciplineBridge] Failed to clear native rules:', e);
      }
    }
  }

  public getState(): SystemLockdownPayload {
    return this.lockdownState;
  }
}

export const DisciplineBridge = new DisciplineBridgeEngine();
