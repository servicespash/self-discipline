// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { Plus } from 'lucide-react';
import { TaskItem } from '../TaskWidget';

interface AddTaskFormProps {
  title: string;
  setTitle: (t: string) => void;
  date: string;
  setDate: (d: string) => void;
  start: string;
  setStart: (s: string) => void;
  end: string;
  setEnd: (e: string) => void;
  category: TaskItem['category'];
  setCategory: (c: TaskItem['category']) => void;
  priority: TaskItem['priority'];
  setPriority: (p: TaskItem['priority']) => void;
  rule: string;
  setRule: (r: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
  title, setTitle, date, setDate, start, setStart, end, setEnd,
  category, setCategory, priority, setPriority, rule, setRule, onSubmit
}) => (
  <form onSubmit={onSubmit} className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800 space-y-3">
    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
      <Plus size={12} className="text-emerald-400" /> Schedule Task on Calendar
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What task needs focused execution?"
        className="md:col-span-5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="md:col-span-3 bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:border-emerald-500"
      />

      <div className="md:col-span-2 flex items-center gap-1">
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-1/2 bg-gray-900 border border-gray-800 rounded-xl px-1.5 py-2 text-xs text-gray-300 font-mono text-center"
        />
        <span className="text-gray-600 text-xs">-</span>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
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
        value={category}
        onChange={(e: any) => setCategory(e.target.value)}
        className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 font-bold uppercase"
      >
        <option value="deep_work">Deep Work</option>
        <option value="architecture">Architecture</option>
        <option value="engineering">Engineering</option>
        <option value="spiritual">Spiritual Watch</option>
        <option value="fitness">Physical Conditioning</option>
      </select>

      <select
        value={priority}
        onChange={(e: any) => setPriority(e.target.value)}
        className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-emerald-400 font-bold uppercase"
      >
        <option value="critical">Critical Priority</option>
        <option value="high">High Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="low">Low Priority</option>
      </select>

      <select
        value={rule}
        onChange={(e) => setRule(e.target.value)}
        className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-purple-400 font-bold uppercase"
      >
        <option value="">No Lockdown</option>
        <option value="social_media_block">Lockdown Social Media</option>
        <option value="focus_tone">Lockdown + 432Hz Tone</option>
      </select>
    </div>
  </form>
);
