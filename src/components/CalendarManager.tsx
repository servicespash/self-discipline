/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Production-Grade CalendarManager - Full Calendar Grid, Live Google Sync & Daily Discipline Lockdown Windows
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Zap,
  Globe,
  Settings,
  AlertCircle,
  Tag,
  Check
} from 'lucide-react';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { GoogleServiceBridge, GoogleEvent } from '../utils/GoogleServiceBridge';

export interface CalendarEventDisplay {
  id: string;
  summary: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  source: 'google' | 'local';
  category?: 'architecture' | 'work' | 'spiritual' | 'fitness' | 'review';
  linkedRule?: string;
  autoLockdown?: boolean;
  triggered?: boolean;
}

export interface DailyLockdownWindow {
  id: string;
  name: string;
  startTime: string; // HH:mm (e.g. "08:00")
  endTime: string; // HH:mm (e.g. "11:30")
  enabled: boolean;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  packagesProfile: 'social' | 'distraction' | 'fortress' | 'custom';
  customPackages?: string;
}

const EVENTS_STORAGE_KEY = 'sdc_calendar_manager_events_v3';
const WINDOWS_STORAGE_KEY = 'sdc_calendar_manager_lockdown_windows_v3';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_PACKAGES: Record<string, string> = {
  social: 'com.whatsapp,com.instagram.android,com.twitter.android,com.facebook.katana',
  distraction: 'com.google.android.youtube,com.zhiliaoapp.musically,com.netflix.mediaclient',
  fortress: 'com.whatsapp,com.instagram.android,com.google.android.youtube,com.tiktok,com.facebook.katana,com.twitter.android'
};

