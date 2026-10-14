// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Spatial Evolution & Room Makeover Discipline Component
 * Dedicated purely to physical workspace architecture, desk order, ergonomics, and ambient focus.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Layers, CheckCircle2, Circle, Sparkles, Plus, Trash2, Sliders, ShieldCheck } from 'lucide-react';

interface WorkspaceMilestone {
  id: string;
  label: string;
  category: 'desk' | 'ergonomics' | 'lighting' | 'cleanliness';
  completed: boolean;
}

const STORAGE_KEY = 'sdc_workspace_makeover_milestones_v2';

const DEFAULT_WORKSPACE_MILESTONES: WorkspaceMilestone[] = [
  { id: '1', label: 'Primary Desk Surface Clear & Wires Routed Below Desk', category: 'desk', completed: true },
  { id: '2', label: 'Monitor Screen at Eye-Level with 20-20-20 Focal Alignment', category: 'ergonomics', completed: true },
  { id: '3', label: 'Luminescence Tuning: 5000K Focused Daylight Bulb Positioned', category: 'lighting', completed: false },
  { id: '4', label: 'Physical Floor Cleanse & Zero Visual Clutter Radius', category: 'cleanliness', completed: false },
  { id: '5', label: 'Ergonomic Seating & Posture Lumbar Support Alignment', category: 'ergonomics', completed: false },
  { id: '6', label: 'Fresh Air Circulation & Hydration Station Set Up', category: 'cleanliness', completed: false }
];

export default function RoomMakeover({ progress }: { progress?: number }) {
  const [milestones, setMilestones] = useState<WorkspaceMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WORKSPACE_MILESTONES;
    } catch {
      return DEFAULT_WORKSPACE_MILESTONES;
    }
  });

  const [newItemText, setNewItemText] = useState('');
  const [newCategory, setNewCategory] = useState<WorkspaceMilestone['category']>('desk');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
    } catch (e) {
      console.error('Workspace Storage Error:', e);
    }
  }, [milestones]);

  const toggleMilestone = (id: string) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newMilestone: WorkspaceMilestone = {
      id: `makeover_${Date.now()}`,
      label: newItemText.trim(),
      category: newCategory,
      completed: false
    };

    setMilestones([...milestones, newMilestone]);
    setNewItemText('');
  };

  const deleteMilestone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const calculatedProgress = useMemo(() => {
    if (milestones.length === 0) return 0;
    const done = milestones.filter(m => m.completed).length;
    return Math.round((done / milestones.length) * 100);
  }, [milestones]);

  return (
    <div className="bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Camera size={18} className="text-emerald-400" /> Physical Workspace &amp; Room Makeover
          </h3>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">
            Physical environment optimization, desk decluttering &amp; spatial focus hygiene
          </p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-500/10 rounded-full text-xs font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20 self-start sm:self-auto">
          {calculatedProgress}% Spatial Order
        </div>
      </div>

      {/* Visual Workspace State Progress Bar */}
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Workspace Order Index
          </span>
          <span className="text-sm font-mono font-black text-emerald-400">{calculatedProgress}%</span>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            style={{ width: `${calculatedProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-tight z-10">
          <span>Visual Noise &amp; Friction</span>
          <span>Impenetrable Focus Sanctuary</span>
        </div>
      </div>

      {/* Add Custom Workspace Item Form */}
      <form onSubmit={handleAddMilestone} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-gray-950 rounded-2xl border border-gray-800">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="New room makeover or desk setup action..."
          className="w-full sm:flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
        <select
          value={newCategory}
          onChange={(e: any) => setNewCategory(e.target.value)}
          className="w-full sm:w-auto bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold uppercase focus:outline-none"
        >
          <option value="desk">Desk Clear</option>
          <option value="ergonomics">Ergonomics</option>
          <option value="lighting">Lighting</option>
          <option value="cleanliness">Cleanliness</option>
        </select>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 shrink-0"
        >
          <Plus size={14} /> Add Checklist Item
        </button>
      </form>

      {/* Physical Workspace Milestones Checklist */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
          <span>Physical Workspace Checklist</span>
          <span>{milestones.filter(m => m.completed).length} / {milestones.length} Completed</span>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {milestones.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleMilestone(item.id)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                item.completed
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <Circle size={16} className="text-gray-600 shrink-0" />
                )}
                <div>
                  <span className={`text-xs font-semibold ${item.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[9px] font-mono uppercase text-gray-500 mt-0.5">
                    Category: {item.category}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => deleteMilestone(item.id, e)}
                className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                title="Remove item"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
