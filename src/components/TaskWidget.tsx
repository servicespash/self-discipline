/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Solidified Hybrid Task & Operation Log Widget
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, RefreshCw, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { DisciplineBridge } from '../DisciplineBridge';

interface TaskItem {
  id: string;
  title: string;
  status: 'needsAction' | 'inProgress' | 'completed';
  source: 'local' | 'cloud';
  linkedRule?: string;
}

const LOCAL_TASKS_KEY = 'sdc_local_operations_v1';

export default function TaskWidget({ accessToken }: { accessToken: string | null }) {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_TASKS_KEY);
      return saved ? JSON.parse(saved) : [
        { id: '1', title: 'Complete Cymatic Hub architecture review', status: 'needsAction', source: 'local' },
        { id: '2', title: 'Physical conditioning: Concrete dumbbell workout', status: 'needsAction', source: 'local' }
      ];
    } catch {
      return [];
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Sync to local storage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Task Storage Error:', e);
    }
  }, [tasks]);

  const fetchCloudTasks = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists/@default/tasks', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.items) {
        const cloudItems: TaskItem[] = data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          status: item.status === 'completed' ? 'completed' : 'needsAction',
          source: 'cloud'
        }));

        // Merge cloud tasks without overriding local-only tasks
        setTasks((prev) => {
          const localOnly = prev.filter((t) => t.source === 'local');
          return [...localOnly, ...cloudItems];
        });
      }
    } catch (err) {
      console.error('Cloud Task Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchCloudTasks();
    }
  }, [accessToken]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `local_${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'needsAction',
      source: 'local',
      linkedRule: selectedRule || undefined
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setSelectedRule('');
  };

  const toggleTask = (id: string, newStatus: TaskItem['status']) => {
    setTasks(tasks.map((t) => {
      if (t.id === id) {
        if (newStatus === 'inProgress' && t.linkedRule) {
           DisciplineBridge.initiateLockdown(30);
        }
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <CheckSquare size={18} className="text-emerald-400" /> Operation Log
          </h3>
          <div className="flex items-center gap-2">
            {accessToken && (
              <button 
                onClick={fetchCloudTasks}
                disabled={loading}
                className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-emerald-400 transition-all disabled:opacity-50"
                title="Sync Google Tasks"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            <span className="text-[9px] font-black uppercase px-2 py-1 bg-gray-950 text-emerald-400 rounded-lg border border-gray-800">
              {tasks.filter(t => t.status === 'completed').length}/{tasks.length} Done
            </span>
          </div>
        </div>

        {/* Task Input Form */}
        <form onSubmit={addTask} className="mb-4 space-y-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New operation or task..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <select value={selectedRule} onChange={(e) => setSelectedRule(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-400">
             <option value="">No Rule Linked</option>
             <option value="sleep">Sleep Protocol</option>
          </select>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black p-2.5 rounded-xl transition-all">
            <Plus size={16} />
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {tasks.length === 0 && !loading && (
            <div className="py-8 text-center border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No active operations queued.</p>
            </div>
          )}
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3 bg-gray-950/60 rounded-xl border border-gray-800/60 hover:border-emerald-500/30 transition-all group"
            >
              <div 
                onClick={() => {
                   const nextStatus = task.status === 'needsAction' ? 'inProgress' : task.status === 'inProgress' ? 'completed' : 'needsAction';
                   toggleTask(task.id, nextStatus);
                }}
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="text-emerald-400 shrink-0" size={16}/> 
                ) : task.status === 'inProgress' ? (
                  <RefreshCw className="text-amber-400 shrink-0" size={16}/>
                ) : (
                  <Circle className="text-gray-600 group-hover:text-emerald-400/70 shrink-0" size={16}/>
                )}
                <span className={`text-xs font-semibold truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : task.status === 'inProgress' ? 'text-amber-400' : 'text-gray-200'}`}>
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {task.source === 'cloud' && (
                  <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    Cloud
                  </span>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
