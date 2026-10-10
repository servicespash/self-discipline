/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Real Calendar Room - Full Year/Month/Date Calendar Grid with Time Setup & Lockdown Integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  Zap,
  Tag,
  ArrowRight
} from 'lucide-react';
import { DisciplineBridge } from '../DisciplineBridge';
import { GoogleServiceBridge, GoogleEvent } from '../utils/GoogleServiceBridge';

export interface CalendarRoomEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: 'work' | 'spiritual' | 'fitness' | 'architecture' | 'review';
  source: 'google' | 'local';
  linkedRule?: string;
  autoLockdown?: boolean;
}

const STORAGE_KEY = 'sdc_real_calendar_events_v2';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RealCalendarRoom({ accessToken }: { accessToken: string | null }) {
  // Real date state
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Events state
  const [events, setEvents] = useState<CalendarRoomEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [
      {
        id: 'evt_1',
        title: 'Cymatic Architecture Core Review',
        dateStr: todayStr,
        startTime: '10:00',
        endTime: '11:30',
        category: 'architecture',
        source: 'local',
        linkedRule: 'social_media_block',
        autoLockdown: true
      },
      {
        id: 'evt_2',
        title: 'Physical Conditioning & Dumbbell Workout',
        dateStr: todayStr,
        startTime: '16:00',
        endTime: '17:00',
        category: 'fitness',
        source: 'local',
        linkedRule: 'focus_tone',
        autoLockdown: false
      }
    ];
  });

  // Time setup form state
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formDurationMins, setFormDurationMins] = useState(60);
  const [formCategory, setFormCategory] = useState<CalendarRoomEvent['category']>('work');
  const [formLinkedRule, setFormLinkedRule] = useState('social_media_block');
  const [formAutoLockdown, setFormAutoLockdown] = useState(true);
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save calendar events:', e);
    }
  }, [events]);

  // Sync Google Calendar events if token available
  const handleSyncGoogle = async () => {
    setSyncingGoogle(true);
    try {
      if (GoogleServiceBridge.isAuthenticated()) {
        const googleEvents = await GoogleServiceBridge.fetchCalendarEvents();
        const formatted: CalendarRoomEvent[] = googleEvents.map((g: GoogleEvent) => {
          const startDt = g.start.dateTime ? new Date(g.start.dateTime) : new Date();
          const dateStr = `${startDt.getFullYear()}-${String(startDt.getMonth() + 1).padStart(2, '0')}-${String(startDt.getDate()).padStart(2, '0')}`;
          const startTime = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;
          return {
            id: `google_${g.id}`,
            title: g.summary || 'Untitled Event',
            dateStr,
            startTime,
            endTime: '12:00',
            category: 'work',
            source: 'google',
            linkedRule: 'social_media_block',
            autoLockdown: false
          };
        });

        setEvents((prev) => {
          const localOnly = prev.filter(e => e.source === 'local');
          return [...localOnly, ...formatted];
        });
      }
    } catch (err) {
      console.warn('Google Calendar fetch note:', err);
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const pYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      days.push({
        dayNumber: pDay,
        dateStr,
        isCurrentMonth: false
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true
      });
    }

    // Trailing days from next month to complete standard 35 or 42 grid
    const remainingSlots = 42 - days.length;
    for (let n = 1; n <= (remainingSlots >= 7 ? remainingSlots - 7 : remainingSlots); n++) {
      const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dayNumber: n,
        dateStr,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Events filtered for the selected date
  const eventsForSelectedDate = useMemo(() => {
    return events.filter(e => e.dateStr === selectedDate);
  }, [events, selectedDate]);

  // Compute end time from start time and duration
  const calculatedEndTime = useMemo(() => {
    const [h, m] = formStartTime.split(':').map(Number);
    const total = (h * 60 + m + formDurationMins) % (24 * 60);
    const endH = Math.floor(total / 60);
    const endM = total % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }, [formStartTime, formDurationMins]);

  // Add event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newEvt: CalendarRoomEvent = {
      id: `evt_${Date.now()}`,
      title: formTitle.trim(),
      dateStr: selectedDate,
      startTime: formStartTime,
      endTime: calculatedEndTime,
      category: formCategory,
      source: 'local',
      linkedRule: formLinkedRule || undefined,
      autoLockdown: formAutoLockdown
    };

    setEvents(prev => [...prev, newEvt]);
    setFormTitle('');

    // If auto-lockdown and event is right now or immediate, trigger authority
    if (formAutoLockdown && formLinkedRule) {
      // Optional immediate arm
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleInstantLockdownForEvent = (event: CalendarRoomEvent) => {
    const duration = formDurationMins || 30;
    DisciplineBridge.initiateLockdown(duration, 'com.whatsapp,com.instagram.android,com.zhiliaoapp.musically');
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Real Calendar Card */}
      <div className="bg-gray-900/90 rounded-3xl border border-gray-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
        {/* Calendar Header with Year, Month, Jump to Today and Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Real Calendar
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">
                Universal Gregorian Grid • Syncs with OS Discipline Engines
              </p>
            </div>
          </div>

          {/* Month / Year Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-black text-gray-300 hover:text-white transition-all uppercase tracking-wider"
            >
              Today
            </button>
            <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-emerald-400">
                {String(currentMonth + 1).padStart(2, '0')} / {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Google Sync Button */}
            <button
              onClick={handleSyncGoogle}
              disabled={syncingGoogle}
              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition-all"
              title="Sync Google Calendar"
            >
              <RefreshCw size={15} className={syncingGoogle ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {DAYS_OF_WEEK.map((dayName, idx) => (
            <div 
              key={dayName} 
              className={`text-[10px] sm:text-xs font-black uppercase py-2 tracking-widest ${
                idx === 0 || idx === 6 ? 'text-emerald-500/70' : 'text-gray-400'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Month Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((dayObj, index) => {
            const isToday = dayObj.dateStr === todayStr;
            const isSelected = dayObj.dateStr === selectedDate;
            const dayEvents = events.filter(e => e.dateStr === dayObj.dateStr);

            return (
              <div
                key={`${dayObj.dateStr}_${index}`}
                onClick={() => setSelectedDate(dayObj.dateStr)}
                className={`min-h-[64px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : isToday
                    ? 'bg-gray-900 border-emerald-500/40 text-white'
                    : dayObj.isCurrentMonth
                    ? 'bg-gray-950/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900/60'
                    : 'bg-gray-950/20 border-gray-900/40 text-gray-600 opacity-40 hover:opacity-80'
                }`}
              >
                {/* Date Header in Cell */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-mono font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                    isToday
                      ? 'bg-emerald-500 text-gray-950 font-black shadow-md shadow-emerald-500/20'
                      : isSelected
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : dayObj.isCurrentMonth
                      ? 'text-gray-200'
                      : 'text-gray-600'
                  }`}>
                    {dayObj.dayNumber}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event previews in Day Cell */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded border leading-tight ${
                        ev.source === 'google'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          : ev.linkedRule
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                      }`}
                    >
                      {ev.startTime} {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] text-gray-500 font-black pl-1">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Below the Calendar: Comprehensive Time Setup & Protocol Scheduler */}
      <div className="bg-gray-900/90 rounded-3xl border border-gray-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Time Setup & Execution Protocol
                </h3>
                <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {selectedDate}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">
                Configure precise timeline hours, durations, and algorithmic lockdown bindings
              </p>
            </div>
          </div>
        </div>

        {/* Time Setup Form */}
        <form onSubmit={handleAddEvent} className="space-y-4 bg-gray-950/70 p-5 rounded-2xl border border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Title */}
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Operation / Event Title
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Deep Code Architecture Review"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            {/* Start Time */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Start Time
              </label>
              <input
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Duration Preset */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Duration (Ends at {calculatedEndTime})
              </label>
              <select
                value={formDurationMins}
                onChange={(e) => setFormDurationMins(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour (60m)</option>
                <option value={90}>1.5 Hours (90m)</option>
                <option value={120}>2 Hours (120m)</option>
                <option value={240}>4 Hours (240m)</option>
              </select>
            </div>
          </div>

          {/* Lockdown Rule & Category Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e: any) => setFormCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="architecture">Architecture</option>
                <option value="work">Deep Work</option>
                <option value="spiritual">Spiritual / Prayer</option>
                <option value="fitness">Conditioning</option>
                <option value="review">System Review</option>
              </select>
            </div>

            <div className="sm:col-span-5 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-400" /> Bound Lockdown Protocol
              </label>
              <select
                value={formLinkedRule}
                onChange={(e) => setFormLinkedRule(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="social_media_block">Social Media & Distraction Block</option>
                <option value="strict_lockdown">Strict OS Lockdown (Suppression Active)</option>
                <option value="focus_tone">432Hz Focus Matrix</option>
                <option value="">No Lockdown Enforced</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> Schedule Session
              </button>
            </div>
          </div>
        </form>

        {/* Scheduled Timeline List for Selected Date */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={13} className="text-emerald-400" /> Scheduled Sessions for {selectedDate} ({eventsForSelectedDate.length})
            </h4>
          </div>

          {eventsForSelectedDate.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-950/40">
              <Clock size={24} className="mx-auto text-gray-600 mb-2" />
              <p className="text-xs text-gray-400 font-bold">No sessions scheduled for this date.</p>
              <p className="text-[10px] text-gray-600 uppercase mt-0.5">Use the Time Setup above to configure events and bind lockdown triggers.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {eventsForSelectedDate.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 bg-gray-950 rounded-2xl border border-gray-800/80 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono font-black text-emerald-400 whitespace-nowrap">
                      {evt.startTime} - {evt.endTime}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {evt.title}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          evt.source === 'google'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {evt.source}
                        </span>
                      </div>

                      {evt.linkedRule && (
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                          <Lock size={10} className="text-emerald-400" />
                          Lockdown Rule: <span className="text-emerald-400">{evt.linkedRule}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {evt.linkedRule && (
                      <button
                        onClick={() => handleInstantLockdownForEvent(evt)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                        title="Engage Immediate Lockdown for Session"
                      >
                        <Zap size={11} /> Engage Lock
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