export default function CalendarManager({ accessToken }: { accessToken: string | null }) {
  // Calendar Navigation State
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Google Sync & Auth State
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(() => GoogleServiceBridge.isAuthenticated() || !!accessToken);
  const [googleSyncLoading, setGoogleSyncLoading] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');

  // Discipline Bridge State
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());

  // Events State
  const [events, setEvents] = useState<CalendarEventDisplay[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [
      {
        id: 'evt_1',
        summary: 'Deep Code Architecture Review',
        dateStr: todayStr,
        startTime: '09:00',
        endTime: '11:00',
        source: 'local',
        category: 'architecture',
        linkedRule: 'social_media_block',
        autoLockdown: true
      },
      {
        id: 'evt_2',
        summary: 'Cymatic Resonance Core Sync',
        dateStr: todayStr,
        startTime: '14:30',
        endTime: '15:30',
        source: 'local',
        category: 'work',
        linkedRule: 'focus_tone',
        autoLockdown: false
      }
    ];
  });

  // Daily Lockdown Windows State
  const [lockdownWindows, setLockdownWindows] = useState<DailyLockdownWindow[]>(() => {
    try {
      const saved = localStorage.getItem(WINDOWS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'win_1',
        name: 'Morning Deep Architecture Sprint',
        startTime: '08:30',
        endTime: '11:30',
        enabled: true,
        days: [1, 2, 3, 4, 5], // Mon-Fri
        packagesProfile: 'social'
      },
      {
        id: 'win_2',
        name: 'Nighttime Spiritual Grounding & Digital Blackout',
        startTime: '21:00',
        endTime: '23:00',
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6], // All days
        packagesProfile: 'fortress'
      }
    ];
  });

  // Event Creation Form State
  const [newSummary, setNewSummary] = useState('');
  const [newDate, setNewDate] = useState(selectedDateStr);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newCategory, setNewCategory] = useState<CalendarEventDisplay['category']>('work');
  const [newRule, setNewRule] = useState('social_media_block');
  const [newAutoLockdown, setNewAutoLockdown] = useState(true);

  // New Lockdown Window Form State
  const [newWindowName, setNewWindowName] = useState('');
  const [newWindowStart, setNewWindowStart] = useState('14:00');
  const [newWindowEnd, setNewWindowEnd] = useState('16:00');
  const [newWindowDays, setNewWindowDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newWindowProfile, setNewWindowProfile] = useState<DailyLockdownWindow['packagesProfile']>('social');

  // Active Lockdown Window Indicator State
  const [activeWindowMatch, setActiveWindowMatch] = useState<DailyLockdownWindow | null>(null);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events:', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(WINDOWS_STORAGE_KEY, JSON.stringify(lockdownWindows));
    } catch (e) {
      console.error('Failed to save lockdown windows:', e);
    }
  }, [lockdownWindows]);

  // Subscribe to DisciplineBridge
  useEffect(() => {
    const unsub = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });
    return () => unsub();
  }, []);

  // Update newDate when selectedDateStr changes
  useEffect(() => {
    setNewDate(selectedDateStr);
  }, [selectedDateStr]);

  // If accessToken prop changes, sync with bridge
  useEffect(() => {
    if (accessToken) {
      GoogleServiceBridge.setAccessToken(accessToken);
      setIsGoogleAuth(true);
    }
  }, [accessToken]);

  // Live Google Calendar Fetch
  const fetchGoogleCalendarEvents = useCallback(async () => {
    const token = GoogleServiceBridge.getAccessToken() || accessToken;
    if (!token) {
      setShowTokenModal(true);
      return;
    }

    setGoogleSyncLoading(true);
    setSyncStatusMsg('Contacting Google Workspace...');

    try {
      const gEvents = await GoogleServiceBridge.fetchCalendarEvents();
      const mapped: CalendarEventDisplay[] = gEvents.map((item: GoogleEvent) => {
        let datePart = selectedDateStr;
        let startPart = '09:00';
        let endPart = '10:00';

        if (item.start?.dateTime) {
          const d = new Date(item.start.dateTime);
          datePart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          startPart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          const dEnd = new Date(d.getTime() + 60 * 60 * 1000);
          endPart = `${String(dEnd.getHours()).padStart(2, '0')}:${String(dEnd.getMinutes()).padStart(2, '0')}`;
        } else if (item.start?.date) {
          datePart = item.start.date;
        }

        return {
          id: `gcal_${item.id}`,
          summary: item.summary || 'Google Calendar Event',
          dateStr: datePart,
          startTime: startPart,
          endTime: endPart,
          source: 'google',
          category: 'work',
          linkedRule: 'social_media_block',
          autoLockdown: true
        };
      });

      setEvents((prev) => {
        const localEvents = prev.filter((e) => e.source === 'local');
        return [...localEvents, ...mapped];
      });

      setIsGoogleAuth(true);
      setSyncStatusMsg(`Successfully synchronized ${mapped.length} Google Calendar events.`);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } catch (err: any) {
      console.error('[CalendarManager] Google sync error:', err);
      setSyncStatusMsg('Google Session expired. Please re-authenticate.');
      setIsGoogleAuth(false);
      setShowTokenModal(true);
    } finally {
      setGoogleSyncLoading(false);
    }
  }, [accessToken, selectedDateStr]);

  // Automated Routine Engine: Monitor Daily Lockdown Windows & Event Auto-Lockdowns
  useEffect(() => {
    const evaluateLockdownTrigger = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const currentTotalMins = currentHours * 60 + currentMins;

      // 1. Evaluate Daily Lockdown Windows
      let matchingWindow: DailyLockdownWindow | null = null;
      for (const win of lockdownWindows) {
        if (!win.enabled) continue;
        if (!win.days.includes(currentDay)) continue;

        const [sH, sM] = win.startTime.split(':').map(Number);
        const [eH, eM] = win.endTime.split(':').map(Number);
        const startTotal = sH * 60 + sM;
        const endTotal = eH * 60 + eM;

        if (currentTotalMins >= startTotal && currentTotalMins < endTotal) {
          matchingWindow = win;
          break;
        }
      }

      setActiveWindowMatch(matchingWindow);

      // If within a daily window and lockdown is not currently running, trigger it
      if (matchingWindow && !lockdownState.active) {
        const [eH, eM] = matchingWindow.endTime.split(':').map(Number);
        const remainingMinutes = Math.max(5, (eH * 60 + eM) - currentTotalMins);
        const packages = PRESET_PACKAGES[matchingWindow.packagesProfile] || matchingWindow.customPackages || PRESET_PACKAGES.social;
        DisciplineBridge.initiateLockdown(remainingMinutes, packages);
      }

      // 2. Evaluate Specific Event Auto-Lockdowns
      const currentDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const nowTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}`;

      events.forEach((ev) => {
        if (ev.autoLockdown && !ev.triggered && ev.dateStr === currentDateStr) {
          if (ev.startTime === nowTimeStr) {
            const [sH, sM] = ev.startTime.split(':').map(Number);
            const [eH, eM] = ev.endTime.split(':').map(Number);
            const duration = Math.max(15, (eH * 60 + eM) - (sH * 60 + sM));
            DisciplineBridge.initiateLockdown(duration, PRESET_PACKAGES.social);
            setEvents((prev) =>
              prev.map((item) => (item.id === ev.id ? { ...item, triggered: true } : item))
            );
          }
        }
      });
    };

    evaluateLockdownTrigger();
    const interval = setInterval(evaluateLockdownTrigger, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [lockdownWindows, events, lockdownState.active]);

  // Calendar Grid Calculations
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasEvents: boolean;
      eventCount: number;
    }> = [];

    // Leading days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => e.dateStr === dateStr);
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: dayEvents.length > 0,
        eventCount: dayEvents.length
      });
    }

    // Days in current month
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => e.dateStr === dateStr);
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayFormatted,
        hasEvents: dayEvents.length > 0,
        eventCount: dayEvents.length
      });
    }

    // Trailing days for next month to complete standard 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => e.dateStr === dateStr);
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: dayEvents.length > 0,
        eventCount: dayEvents.length
      });
    }

    return cells;
  }, [currentYear, currentMonth, events, today]);

  // Handlers for month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  // Add Event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    const newEv: CalendarEventDisplay = {
      id: `local_${Date.now()}`,
      summary: newSummary.trim(),
      dateStr: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      source: 'local',
      category: newCategory,
      linkedRule: newRule,
      autoLockdown: newAutoLockdown,
      triggered: false
    };

    setEvents((prev) => [newEv, ...prev]);
    setNewSummary('');
  };

  // Delete Event
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Add Lockdown Window
  const handleAddLockdownWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWindowName.trim()) return;

    const newWin: DailyLockdownWindow = {
      id: `win_${Date.now()}`,
      name: newWindowName.trim(),
      startTime: newWindowStart,
      endTime: newWindowEnd,
      enabled: true,
      days: newWindowDays,
      packagesProfile: newWindowProfile
    };

    setLockdownWindows((prev) => [...prev, newWin]);
    setNewWindowName('');
  };

  // Toggle Window Enabled
  const handleToggleWindow = (id: string) => {
    setLockdownWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, enabled: !win.enabled } : win))
    );
  };

  // Delete Window
  const handleDeleteWindow = (id: string) => {
    setLockdownWindows((prev) => prev.filter((win) => win.id !== id));
  };

  // Manual Token Save
  const handleSaveToken = () => {
    if (!manualTokenInput.trim()) return;
    GoogleServiceBridge.setAccessToken(manualTokenInput.trim());
    setIsGoogleAuth(true);
    setShowTokenModal(false);
    setManualTokenInput('');
    fetchGoogleCalendarEvents();
  };

  // Filter events for selected date
  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => e.dateStr === selectedDateStr);
  }, [events, selectedDateStr]);

  // Selected date human-readable label
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Google Integration Bar */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CalendarDays size={20} />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">
              Calendar Manager & Discipline Windows
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Real Google Calendar synchronization, precision date grids, and automated daily OS lockdown enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Window Status Pill */}
          {activeWindowMatch && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/60 border border-red-500/40 rounded-2xl text-xs font-mono text-red-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-black uppercase text-[10px] tracking-wider">
                Lockdown Window Active: {activeWindowMatch.name} ({activeWindowMatch.startTime} - {activeWindowMatch.endTime})
              </span>
            </div>
          )}

          {/* Google Sync Button */}
          <button
            onClick={fetchGoogleCalendarEvents}
            disabled={googleSyncLoading}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
              isGoogleAuth
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                : 'bg-emerald-600 text-gray-950 hover:bg-emerald-500 shadow-emerald-950/40'
            }`}
          >
            <RefreshCw size={14} className={googleSyncLoading ? 'animate-spin' : ''} />
            {isGoogleAuth ? 'Sync Google Events' : 'Link Google Calendar'}
          </button>

          {/* Total Event Counter Badge */}
          <div className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-2xl text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{events.length}</span> Total Events
          </div>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="px-4 py-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-xs text-blue-300 flex items-center gap-2">
          <Globe size={14} className="shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Main Grid: Calendar Month Matrix (Left) & Selected Day Events (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Full Month Calendar Grid (7 Cols) */}
        <div className="lg:col-span-7 bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            {/* Header: Month / Year Navigation */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-800 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-2.5 py-1 text-[10px] font-black uppercase bg-gray-950 hover:bg-gray-800 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Row */}
            <div className="grid grid-cols-7 gap-2 text-center mb-3">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="text-[10px] font-black uppercase tracking-wider text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`relative min-h-[58px] p-2 rounded-2xl flex flex-col items-center justify-between transition-all border ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : cell.isCurrentMonth
                        ? 'bg-gray-950/70 hover:bg-gray-800/80 border-gray-800/80 text-gray-200'
                        : 'bg-gray-950/30 text-gray-600 border-transparent hover:border-gray-800'
                    } ${cell.isToday ? 'ring-1 ring-emerald-400 ring-offset-2 ring-offset-gray-950' : ''}`}
                  >
                    <span
                      className={`text-xs font-mono font-bold ${
                        cell.isToday
                          ? 'text-emerald-400'
                          : isSelected
                          ? 'text-emerald-300'
                          : cell.isCurrentMonth
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Event indicators */}
                    {cell.hasEvents && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />
                        {cell.eventCount > 1 && (
                          <span className="text-[9px] font-mono text-gray-400 leading-none">
                            {cell.eventCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Date Selector Summary Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-emerald-400" />
              Focused Date: <strong className="text-white">{formattedSelectedDate}</strong>
            </span>
            <span className="font-mono text-[11px] text-emerald-400">
              {selectedDateEvents.length} event{selectedDateEvents.length === 1 ? '' : 's'} scheduled
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Events & Quick Add Form */}
        <div className="lg:col-span-5 bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Events on {formattedSelectedDate}
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                  Synchronized with Discipline Lockdown
                </p>
              </div>

              <span className="px-2.5 py-1 bg-gray-950 border border-gray-800 rounded-xl text-xs font-mono text-emerald-400">
                {selectedDateEvents.length} items
              </span>
            </div>

            {/* Events List for Selected Date */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {selectedDateEvents.length === 0 ? (
                <div className="p-8 text-center bg-gray-950/50 rounded-2xl border border-gray-800/60 text-gray-500 space-y-2">
                  <CalendarDays size={24} className="mx-auto text-gray-600" />
                  <p className="text-xs">No events scheduled for this date.</p>
                  <p className="text-[10px] text-gray-600">Use the form below or sync Google Calendar to schedule focus sessions.</p>
                </div>
              ) : (
                selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-gray-950/80 border border-gray-800/90 rounded-2xl hover:border-gray-700 transition-all flex flex-col gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              ev.source === 'google'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {ev.source === 'google' ? 'Google Calendar' : 'Local Workspace'}
                          </span>
                          {ev.autoLockdown && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                              <Lock size={9} /> Auto-Lockdown
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {ev.summary}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete event"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-gray-900">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Clock size={12} />
                        <span>{ev.startTime} – {ev.endTime}</span>
                      </div>

                      <button
                        onClick={() => DisciplineBridge.initiateLockdown(30, PRESET_PACKAGES.social)}
                        className="px-2 py-1 bg-gray-900 hover:bg-emerald-600 hover:text-gray-950 text-gray-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-gray-800"
                      >
                        <Zap size={10} /> Engage Lock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Event Form */}
            <form onSubmit={handleAddEvent} className="p-4 bg-gray-950/90 rounded-2xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Plus size={12} className="text-emerald-400" /> Schedule Event / Focus Session
                </span>
                <span className="text-[9px] font-mono text-emerald-400">{newDate}</span>
              </div>

              <input
                type="text"
                required
                placeholder="Session or Event Title..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none transition-all"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={newAutoLockdown}
                    onChange={(e) => setNewAutoLockdown(e.target.checked)}
                    className="rounded bg-gray-900 border-gray-800 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-[10px] font-bold">Trigger Lockdown on start</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <Plus size={14} /> Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* DEDICATED CONFIGURATION AREA: DAILY 'DISCIPLINE LOCKDOWN' TIME WINDOWS */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <ShieldAlert size={20} />
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Daily Discipline Lockdown Windows
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Configure recurring daily enforcement windows. When the clock strikes these hours, DisciplineBridge automatically engages system suppression.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-950 px-4 py-2 rounded-2xl border border-gray-800 font-mono text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Windows: <strong className="text-white">{lockdownWindows.filter(w => w.enabled).length}</strong> / {lockdownWindows.length}</span>
          </div>
        </div>

        {/* Existing Lockdown Windows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lockdownWindows.map((win) => {
            const dayLabels = win.days.length === 7 ? 'Everyday' : win.days.map((d) => DAYS_OF_WEEK[d]).join(', ');
            return (
              <div
                key={win.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                  win.enabled
                    ? 'bg-gray-950/90 border-gray-800 hover:border-emerald-500/40 shadow-xl'
                    : 'bg-gray-950/40 border-gray-850 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                        win.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {win.enabled ? 'Active Window' : 'Disabled'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleWindow(win.id)}
                        className={`p-1.5 rounded-xl transition-colors ${
                          win.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-500 hover:bg-gray-800'
                        }`}
                        title={win.enabled ? 'Disable Window' : 'Enable Window'}
                      >
                        {win.enabled ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>

                      <button
                        onClick={() => handleDeleteWindow(win.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                        title="Delete window"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-white tracking-tight">{win.name}</h3>

                  <div className="mt-3 flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Clock size={14} />
                    <span className="font-bold text-white text-sm">{win.startTime}</span>
                    <span className="text-gray-600">to</span>
                    <span className="font-bold text-white text-sm">{win.endTime}</span>
                  </div>

                  <div className="mt-2 text-[10px] text-gray-400">
                    <span>Recurrence: </span>
                    <strong className="text-gray-300 font-semibold">{dayLabels}</strong>
                  </div>

                  <div className="mt-1 text-[10px] text-gray-400">
                    <span>Profile: </span>
                    <strong className="text-emerald-400 uppercase font-mono">{win.packagesProfile} suppression</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-900 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-500">Auto-Enforcement: ON</span>
                  <button
                    onClick={() => {
                      const [sH, sM] = win.startTime.split(':').map(Number);
                      const [eH, eM] = win.endTime.split(':').map(Number);
                      const diffMins = Math.max(15, (eH * 60 + eM) - (sH * 60 + sM));
                      DisciplineBridge.initiateLockdown(diffMins, PRESET_PACKAGES[win.packagesProfile]);
                    }}
                    className="px-3 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    <Zap size={11} /> Enforce Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Daily Lockdown Window Form */}
        <div className="p-6 bg-gray-950 rounded-3xl border border-gray-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-2">
            <Plus size={14} className="text-emerald-400" /> Define New Daily Lockdown Window
          </h3>

          <form onSubmit={handleAddLockdownWindow} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                Window Protocol Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Afternoon Focus Matrix"
                value={newWindowName}
                onChange={(e) => setNewWindowName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs text-white outline-none placeholder-gray-600 font-sans"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={newWindowStart}
                onChange={(e) => setNewWindowStart(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-2xl px-3 py-2.5 text-xs text-white font-mono outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={newWindowEnd}
                onChange={(e) => setNewWindowEnd(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-2xl px-3 py-2.5 text-xs text-white font-mono outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
                Suppression Level
              </label>
              <select
                value={newWindowProfile}
                onChange={(e) => setNewWindowProfile(e.target.value as any)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-2xl px-3 py-2.5 text-xs text-emerald-400 font-bold outline-none"
              >
                <option value="social">Social Apps Block</option>
                <option value="distraction">Video & Distraction</option>
                <option value="fortress">Full Fortress OS</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
              >
                <Plus size={16} /> Save Window
              </button>
            </div>
          </form>

          {/* Days of Week selector chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-2">Target Days:</span>
            {DAYS_OF_WEEK.map((d, index) => {
              const active = newWindowDays.includes(index);
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    setNewWindowDays((prev) =>
                      active ? prev.filter((i) => i !== index) : [...prev, index].sort()
                    );
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                    active
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-black'
                      : 'bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300'
                  }`}
                >
                  {d}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setNewWindowDays([0, 1, 2, 3, 4, 5, 6])}
              className="text-[9px] text-gray-400 hover:text-emerald-400 underline uppercase ml-2"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setNewWindowDays([1, 2, 3, 4, 5])}
              className="text-[9px] text-gray-400 hover:text-emerald-400 underline uppercase ml-1"
            >
              Weekdays
            </button>
          </div>
        </div>
      </div>

      {/* Manual Google OAuth Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">
                  Google Workspace Authentication
                </h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-gray-500 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              To fetch live events from your primary Google Calendar, input your Google OAuth 2.0 Access Token or authenticate via the institutional workspace credentials.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-gray-400">
                Bearer Access Token
              </label>
              <textarea
                rows={3}
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveToken}
                disabled={!manualTokenInput.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Authenticate & Fetch
              </button>
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
