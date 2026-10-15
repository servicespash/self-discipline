/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TaskWidget - Task Management & Calendar Integration Matrix with Supabase Persistence
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, CalendarDays, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DisciplineBridge } from '../DisciplineBridge';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { AddTaskForm } from './tasks/AddTaskForm';
import { TaskList } from './tasks/TaskList';
import { supabase } from '../utils/supabase';
import { useSession } from '../context/SessionContext';

export interface TaskItem {
  id: string;
  user_uid?: string;
  title: string;
  description?: string;
  date_str: string;
  start_time: string;
  end_time: string;
  status: 'needsAction' | 'inProgress' | 'completed' | 'pending';
  category: 'architecture' | 'engineering' | 'spiritual' | 'fitness' | 'deep_work';
  priority: 'critical' | 'high' | 'medium' | 'low';
  linked_rule?: string | null;
  source?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TaskWidget({ accessToken }: { accessToken?: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { uid } = useSession();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'tomorrow' | 'month' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    if (!uid) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_uid', uid);
      
      if (error) {
        console.error('Error fetching tasks:', error);
      } else if (data) {
        const mapped: TaskItem[] = data.map((t: any) => ({
          id: t.id,
          user_uid: t.user_uid,
          title: t.title,
          description: t.description,
          date_str: t.date_str || t.dueDate || todayStr,
          start_time: t.start_time || '09:00',
          end_time: t.end_time || '10:00',
          status: t.status === 'completed' ? 'completed' : 'needsAction',
          category: t.category || 'deep_work',
          priority: t.priority || 'medium',
          linked_rule: t.linked_rule,
          source: t.source || 'supabase'
        }));
        setTasks(mapped);
      }
    };

    fetchTasks();

    const handleRefresh = () => fetchTasks();
    window.addEventListener('cymatic-tasks-refresh', handleRefresh);
    return () => window.removeEventListener('cymatic-tasks-refresh', handleRefresh);
  }, [uid, todayStr]);

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

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(todayStr);
  const [newTaskStart, setNewTaskStart] = useState('09:00');
  const [newTaskEnd, setNewTaskEnd] = useState('10:00');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskItem['category']>('deep_work');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem['priority']>('high');
  const [newTaskRule, setNewTaskRule] = useState('');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTaskRecord = {
      user_uid: uid || 'local-user',
      title: newTaskTitle.trim(),
      date_str: newTaskDate,
      start_time: newTaskStart,
      end_time: newTaskEnd,
      status: 'needsAction',
      category: newTaskCategory,
      priority: newTaskPriority,
      linked_rule: newTaskRule || null,
      source: 'supabase'
    };

    if (uid) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTaskRecord])
        .select();

      if (error) {
        console.error('Error inserting task into Supabase:', error);
      } else if (data && data[0]) {
        const t = data[0];
        const formatted: TaskItem = {
          id: t.id,
          user_uid: t.user_uid,
          title: t.title,
          date_str: t.date_str || newTaskDate,
          start_time: t.start_time || newTaskStart,
          end_time: t.end_time || newTaskEnd,
          status: t.status,
          category: t.category || newTaskCategory,
          priority: t.priority || newTaskPriority,
          linked_rule: t.linked_rule,
          source: 'supabase'
        };
        setTasks([formatted, ...tasks]);
      }
    } else {
      const localItem: TaskItem = {
        id: `task_${Date.now()}`,
        title: newTaskTitle.trim(),
        date_str: newTaskDate,
        start_time: newTaskStart,
        end_time: newTaskEnd,
        status: 'needsAction',
        category: newTaskCategory,
        priority: newTaskPriority,
        linked_rule: newTaskRule || null,
        source: 'local'
      };
      setTasks([localItem, ...tasks]);
    }

    setNewTaskTitle('');
    if (newTaskRule && newTaskDate === todayStr) {
      const blocked = JSON.parse(localStorage.getItem('sdc_blocked_packages_v1') || '[]');
      const packages = blocked.length > 0 ? blocked.join(',') : '';
      DisciplineBridge.initiateLockdown(30, packages);
    }
  };

  const toggleTaskStatus = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const nextStatus = target.status === 'completed' ? 'needsAction' : 'completed';

    if (uid && !id.startsWith('task_')) {
      await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', id);
    }

    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const deleteTask = async (id: string) => {
    if (uid && !id.startsWith('task_')) {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
    }
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterMode === 'today' && t.date_str !== todayStr) return false;
      if (filterMode === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        if (t.date_str !== tomorrowStr) return false;
      }
      if (filterMode === 'custom' && t.date_str !== selectedDate) return false;
      if (filterMode === 'month') {
        const parts = (t.date_str || '').split('-');
        if (parts.length === 3) {
          const taskYear = parseInt(parts[0], 10);
          const taskMonth = parseInt(parts[1], 10) - 1;
          if (taskYear !== selectedYear || taskMonth !== selectedMonth) return false;
        }
      }

      if (timeRangeFilter !== 'all') {
        const hour = parseInt((t.start_time || '09:00').split(':')[0], 10);
        if (timeRangeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (timeRangeFilter === 'afternoon' && (hour < 12 || hour >= 17)) return false;
        if (timeRangeFilter === 'evening' && (hour < 17 || hour >= 24)) return false;
      }

      return true;
    });
  }, [tasks, filterMode, selectedDate, selectedMonth, selectedYear, timeRangeFilter, todayStr, today]);

  const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
  const progressPercent = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 text-gray-100 min-w-0">
      <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/40 border border-gray-800 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            <CalendarDays size={12} /> Calendar & Task Matrix
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Execution Tasks & Rules
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Synchronized with Supabase persistence and strict discipline enforcement rules.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Dashboard Overview</span> <ArrowRight size={14} />
        </button>
      </div>

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

      <TaskList
        tasks={filteredTasks}
        onToggle={toggleTaskStatus}
        onDelete={deleteTask}
      />
    </div>
  );
}
