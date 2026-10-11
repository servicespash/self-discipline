/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Spiritual User Configuration & Preference State Service
 * Manages user tradition preference (Islamic vs Christian), sound trigger options,
 * and enforces strict module separation in the spiritual dashboard.
 */

export type SpiritualTradition = 'islamic' | 'christian';

export interface SpiritualUserConfig {
  tradition: SpiritualTradition | null;
  soundTriggerEnabled: boolean;
  audioVolume: number;
  islamicRingtone: 'adhan_makkah' | 'adhan_full_session' | 'adhan_short';
  christianChime: 'church_bell' | 'sacred_harp' | 'contemplative_bowl';
  notificationsEnabled: boolean;
  autoLockdownEnabled: boolean;
  latitude: number;
  longitude: number;
  cityName: string;
  useCalculatedSolarWatches: boolean;
}

const STORAGE_KEY = 'sdc_spiritual_user_config_v4';
const LEGACY_TRADITION_KEY = 'sdc_locked_spiritual_tradition';

const DEFAULT_CONFIG: SpiritualUserConfig = {
  tradition: null, // Initial state: requires user choice / lock-in
  soundTriggerEnabled: true,
  audioVolume: 0.85,
  islamicRingtone: 'adhan_makkah',
  christianChime: 'church_bell',
  notificationsEnabled: true,
  autoLockdownEnabled: true,
  latitude: 21.4225, // Default baseline (Makkah)
  longitude: 39.8262,
  cityName: 'Makkah',
  useCalculatedSolarWatches: true
};

class SpiritualConfigServiceEngine {
  private config: SpiritualUserConfig = { ...DEFAULT_CONFIG };
  private listeners: Set<(config: SpiritualUserConfig) => void> = new Set();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Try reading primary config
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } else {
        // 2. Check legacy tradition preference
        const legacyTradition = localStorage.getItem(LEGACY_TRADITION_KEY) as SpiritualTradition | null;
        if (legacyTradition === 'islamic' || legacyTradition === 'christian') {
          this.config.tradition = legacyTradition;
        }
      }
    } catch (e) {
      console.warn('[SpiritualConfigService] Error loading config:', e);
    }
  }

  private saveConfig() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));

      // Synchronize legacy key for backward compatibility
      if (this.config.tradition) {
        localStorage.setItem(LEGACY_TRADITION_KEY, this.config.tradition);
      } else {
        localStorage.removeItem(LEGACY_TRADITION_KEY);
      }
    } catch (e) {
      console.error('[SpiritualConfigService] Error saving config:', e);
    }
  }

  public getConfig(): SpiritualUserConfig {
    return { ...this.config };
  }

  public getTradition(): SpiritualTradition | null {
    return this.config.tradition;
  }

  public setTradition(tradition: SpiritualTradition) {
    this.config.tradition = tradition;
    this.saveConfig();
    this.notify();
  }

  public resetTradition() {
    this.config.tradition = null;
    this.saveConfig();
    this.notify();
  }

  public updateConfig(partial: Partial<SpiritualUserConfig>) {
    this.config = { ...this.config, ...partial };
    this.saveConfig();
    this.notify();
  }

  public isIslamic(): boolean {
    return this.config.tradition === 'islamic';
  }

  public isChristian(): boolean {
    return this.config.tradition === 'christian';
  }

  public isConfigured(): boolean {
    return this.config.tradition !== null;
  }

  public subscribe(listener: (config: SpiritualUserConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = this.getConfig();
    this.listeners.forEach((fn) => {
      try {
        fn(current);
      } catch (e) {
        console.error('[SpiritualConfigService] Listener error:', e);
      }
    });

    // Also dispatch window custom event so other components or services react instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spiritual-config-changed', { detail: current }));
    }
  }
}

export const SpiritualConfigService = new SpiritualConfigServiceEngine();
