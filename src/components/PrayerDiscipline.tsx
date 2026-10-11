/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unified Production-Grade Prayer & Spiritual Discipline Dashboard
 * Enforces user configuration state & storage (Islamic Salah & Qibla vs Christian Canonical Watches)
 * with actual sound-triggering system integration, real Adhan audio sessions, and hardware Qibla compass.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Flame,
  Volume2,
  Square,
  MapPin,
  RefreshCw,
  Bell,
  BellOff,
  Cross,
  Moon,
  Sparkles,
  Lock,
  Unlock,
  ChevronDown,
  Play,
  RotateCcw,
  Compass,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { DisciplineBridge } from '../DisciplineBridge';
import {
  PrayerCalculationEngine,
  CITY_PRESETS,
  CityPreset
} from '../utils/prayerCalculationService';
import {
  SpiritualAudio,
  SpiritualAudioType,
  RINGTONE_OPTIONS,
  AdhanPhrase
} from '../utils/spiritualAudioService';
import {
  SpiritualNotifications,
  CalculatedChristianWatch
} from '../utils/spiritualNotificationService';
import {
  SpiritualConfigService,
  SpiritualTradition,
  SpiritualUserConfig
} from '../utils/spiritualConfigService';
import QiblaCompass from './QiblaCompass';

interface ChristianWatch {
  id: string;
  name: string;
  canonicalHour: string;
  theme: string;
  scripture: string;
  completed: boolean;
  streak: number;
}

const DEFAULT_CHRISTIAN_WATCHES: ChristianWatch[] = [
  {
    id: 'matins',
    name: 'Matins (Morning Watch)',
    canonicalHour: '06:00 AM',
    scripture: 'Psalm 5:3 — "In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly."',
    theme: 'Spiritual Awakening, Consecration & First Fruits',
    completed: false,
    streak: 5
  },
  {
    id: 'terce',
    name: 'Terce (The Third Hour)',
    canonicalHour: '09:00 AM',
    scripture: 'Acts 2:15 — "The descent of the Holy Spirit at the third hour of the day."',
    theme: 'Holy Spirit Guidance & Fortitude at Work',
    completed: false,
    streak: 3
  },
  {
    id: 'sext',
    name: 'Sext (Midday Watch)',
    canonicalHour: '12:00 PM',
    scripture: 'Acts 10:9 — "Peter went up on the roof to pray about noon."',
    theme: 'Shield against Midday Lethargy & Kingdom Peace',
    completed: false,
    streak: 6
  },
  {
    id: 'none',
    name: 'None (The Ninth Hour)',
    canonicalHour: '03:00 PM',
    scripture: 'Acts 3:1 — "Peter and John were going up to the temple at the hour of prayer—at three in the afternoon."',
    theme: 'Hour of Mercy, Deliverance & Covenant Faithfulness',
    completed: false,
    streak: 4
  },
  {
    id: 'vespers',
    name: 'Vespers (Evening Watch)',
    canonicalHour: '06:00 PM',
    scripture: 'Psalm 141:2 — "May my prayer be set before you like incense; may the lifting up of my hands be like the evening sacrifice."',
    theme: 'Thanksgiving, Household Blessing & Work Sabbath',
    completed: false,
    streak: 7
  },
  {
    id: 'compline',
    name: 'Compline (Night Watch Vigil)',
    canonicalHour: '09:00 PM',
    scripture: 'Psalm 91:1-2 — "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty."',
    theme: 'Nightly Covenant, Guardian Rest & Surrender',
    completed: false,
    streak: 8
  }
];

const STORAGE_KEYS = {
  ISLAMIC_COMPLETION: 'sdc_islamic_completion_v2',
  CHRISTIAN_WATCHES: 'sdc_christian_watches_v2'
};

