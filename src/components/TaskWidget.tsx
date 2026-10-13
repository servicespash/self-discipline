import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, CalendarDays, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DisciplineBridge } from '../DisciplineBridge';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { AddTaskForm } from './tasks/AddTaskForm';
import { TaskList } from './tasks/TaskList';

export interface TaskItem {
  id: string;
  title: string;
  dateStr: string;
  startTime: string;
  endTime: string;
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

  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'tomorrow' | 'month' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

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

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(todayStr);
  const [newTaskStart, setNewTaskStart] = useState('09:00');
  const [newTaskEnd, setNewTaskEnd] = useState('10:00');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskItem['category']>('deep_work');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem['priority']>('high');
  const [newTaskRule, setNewTaskRule] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
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

      const existingCalStr = localStorage.getItem(CALENDAR_EVENTS_KEY);
      const existingCal = existingCalStr ? JSON.parse(existingCalStr) : [];
      const nonTaskEvents = existingCal.filter((e: any) => !e.id?.startsWith('cal_task_'));
      localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify([...nonTaskEvents, ...calendarSyncItems]));
    } catch (e) {
      console.error('Task persistence error:', e);
    }
  }, [tasks]);

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

    if (newTaskRule && newTaskDate === todayStr) {
      DisciplineBridge.initiateLockdown(30, 'com.whatsapp,com.instagram.android');
    }
  };

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

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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

      <TaskFilterBar
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        timeRangeFilter={timeRangeFilter}
        setTimeRangeFilter={setTimeRangeFilter}
        MONTH_NAMES={MONTH_NAMES}
        tasksCount={filteredTasks.length}
        progressPercent={progressPercent}
      />

      <AddTaskForm
        title={newTaskTitle}
        setTitle={setNewTaskTitle}
        date={newTaskDate}
        setDate={setNewTaskDate}
        start={newTaskStart}
        setStart={setNewTaskStart}
        end={newTaskEnd}
        setEnd={setNewTaskEnd}
        category={newTaskCategory}
        setCategory={setNewTaskCategory}
        priority={newTaskPriority}
        setPriority={setNewTaskPriority}
        rule={newTaskRule}
        setRule={setNewTaskRule}
        onSubmit={handleAddTask}
      />

      <TaskList tasks={filteredTasks} onToggle={toggleTaskStatus} onDelete={deleteTask} />
    </div>
  );
}
