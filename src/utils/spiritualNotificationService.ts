/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Spiritual & Adhan Real-Time Notification & Sound Triggering Service
 * Integrates open-source astronomical prayer calculation, sound triggering distinguishing
 * between Islamic Adhan and Christian Chimes, browser notifications, and auxiliary lockdowns.
 */

import { DisciplineBridge } from '../DisciplineBridge';
import { GoogleServiceBridge } from './GoogleServiceBridge';
import {
  PrayerCalculationEngine,
  PrayerTimesResult,
  KAABA_COORDINATES
} from './prayerCalculationService';
import {
  SpiritualAudio,
  SpiritualAudioType
} from './spiritualAudioService';
import {
  SpiritualConfigService,
  SpiritualTradition,
  SpiritualUserConfig
} from './spiritualConfigService';

export interface PrayerScheduleItem {
  name: 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  time: string;
  minutesFromMidnight: number;
  isPrayer: boolean;
  enabled: boolean;
  passed: boolean;
  isNext: boolean;
}

export interface CalculatedChristianWatch {
  id: string;
  name: string;
  canonicalHour: string;
  timeString: string;
  minutesFromMidnight: number;
  theme: string;
  scripture: string;
  isPassed: boolean;
  isNext: boolean;
}

export interface SpiritualNotificationState {
  config: SpiritualUserConfig;
  tradition: SpiritualTradition | null;
  prayerTimes: PrayerTimesResult;
  schedule: PrayerScheduleItem[];
  christianWatches: CalculatedChristianWatch[];
  nextEvent: {
    name: string;
    time: string;
    minutesRemaining: number;
    tradition: 'islamic' | 'christian';
  };
  lastTriggeredKey: string;
  isPlayingSound: boolean;
  soundTriggerActive: boolean;
}

const STORAGE_KEY_LAST_TRIGGERED = 'sdc_spiritual_last_sound_triggered_v4';

class SpiritualNotificationEngine {
  private tickerTimer: any = null;
  private calendarTimer: any = null;
  private lastTriggeredKey: string = '';
  private listeners: Set<(state: SpiritualNotificationState) => void> = new Set();
  private initialized: boolean = false;
  private isAudioUnlocked: boolean = false;

  constructor() {
    this.loadPersistedState();
    SpiritualConfigService.subscribe(() => {
      this.notifySubscribers();
    });
  }

  private loadPersistedState() {
    if (typeof window === 'undefined') return;

    try {
      const savedLast = localStorage.getItem(STORAGE_KEY_LAST_TRIGGERED);
      if (savedLast) {
        this.lastTriggeredKey = savedLast;
      }
    } catch (e) {
      console.warn('[SpiritualNotificationEngine] Storage load warning:', e);
    }
  }