export default function PrayerDiscipline() {
  // User Configuration State (enforced from SpiritualConfigService)
  const [config, setConfig] = useState<SpiritualUserConfig>(() =>
    SpiritualConfigService.getConfig()
  );

  // Local state for GPS status
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string>('');

  // Audio Playback & Phrase Synchronization State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAdhanPhrase, setCurrentAdhanPhrase] = useState<AdhanPhrase | null>(null);

  // Islamic completed prayers mapping
  const [completedPrayers, setCompletedPrayers] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ISLAMIC_COMPLETION);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Christian watches state
  const [christianWatches, setChristianWatches] = useState<ChristianWatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHRISTIAN_WATCHES);
      return saved ? JSON.parse(saved) : DEFAULT_CHRISTIAN_WATCHES;
    } catch {
      return DEFAULT_CHRISTIAN_WATCHES;
    }
  });

  // Subscribe to central SpiritualConfigService
  useEffect(() => {
    const unsubConfig = SpiritualConfigService.subscribe(setConfig);
    return () => unsubConfig();
  }, []);

  // Subscribe to SpiritualAudio for real-time Adhan phrase updates
  useEffect(() => {
    const unsubAudio = SpiritualAudio.subscribe((playing, phrase) => {
      setIsPlayingAudio(playing);
      setCurrentAdhanPhrase(phrase || null);
    });
    return () => {
      unsubAudio();
    };
  }, []);

  // Save completion states
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ISLAMIC_COMPLETION, JSON.stringify(completedPrayers));
    } catch (e) {}
  }, [completedPrayers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHRISTIAN_WATCHES, JSON.stringify(christianWatches));
    } catch (e) {}
  }, [christianWatches]);

  // Live Islamic prayer times based on configured coordinates
  const prayerTimes = useMemo(() => {
    return PrayerCalculationEngine.calculatePrayerTimes(
      config.latitude,
      config.longitude,
      new Date()
    );
  }, [config.latitude, config.longitude]);

  // Live Christian canonical watches based on calculated solar day
  const calculatedChristianWatches = useMemo(() => {
    return SpiritualNotifications.calculateChristianWatches(new Date());
  }, [config.latitude, config.longitude, config.useCalculatedSolarWatches]);

  // Lock in user's selected tradition preference
  const handleLockInTradition = (tradition: SpiritualTradition) => {
    SpiritualConfigService.setTradition(tradition);
  };

  // Switch or unlock tradition preference
  const handleSwitchTradition = () => {
    SpiritualConfigService.resetTradition();
  };

  // GPS Auto-detect handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGPS(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        SpiritualConfigService.updateConfig({
          latitude: lat,
          longitude: lng,
          cityName: `GPS (${lat > 0 ? lat + '°N' : -lat + '°S'}, ${lng > 0 ? lng + '°E' : -lng + '°W'})`
        });
        setLocatingGPS(false);
      },
      (err) => {
        setGpsError('Unable to retrieve GPS coordinates: ' + err.message);
        setLocatingGPS(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (preset: CityPreset) => {
    SpiritualConfigService.updateConfig({
      cityName: preset.name,
      latitude: preset.lat,
      longitude: preset.lng
    });
    setGpsError('');
  };

  // Sound triggering playback & manual test triggers
  const handleToggleSoundTrigger = () => {
    SpiritualConfigService.updateConfig({
      soundTriggerEnabled: !config.soundTriggerEnabled
    });
  };

  const handleTestSoundTrigger = (tradition: 'islamic' | 'christian') => {
    if (isPlayingAudio) {
      SpiritualAudio.stopAll();
      setIsPlayingAudio(false);
    } else {
      SpiritualNotifications.triggerManualSound(tradition);
    }
  };

  const handleStopAudio = () => {
    SpiritualAudio.stopAll();
    setIsPlayingAudio(false);
  };

  // Toggle Islamic Prayer Completed
  const toggleIslamicPrayer = (name: string) => {
    setCompletedPrayers((prev) => {
      const next = !prev[name];
      if (next && config.autoLockdownEnabled) {
        DisciplineBridge.initiateLockdown(15, 'com.whatsapp,com.instagram.android');
      }
      return { ...prev, [name]: next };
    });
  };

  // Toggle Christian Watch Completed
  const toggleChristianWatch = (id: string) => {
    setChristianWatches((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const next = !w.completed;
          if (next && config.autoLockdownEnabled) {
            DisciplineBridge.initiateLockdown(15, 'com.whatsapp,com.instagram.android');
          }
          return {
            ...w,
            completed: next,
            streak: next ? w.streak + 1 : Math.max(0, w.streak - 1)
          };
        }
        return w;
      })
    );
  };

  // Calculation Metrics
  const islamicPrayersList = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha }
  ];

  const islamicDoneCount = islamicPrayersList.filter((p) => completedPrayers[p.name]).length;
  const islamicScore = Math.round((islamicDoneCount / 5) * 100);

  const christianDoneCount = christianWatches.filter((w) => w.completed).length;
  const christianScore = Math.round((christianDoneCount / christianWatches.length) * 100);

  // =========================================================================
  // VIEW 1: FAITH TRADITION SELECTION GATE (IF NOT YET CONFIGURED / UNLOCKED)
  // =========================================================================
  if (!config.tradition) {
    return (
      <div className="bg-gray-900 p-6 sm:p-10 rounded-3xl border border-gray-800 shadow-2xl space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-1">
            <HeartPulse size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            Select &amp; Lock In Spiritual Tradition
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Choose your spiritual discipline tradition. Enforcing this choice will lock your dashboard exclusively to your selected path, customizing local prayer calculations, sound triggers, and instruments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Islamic Tradition Card */}
          <div className="bg-gray-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-xl flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Moon size={24} />
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Salah &amp; Qibla
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Islamic Spiritual Discipline
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Dedicated to the 5 canonical daily prayers with astronomical solar calculations, real Adhan audio sessions, and hardware Qibla compass alignment.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-900 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>5 Daily Prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Real Qibla Compass Locator with device magnetometer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Melodic Adhan Sound Trigger at calculated prayer times</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>15-minute auxiliary deep work lockdown during prayers</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLockInTradition('islamic')}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 group-hover:scale-[1.02]"
            >
              <Lock size={14} /> Lock In Islamic Tradition <ArrowRight size={14} />
            </button>
          </div>

          {/* Christian Tradition Card */}
          <div className="bg-gray-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30 hover:border-amber-500 transition-all shadow-xl flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Cross size={24} />
                </div>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Prayer Watches
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Christian Spiritual Discipline
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Dedicated to the 6 canonical prayer watches (Matins to Compline) calculated from local solar times, scriptural meditations, and cathedral bronze watch bells.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-900 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>6 Canonical Watches (Matins, Terce, Sext, None, Vespers, Compline)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Calculated local solar watch times (Sunrise, Noon, Sunset, Night)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Cathedral Bronze Bells &amp; Sacred Chimes Sound Trigger</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Consecration streak counter &amp; scriptural meditations</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLockInTradition('christian')}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 group-hover:scale-[1.02]"
            >
              <Lock size={14} /> Lock In Christian Tradition <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ISLAMIC SPIRITUAL DASHBOARD (ENFORCED: SHOWS ONLY ISLAMIC CONTENT)
  // =========================================================================
  if (config.tradition === 'islamic') {
    const islamicRingtoneOptions = [
      { id: 'adhan_makkah' as const, label: 'Makkah Haram Adhan', desc: 'Resonant call to prayer echoing the Holy Mosque' },
      { id: 'adhan_full_session' as const, label: 'Complete Adhan Recitation', desc: 'Full canonical recitation with all phrases' },
      { id: 'adhan_short' as const, label: 'Takbir Opening Motif', desc: 'Opening double Takbir (Allahu Akbar)' }
    ];

    return (
      <div className="bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
        {/* Header with Locked Tradition Status & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <Lock size={10} /> Enforced: Islamic Tradition
              </span>
              <button
                onClick={handleSwitchTradition}
                className="text-[9px] text-gray-500 hover:text-emerald-400 underline uppercase tracking-wider cursor-pointer"
              >
                Switch Preference
              </button>
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mt-1">
              <Moon size={18} className="text-emerald-400" /> Islamic Canonical Salah &amp; Qibla
            </h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">
              Astronomical prayer calculations, actual Adhan sound triggers, and hardware Qibla compass
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl font-mono font-black text-emerald-400">{islamicScore}%</span>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Salah Alignment</p>
            </div>
          </div>
        </div>

        {/* Location & GPS Synchronization Bar */}
        <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <MapPin size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{config.cityName}</span>
                <span className="text-[10px] font-mono text-gray-500">
                  ({config.latitude.toFixed(2)}°, {config.longitude.toFixed(2)}°)
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                Local prayer times computed via astronomical solar position algorithms.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleDetectGPS}
              disabled={locatingGPS}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw size={12} className={locatingGPS ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
              {locatingGPS ? 'Locating GPS...' : 'Auto GPS'}
            </button>

            <div className="relative inline-block">
              <select
                value={config.cityName}
                onChange={(e) => {
                  const found = CITY_PRESETS.find((c) => c.name === e.target.value);
                  if (found) handleSelectCity(found);
                }}
                className="bg-gray-900 border border-gray-700 text-gray-300 text-[10px] font-bold rounded-xl px-3 py-1.5 appearance-none pr-7 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="" disabled>Select City Preset</option>
                {CITY_PRESETS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {gpsError && (
          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono">
            {gpsError}
          </div>
        )}

        {/* Next Prayer Countdown Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-gray-950 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-gray-400">Next Canonical Prayer</span>
              <p className="text-base font-black text-white">
                {prayerTimes.nextPrayer.name} at {prayerTimes.nextPrayer.time}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-mono font-black text-emerald-400">
              {Math.floor(prayerTimes.nextPrayer.minutesRemaining / 60)}h{' '}
              {prayerTimes.nextPrayer.minutesRemaining % 60}m
            </span>
            <p className="text-[9px] font-mono uppercase text-gray-500">Remaining</p>
          </div>
        </div>

        {/* ACTUAL SOUND-TRIGGERING SYSTEM CONTROL (ISLAMIC ADHAN) */}
        <div className="p-5 bg-gray-950 rounded-2xl border border-emerald-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Volume2 size={18} />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-white tracking-wider block">
                  Islamic Adhan Sound-Triggering System
                </span>
                <span className="text-[10px] text-gray-400">
                  Automatically plays authentic Adhan audio at dedicated local prayer times
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSoundTrigger}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                  config.soundTriggerEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-gray-900 text-gray-500 border-gray-800'
                }`}
              >
                {config.soundTriggerEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                {config.soundTriggerEnabled ? 'Adhan Trigger Active' : 'Sound Trigger Muted'}
              </button>

              {isPlayingAudio ? (
                <button
                  onClick={handleStopAudio}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950/50 cursor-pointer"
                >
                  <Square size={12} /> Stop Sound
                </button>
              ) : (
                <button
                  onClick={() => handleTestSoundTrigger('islamic')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  <Play size={12} /> Test Adhan Sound Trigger
                </button>
              )}
            </div>
          </div>

          {/* Active Adhan Recitation Visualizer Banner (While Playing) */}
          {isPlayingAudio && currentAdhanPhrase && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-center space-y-2 animate-pulse">
              <p className="text-xl font-serif font-bold text-emerald-300 tracking-wide font-arabic">
                {currentAdhanPhrase.arabic}
              </p>
              <p className="text-xs font-mono font-bold text-white">
                "{currentAdhanPhrase.transliteration}"
              </p>
              <p className="text-[10px] text-gray-400 italic">
                {currentAdhanPhrase.meaning}
              </p>
            </div>
          )}

          {/* Adhan Sound Mode Selection Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {islamicRingtoneOptions.map((ring) => (
              <div
                key={ring.id}
                onClick={() => {
                  SpiritualConfigService.updateConfig({ islamicRingtone: ring.id });
                  if (isPlayingAudio) SpiritualAudio.play(ring.id, config.audioVolume);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  config.islamicRingtone === ring.id
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-gray-900 border-gray-800/80 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate pr-1">{ring.label}</span>
                  {config.islamicRingtone === ring.id && (
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[9px] text-gray-500 truncate mt-0.5">{ring.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Daily Prayers Matrix Grid */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
            <span>Canonical Salah Schedule</span>
            <span>{islamicDoneCount} / 5 Prayers Secured</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {islamicPrayersList.map((prayer) => {
              const isDone = !!completedPrayers[prayer.name];
              return (
                <div
                  key={prayer.name}
                  onClick={() => toggleIslamicPrayer(prayer.name)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/20'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-900 text-gray-600 group-hover:text-emerald-400'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-black uppercase tracking-wider ${isDone ? 'text-white' : 'text-gray-200'}`}>
                          {prayer.name}
                        </p>
                        {prayer.name === 'Fajr' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-400 border border-blue-500/20 font-mono">
                            Dawn
                          </span>
                        )}
                        {prayer.name === 'Maghrib' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-500/20 font-mono">
                            Sunset
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mt-0.5 font-bold">
                        <Clock size={10} /> {prayer.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSoundTrigger('islamic');
                      }}
                      title="Preview Adhan Call"
                      className="p-1.5 text-gray-600 hover:text-emerald-400 transition-colors"
                    >
                      <Volume2 size={14} />
                    </button>

                    <span
                      className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-gray-900 text-gray-500 border-gray-800'
                      }`}
                    >
                      {isDone ? 'Secured' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REAL HARDWARE QIBLA COMPASS LOCATOR (EXCLUSIVE TO ISLAMIC MODULE) */}
        <div className="pt-2">
          <QiblaCompass
            onLocationChange={(lat, lng, city) => {
              SpiritualConfigService.updateConfig({
                latitude: lat,
                longitude: lng,
                cityName: city
              });
            }}
          />
        </div>

        {/* Auxiliary Lockdown Assurance */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex items-center gap-3 text-emerald-400">
          <ShieldCheck size={20} className="shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
            Spiritual discipline check-ins automatically trigger 15-minute auxiliary lockdown on non-essential apps to guarantee undisturbed contemplation and holy presence.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: CHRISTIAN SPIRITUAL DASHBOARD (ENFORCED: SHOWS ONLY CHRISTIAN CONTENT)
  // =========================================================================
  const christianChimeOptions = [
    { id: 'church_bell' as const, label: 'Cathedral Bronze Bell', desc: 'Deep bronze church bell with authentic overtone ring-out' },
    { id: 'sacred_harp' as const, label: 'Sacred Harp & Divine Arpeggio', desc: 'Peaceful celestial chord sequence for prayer watches' },
    { id: 'contemplative_bowl' as const, label: 'Singing Bowl & Serenity Chime', desc: 'Harmonic 432Hz meditative bell for contemplative stillness' }
  ];

  return (
    <div className="bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
      {/* Header with Locked Tradition Status & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} /> Enforced: Christian Tradition
            </span>
            <button
              onClick={handleSwitchTradition}
              className="text-[9px] text-gray-500 hover:text-amber-400 underline uppercase tracking-wider cursor-pointer"
            >
              Switch Preference
            </button>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mt-1">
            <Cross size={18} className="text-amber-400" /> Christian Canonical Prayer Watches
          </h3>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">
            Liturgy of the hours, calculated local solar watch times, and cathedral bronze watch bells
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-mono font-black text-amber-400">{christianScore}%</span>
            <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Watches Observed</p>
          </div>
        </div>
      </div>

      {/* ACTUAL SOUND-TRIGGERING SYSTEM CONTROL (CHRISTIAN CHIMES) */}
      <div className="p-5 bg-gray-950 rounded-2xl border border-amber-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Volume2 size={18} />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-white tracking-wider block">
                Christian Watch Chime Sound-Triggering System
              </span>
              <span className="text-[10px] text-gray-400">
                Automatically sounds cathedral bronze bell chimes at calculated canonical watch times
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSoundTrigger}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                config.soundTriggerEnabled
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-gray-900 text-gray-500 border-gray-800'
              }`}
            >
              {config.soundTriggerEnabled ? <Bell size={12} /> : <BellOff size={12} />}
              {config.soundTriggerEnabled ? 'Chime Trigger Active' : 'Chimes Muted'}
            </button>

            {isPlayingAudio ? (
              <button
                onClick={handleStopAudio}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950/50 cursor-pointer"
              >
                <Square size={12} /> Stop Bell
              </button>
            ) : (
              <button
                onClick={() => handleTestSoundTrigger('christian')}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer"
              >
                <Play size={12} /> Test Watch Chime Trigger
              </button>
            )}
          </div>
        </div>

        {/* Chime Sound Mode Selection Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {christianChimeOptions.map((ring) => (
            <div
              key={ring.id}
              onClick={() => {
                SpiritualConfigService.updateConfig({ christianChime: ring.id });
                if (isPlayingAudio) SpiritualAudio.play(ring.id, config.audioVolume);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                config.christianChime === ring.id
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : 'bg-gray-900 border-gray-800/80 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold truncate pr-1">{ring.label}</span>
                {config.christianChime === ring.id && (
                  <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-[9px] text-gray-500 truncate mt-0.5">{ring.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Canonical Watches Grid (With Calculated Local Solar Times) */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
          <span>Canonical Prayer Watches &amp; Liturgy</span>
          <span>{christianDoneCount} / {christianWatches.length} Watches Observed</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {christianWatches.map((watch) => {
            const calculated = calculatedChristianWatches.find((c) => c.id === watch.id);
            const displayTime = calculated?.timeString || watch.canonicalHour;

            return (
              <div
                key={watch.id}
                onClick={() => toggleChristianWatch(watch.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                  watch.completed
                    ? 'bg-amber-950/20 border-amber-500/40 text-white shadow-lg shadow-amber-950/20'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        watch.completed
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-gray-900 text-gray-600 group-hover:text-amber-400'
                      }`}
                    >
                      {watch.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-wider ${watch.completed ? 'text-white' : 'text-gray-200'}`}>
                          {watch.name}
                        </span>
                        <span className="text-[9px] px-2 py-0.2 rounded bg-gray-900 text-amber-400 border border-amber-500/30 font-mono font-bold">
                          {displayTime}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
                        {watch.theme}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-xl text-[10px] font-mono font-bold text-amber-400">
                      <Flame size={12} className="text-amber-500 fill-amber-500" /> {watch.streak}d
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                        watch.completed
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-gray-900 text-gray-500 border-gray-800'
                      }`}
                    >
                      {watch.completed ? 'Secured' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-800/60 pl-11 text-xs text-gray-400 font-serif italic">
                  "{watch.scripture}"
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auxiliary Lockdown Assurance */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex items-center gap-3 text-amber-400">
        <ShieldCheck size={20} className="shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
          Canonical prayer watch check-ins trigger 15-minute auxiliary lockdown on non-essential apps to guarantee focused scripture meditation and prayer presence.
        </p>
      </div>
    </div>
  );
}
