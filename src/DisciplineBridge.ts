/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Event-Driven Production DisciplineBridge - Native OS Intent Interceptor
 */

export interface SystemLockdownPayload {
  active: boolean;
  durationMinutes: number;
  endTime: number;
  restrictedPackages: string[];
  whitelistedPackages: string[];
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
    listener(this.lockdownState);
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

  public async initiateLockdown(durationMinutes: number, packagesCsv?: string): Promise<SystemLockdownPayload> {
    const now = Date.now();
    const endTime = now + durationMinutes * 60 * 1000;
    const restricted = packagesCsv ? packagesCsv.split(',').map(s => s.trim()).filter(Boolean) : ['com.whatsapp', 'com.instagram.android'];

    this.lockdownState = {
      active: true,
      durationMinutes,
      endTime,
      restrictedPackages: restricted,
      whitelistedPackages: ['com.android.dialer']
    };

    this.saveState();
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

  public getState(): SystemLockdownPayload {
    return this.lockdownState;
  }
}

export const DisciplineBridge = new DisciplineBridgeEngine();
