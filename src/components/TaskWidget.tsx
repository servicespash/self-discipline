/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unified Production-Grade Task Manager Linked to Calendar Grid
 * Supports Date, Month, and Time Range Selection & Filtering with Bidirectional Sync.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
  Filter,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DisciplineBridge } from '../DisciplineBridge';

export interface TaskItem {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'needsAction' | 'inProgress' | 'completed';
  category: 'architecture' | 'engineering' | 'spiritual' | 'fitness' | 'deep_work';
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: 'local' | 'cloud' | 'calendar';
  linkedRule?: string;
}

const LOCAL_TASKS_KEY = 'sdc_local_operations_v2';
const CALENDAR_EVENTS_KEY = 'sdc_real_calendar_events_v2';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TaskWidget({ accessToken }: { accessToken?: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  // View / Filter Selection
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'tomorrow' | 'month' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Synchronize route parameters (?date=YYYY-MM-DD, ?month=MM, ?year=YYYY, ?range=morning/afternoon/evening)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    const monthParam = params.get('month');
    const yearParam = params.get('year');
    const rangeParam = params.get('range');

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
      setFilterMode('custom');
      const parts = dateParam.split('-').map(Number);
      if (parts.length === 3) {
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1] - 1);
      }
    } else if (monthParam) {
      const parsedMonth = parseInt(monthParam, 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        setSelectedMonth(parsedMonth - 1);
        setFilterMode('month');
      }
      if (yearParam) {
        const parsedYear = parseInt(yearParam, 10);
        if (!isNaN(parsedYear)) setSelectedYear(parsedYear);
      }
    }

    if (rangeParam && ['morning', 'afternoon', 'evening', 'all'].includes(rangeParam)) {
      setTimeRangeFilter(rangeParam as any);
    }
  }, [location.search]);

  // Tasks List
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_TASKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Task load error:', e);
    }
    return [
      {
        id: 't_1',
        title: 'Review System Architecture & Core Cloudflare Headers',
        dateStr: todayStr,
        startTime: '09:00',
        endTime: '11:00',
        status: 'needsAction',
        category: 'architecture',
        priority: 'critical',
        source: 'local',
        linkedRule: 'social_media_block'
      },
      {
        id: 't_2',
        title: 'Physical Conditioning: Dumbbell Strength Protocol',
        dateStr: todayStr,
        startTime: '16:00',
        endTime: '17:00',
        status: 'needsAction',
        category: 'fitness',
        priority: 'high',
        source: 'local',
        linkedRule: 'focus_tone'
      },
      {
        id: 't_3',
        title: 'Canonical Prayer & Evening Scripture Contemplation',
        dateStr: todayStr,
        startTime: '18:00',
        endTime: '18:45',
        status: 'completed',
        category: 'spiritual',
        priority: 'medium',
        source: 'local'
      }
    ];
  });

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(todayStr);
  const [newTaskStart, setNewTaskStart] = useState('09:00');
  const [newTaskEnd, setNewTaskEnd] = useState('10:00');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskItem['category']>('deep_work');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem['priority']>('high');
  const [newTaskRule, setNewTaskRule] = useState('');

  // Persist tasks and bidirectional sync to calendar storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));

      // Also ensure tasks with times reflect into calendar events storage
      const calendarSyncItems = tasks.map((t) => ({
        id: `cal_task_${t.id}`,
        title: `[Task] ${t.title}`,
        summary: `[Task] ${t.title}`,
        dateStr: t.dateStr,
        startTime: t.startTime,
        endTime: t.endTime,
        category: t.category,
        source: t.source,
        linkedRule: t.linkedRule,
        autoLockdown: !!t.linkedRule
      }));

      // Merge with existing calendar events
      const existingCalStr = localStorage.getItem(CALENDAR_EVENTS_KEY);
      const existingCal = existingCalStr ? JSON.parse(existingCalStr) : [];
      const nonTaskEvents = existingCal.filter((e: any) => !e.id?.startsWith('cal_task_'));
      localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify([...nonTaskEvents, ...calendarSyncItems]));
    } catch (e) {
      console.error('Task persistence error:', e);
    }
  }, [tasks]);

  // Add Task Handler
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      dateStr: newTaskDate,
      startTime: newTaskStart,
      endTime: newTaskEnd,
      status: 'needsAction',
      category: newTaskCategory,
      priority: newTaskPriority,
      source: 'local',
      linkedRule: newTaskRule || undefined
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');

    // Trigger lockdown if requested immediately
    if (newTaskRule && newTaskDate === todayStr) {
      DisciplineBridge.initiateLockdown(30, 'com.whatsapp,com.instagram.android');
    }
  };

  // Toggle Task Status
  const toggleTaskStatus = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'needsAction' : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Filter Tasks by Date, Month, and Time Range
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Date / Month Filter
      if (filterMode === 'today' && t.dateStr !== todayStr) return false;
      if (filterMode === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        if (t.dateStr !== tomorrowStr) return false;
      }
      if (filterMode === 'custom' && t.dateStr !== selectedDate) return false;
      if (filterMode === 'month') {
        const parts = t.dateStr.split('-');
        if (parts.length === 3) {
          const taskYear = parseInt(parts[0], 10);
          const taskMonth = parseInt(parts[1], 10) - 1;
          if (taskYear !== selectedYear || taskMonth !== selectedMonth) return false;
        }
      }

      // 2. Time Range Filter
      if (timeRangeFilter !== 'all') {
        const hour = parseInt(t.startTime.split(':')[0], 10);
        if (timeRangeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (timeRangeFilter === 'afternoon' && (hour < 12 || hour >= 17)) return false;
        if (timeRangeFilter === 'evening' && (hour < 17 || hour >= 24)) return false;
      }

      return true;
    });
  }, [tasks, filterMode, selectedDate, selectedMonth, selectedYear, timeRangeFilter, todayStr, today]);

  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const progressPercent = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <div className="bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
      {/* Header & Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" /> Task Manager &amp; Calendar Matrix
          </h3>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">
            Scheduled execution linked bi-directionally with the Real Calendar Grid
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/calendar?date=${selectedDate}`)}
            className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <CalendarDays size={14} /> Open in Calendar <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Date & Month Selection Filter Bar */}
      <div className="space-y-3 p-4 bg-gray-950 rounded-2xl border border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setFilterMode('today'); setSelectedDate(todayStr); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'today'
                  ? 'bg-emerald-600 text-gray-950 font-black'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterMode('tomorrow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'tomorrow'
                  ? 'bg-emerald-600 text-gray-950 font-black'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'month'
                  ? 'bg-emerald-600 text-gray-950 font-black'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              This Month ({MONTH_NAMES[selectedMonth]})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-emerald-600 text-gray-950 font-black'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              All Dates
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">Time Window:</span>
            <select
              value={timeRangeFilter}
              onChange={(e: any) => setTimeRangeFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
            >
              <option value="all">All Hours</option>
              <option value="morning">Morning (06:00 - 12:00)</option>
              <option value="afternoon">Afternoon (12:00 - 17:00)</option>
              <option value="evening">Evening (17:00 - 24:00)</option>
            </select>
          </div>
        </div>

        {/* Date & Month Precision Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-900 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono text-[11px]">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setFilterMode('custom');
              }}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {filterMode === 'month' && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono text-[11px]">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1 text-white font-bold text-xs"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1 text-white font-bold text-xs"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          )}

          <div className="text-[11px] font-mono text-gray-400">
            Showing <strong className="text-white">{filteredTasks.length}</strong> tasks ({progressPercent}% complete)
          </div>
        </div>
      </div>

      {/* Add New Task Form */}
      <form onSubmit={handleAddTask} className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 space-y-3">
        <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Plus size={12} className="text-emerald-400" /> Schedule Task on Calendar
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What task needs focused execution?"
            className="md:col-span-5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />

          <input
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="md:col-span-3 bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-emerald-500"
          />

          <div className="md:col-span-2 flex items-center gap-1">
            <input
              type="time"
              value={newTaskStart}
              onChange={(e) => setNewTaskStart(e.target.value)}
              className="w-1/2 bg-gray-900 border border-gray-800 rounded-xl px-1.5 py-2 text-xs text-gray-300 font-mono text-center"
            />
            <span className="text-gray-600 text-xs">-</span>
            <input
              type="time"
              value={newTaskEnd}
              onChange={(e) => setNewTaskEnd(e.target.value)}
              className="w-1/2 bg-gray-900 border border-gray-800 rounded-xl px-1.5 py-2 text-xs text-gray-300 font-mono text-center"
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 py-2"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <select
            value={newTaskCategory}
            onChange={(e: any) => setNewTaskCategory(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 font-bold uppercase"
          >
            <option value="deep_work">Deep Work</option>
            <option value="architecture">Architecture</option>
            <option value="engineering">Engineering</option>
            <option value="spiritual">Spiritual Watch</option>
            <option value="fitness">Physical Conditioning</option>
          </select>

          <select
            value={newTaskPriority}
            onChange={(e: any) => setNewTaskPriority(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-emerald-400 font-bold uppercase"
          >
            <option value="critical">Critical Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={newTaskRule}
            onChange={(e) => setNewTaskRule(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-purple-400 font-bold uppercase"
          >
            <option value="">No Lockdown</option>
            <option value="social_media_block">Lockdown Social Media</option>
            <option value="focus_tone">Lockdown + 432Hz Tone</option>
          </select>
        </div>
      </form>

      {/* Task List Items */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs border border-dashed border-gray-800 rounded-2xl">
            No scheduled tasks found for this date/time window. Click "Add Task" to schedule focused execution.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                onClick={() => toggleTaskStatus(task.id)}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-900 text-gray-600 group-hover:text-emerald-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isDone ? 'line-through text-gray-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {task.dateStr}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {task.startTime} - {task.endTime}
                      </span>
                      <span>•</span>
                      <span className="text-gray-400 uppercase font-bold text-[9px]">{task.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {task.linkedRule && (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                      <ShieldCheck size={10} /> Lockdown
                    </span>
                  )}

                  <span
                    className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                      task.priority === 'critical'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : task.priority === 'high'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-gray-900 text-gray-400 border-gray-800'
                    }`}
                  >
                    {task.priority}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