  public async init() {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;
    this.initialized = true;

    // 1. Setup global audio unlock on user interaction
    const unlockAudio = async () => {
      if (!this.isAudioUnlocked) {
        this.isAudioUnlocked = await SpiritualAudio.unlock();
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    // 2. Request browser notification permission if available
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }

    // 3. Register native Capacitor push notifications if available
    if ((window as any).Capacitor?.isPluginAvailable?.('PushNotifications')) {
      try {
        const push = (window as any).Capacitor.Plugins.PushNotifications;
        await push.requestPermissions();
        await push.register();
      } catch (e) {
        console.warn('[SpiritualNotifications] Native push registration warning:', e);
      }
    }

    // 4. Try obtaining local device GPS coordinates if baseline is default
    const currentCfg = SpiritualConfigService.getConfig();
    if (
      currentCfg.latitude === 21.4225 &&
      currentCfg.longitude === 39.8262 &&
      typeof navigator !== 'undefined' &&
      navigator.geolocation
    ) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          SpiritualConfigService.updateConfig({
            latitude: Math.round(pos.coords.latitude * 10000) / 10000,
            longitude: Math.round(pos.coords.longitude * 10000) / 10000,
            cityName: 'Local Position (GPS)'
          });
        },
        () => {},
        { timeout: 7000 }
      );
    }

    // 5. Start real-time sound triggering ticker (checks every 3 seconds)
    if (this.tickerTimer) clearInterval(this.tickerTimer);
    this.tickerTimer = setInterval(() => {
      this.checkSoundTriggerTicker();
    }, 3000);

    // 6. Start Google Calendar deadlines monitor (checks every 60 seconds)
    if (this.calendarTimer) clearInterval(this.calendarTimer);
    this.calendarTimer = setInterval(() => {
      this.pollCalendarDeadlines();
    }, 60000);

    // Initial check
    this.checkSoundTriggerTicker();
    this.notifySubscribers();
  }

  /**
   * Main real-time ticker: Distinguishes between Islamic Adhan and Christian Chimes
   * based on calculated local prayer times and user tradition configuration.
   */
  private checkSoundTriggerTicker() {
    const config = SpiritualConfigService.getConfig();
    const tradition = config.tradition;

    if (!config.soundTriggerEnabled) {
      this.notifySubscribers();
      return;
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentMinsFromMidnight = currentHours * 60 + currentMinutes;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // A. ISLAMIC USERS: Calculate local prayer times and trigger actual Adhan
    if (tradition === 'islamic' || tradition === null) {
      const prayerTimes = this.calculateTimes(now);
      const schedule = this.buildIslamicSchedule(prayerTimes, currentMinsFromMidnight);

      const canonicalPrayers: ('Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha')[] = [
        'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'
      ];

      canonicalPrayers.forEach((pName) => {
        const item = schedule.find((s) => s.name === pName);
        if (!item) return;

        // Check if current clock minute matches calculated prayer minute
        if (item.minutesFromMidnight === currentMinsFromMidnight) {
          const triggerKey = `islamic_${pName}_${dateStr}_${item.time}`;

          if (this.lastTriggeredKey !== triggerKey) {
            this.lastTriggeredKey = triggerKey;
            localStorage.setItem(STORAGE_KEY_LAST_TRIGGERED, triggerKey);
            this.executeIslamicAdhanTrigger(pName, item.time, config);
          }
        }
      });
    }

    // B. CHRISTIAN USERS: Calculate local canonical watch times and trigger actual Chimes
    if (tradition === 'christian') {
      const watches = this.calculateChristianWatches(now);

      watches.forEach((watch) => {
        if (watch.minutesFromMidnight === currentMinsFromMidnight) {
          const triggerKey = `christian_${watch.id}_${dateStr}_${watch.timeString}`;

          if (this.lastTriggeredKey !== triggerKey) {
            this.lastTriggeredKey = triggerKey;
            localStorage.setItem(STORAGE_KEY_LAST_TRIGGERED, triggerKey);
            this.executeChristianChimeTrigger(watch, config);
          }
        }
      });
    }

    this.notifySubscribers();
  }

  /**
   * Sound-Triggering System: Executes Actual Adhan for Islamic users
   */
  private executeIslamicAdhanTrigger(prayerName: string, prayerTime: string, config: SpiritualUserConfig) {
    console.log(`[SpiritualNotificationEngine] 🕌 Executing Islamic Adhan Sound for ${prayerName} at ${prayerTime}`);

    // 1. Play Actual Melodic Adhan Audio
    try {
      SpiritualAudio.play(config.islamicRingtone || 'adhan_makkah', config.audioVolume);
    } catch (e) {
      console.error('[SpiritualNotificationEngine] Adhan sound playback error:', e);
    }

    // 2. Dispatch Browser Notification
    if (config.notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`Adhan: Dedicated ${prayerName} Prayer Time`, {
            body: `Canonical prayer time has arrived for ${config.cityName} (${prayerTime}). Cease distraction and enter sacred presence.`,
            icon: '/favicon.ico',
            tag: `adhan-${prayerName}`,
            requireInteraction: true
          });
        } catch (e) {}
      }
    }

    // 3. Auxiliary deep work lockdown during prayer window
    if (config.autoLockdownEnabled) {
      try {
        const blocked = JSON.parse(localStorage.getItem('sdc_blocked_packages_v1') || '[]');
        const packages = blocked.length > 0 ? blocked.join(',') : '';
        DisciplineBridge.initiateLockdown(15, packages);
      } catch (e) {}
    }

    // 4. Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('spiritual-sound-triggered', {
          detail: {
            tradition: 'islamic',
            name: prayerName,
            time: prayerTime,
            sound: config.islamicRingtone
          }
        })
      );
    }

    this.notifySubscribers();
  }

  /**
   * Sound-Triggering System: Executes Notification Chimes for Christian users
   */
  private executeChristianChimeTrigger(watch: CalculatedChristianWatch, config: SpiritualUserConfig) {
    console.log(`[SpiritualNotificationEngine] ⛪ Executing Christian Chime Sound for ${watch.name} at ${watch.timeString}`);

    // 1. Play Cathedral Bronze Church Bell or configured sacred chime
    try {
      SpiritualAudio.play(config.christianChime || 'church_bell', config.audioVolume);
    } catch (e) {
      console.error('[SpiritualNotificationEngine] Christian chime sound playback error:', e);
    }

    // 2. Dispatch Browser Notification
    if (config.notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`Canonical Watch: ${watch.name} (${watch.timeString})`, {
            body: `${watch.theme} — "${watch.scripture}". Enter consecrated contemplation.`,
            icon: '/favicon.ico',
            tag: `christian-watch-${watch.id}`,
            requireInteraction: true
          });
        } catch (e) {}
      }
    }

    // 3. Auxiliary deep work lockdown during watch window
    if (config.autoLockdownEnabled) {
      try {
        const blocked = JSON.parse(localStorage.getItem('sdc_blocked_packages_v1') || '[]');
        const packages = blocked.length > 0 ? blocked.join(',') : '';
        DisciplineBridge.initiateLockdown(15, packages);
      } catch (e) {}
    }

    // 4. Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('spiritual-sound-triggered', {
          detail: {
            tradition: 'christian',
            name: watch.name,
            time: watch.timeString,
            sound: config.christianChime
          }
        })
      );
    }

    this.notifySubscribers();
  }

  /**
   * Calculate Christian Canonical Prayer Watches based on calculated local solar day
   * or traditional canonical watch milestones
   */
  public calculateChristianWatches(date: Date = new Date()): CalculatedChristianWatch[] {
    const config = SpiritualConfigService.getConfig();
    const prayerTimes = this.calculateTimes(date);
    const nowMins = date.getHours() * 60 + date.getMinutes();

    // Map watches to calculated solar markers or canonical hours
    const sunriseMins = PrayerCalculationEngine.timeStringToMinutes(prayerTimes.sunrise);
    const noonMins = PrayerCalculationEngine.timeStringToMinutes(prayerTimes.dhuhr);
    const sunsetMins = PrayerCalculationEngine.timeStringToMinutes(prayerTimes.maghrib);

    const formatMinsTo12 = (totalMins: number): string => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = Math.floor(totalMins % 60);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    const watchesData = [
      {
        id: 'matins',
        name: 'Matins (Morning Watch)',
        canonicalHour: '06:00 AM',
        solarMins: config.useCalculatedSolarWatches ? sunriseMins : 6 * 60,
        theme: 'Spiritual Awakening, Consecration & First Fruits',
        scripture: 'Psalm 5:3'
      },
      {
        id: 'terce',
        name: 'Terce (The Third Hour)',
        canonicalHour: '09:00 AM',
        solarMins: config.useCalculatedSolarWatches ? Math.round((sunriseMins + noonMins) / 2) : 9 * 60,
        theme: 'Holy Spirit Guidance & Fortitude at Work',
        scripture: 'Acts 2:15'
      },
      {
        id: 'sext',
        name: 'Sext (Midday Watch)',
        canonicalHour: '12:00 PM',
        solarMins: config.useCalculatedSolarWatches ? noonMins : 12 * 60,
        theme: 'Shield against Midday Lethargy & Kingdom Peace',
        scripture: 'Acts 10:9'
      },
      {
        id: 'none',
        name: 'None (The Ninth Hour)',
        canonicalHour: '03:00 PM',
        solarMins: config.useCalculatedSolarWatches ? Math.round((noonMins + sunsetMins) / 2) : 15 * 60,
        theme: 'Hour of Mercy, Deliverance & Covenant Faithfulness',
        scripture: 'Acts 3:1'
      },
      {
        id: 'vespers',
        name: 'Vespers (Evening Watch)',
        canonicalHour: '06:00 PM',
        solarMins: config.useCalculatedSolarWatches ? sunsetMins : 18 * 60,
        theme: 'Thanksgiving, Household Blessing & Work Sabbath',
        scripture: 'Psalm 141:2'
      },
      {
        id: 'compline',
        name: 'Compline (Night Watch Vigil)',
        canonicalHour: '09:00 PM',
        solarMins: config.useCalculatedSolarWatches ? 21 * 60 : 21 * 60,
        theme: 'Nightly Covenant, Guardian Rest & Surrender',
        scripture: 'Psalm 91:1-2'
      }
    ];

    return watchesData.map((w) => {
      const mins = w.solarMins;
      const timeStr = formatMinsTo12(mins);
      return {
        id: w.id,
        name: w.name,
        canonicalHour: w.canonicalHour,
        timeString: timeStr,
        minutesFromMidnight: mins,
        theme: w.theme,
        scripture: w.scripture,
        isPassed: nowMins > mins,
        isNext: false
      };
    });
  }

  // Poll Google Calendar deadlines (continuity support)
  private async pollCalendarDeadlines() {
    try {
      if (GoogleServiceBridge.isAuthenticated()) {
        const events = await GoogleServiceBridge.fetchCalendarEvents();
        const now = Date.now();
        events.forEach((ev) => {
          if (ev.start?.dateTime) {
            const startTime = new Date(ev.start.dateTime).getTime();
            if (startTime > now && startTime - now <= 300000) {
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Google Calendar Event Starting', {
                  body: ev.summary || 'Upcoming event scheduled.',
                  icon: '/favicon.ico'
                });
              }
            }
          }
        });
      }
    } catch (e) {}
  }

  // Calculation helpers
  public calculateTimes(date: Date = new Date()): PrayerTimesResult {
    const config = SpiritualConfigService.getConfig();
    return PrayerCalculationEngine.calculatePrayerTimes(
      config.latitude,
      config.longitude,
      date
    );
  }

  public buildIslamicSchedule(times: PrayerTimesResult, currentMinsFromMidnight: number): PrayerScheduleItem[] {
    const list: { name: PrayerScheduleItem['name']; str: string; isPrayer: boolean }[] = [
      { name: 'Fajr', str: times.fajr, isPrayer: true },
      { name: 'Sunrise', str: times.sunrise, isPrayer: false },
      { name: 'Dhuhr', str: times.dhuhr, isPrayer: true },
      { name: 'Asr', str: times.asr, isPrayer: true },
      { name: 'Maghrib', str: times.maghrib, isPrayer: true },
      { name: 'Isha', str: times.isha, isPrayer: true }
    ];

    return list.map((item) => {
      const mins = PrayerCalculationEngine.timeStringToMinutes(item.str);
      return {
        name: item.name,
        time: item.str,
        minutesFromMidnight: mins,
        isPrayer: item.isPrayer,
        enabled: true,
        passed: currentMinsFromMidnight > mins,
        isNext: item.name === times.nextPrayer.name
      };
    });
  }

  /**
   * Manual Sound Trigger for testing and sound verification
   */
  public triggerManualSound(overrideTradition?: 'islamic' | 'christian') {
    const config = SpiritualConfigService.getConfig();
    const targetTradition = overrideTradition || config.tradition || 'islamic';

    if (targetTradition === 'islamic') {
      SpiritualAudio.play(config.islamicRingtone || 'adhan_makkah', config.audioVolume);
    } else {
      SpiritualAudio.play(config.christianChime || 'church_bell', config.audioVolume);
    }
  }

  public stopSound() {
    SpiritualAudio.stopAll();
    this.notifySubscribers();
  }

  public setLocation(latitude: number, longitude: number, cityName?: string, isGPS: boolean = false) {
    SpiritualConfigService.updateConfig({
      latitude: Math.round(latitude * 10000) / 10000,
      longitude: Math.round(longitude * 10000) / 10000,
      cityName: cityName || 'Custom Location'
    });
    this.checkSoundTriggerTicker();
  }

  public getState(): SpiritualNotificationState {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const config = SpiritualConfigService.getConfig();
    const tradition = config.tradition;
    const prayerTimes = this.calculateTimes(now);
    const schedule = this.buildIslamicSchedule(prayerTimes, currentMins);
    const christianWatches = this.calculateChristianWatches(now);

    // Compute next event
    let nextEvent = {
      name: prayerTimes.nextPrayer.name,
      time: prayerTimes.nextPrayer.time,
      minutesRemaining: prayerTimes.nextPrayer.minutesRemaining,
      tradition: (tradition || 'islamic') as 'islamic' | 'christian'
    };

    if (tradition === 'christian') {
      const upcoming = christianWatches.find((w) => !w.isPassed) || christianWatches[0];
      const diff = upcoming.minutesFromMidnight >= currentMins
        ? upcoming.minutesFromMidnight - currentMins
        : 1440 - currentMins + upcoming.minutesFromMidnight;

      nextEvent = {
        name: upcoming.name,
        time: upcoming.timeString,
        minutesRemaining: diff,
        tradition: 'christian'
      };
    }

    return {
      config,
      tradition,
      prayerTimes,
      schedule,
      christianWatches,
      nextEvent,
      lastTriggeredKey: this.lastTriggeredKey,
      isPlayingSound: SpiritualAudio.getIsPlaying(),
      soundTriggerActive: config.soundTriggerEnabled
    };
  }

  public subscribe(listener: (state: SpiritualNotificationState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        console.error('[SpiritualNotificationEngine] Listener error:', e);
      }
    });
  }
}

export const SpiritualNotifications = new SpiritualNotificationEngine();
