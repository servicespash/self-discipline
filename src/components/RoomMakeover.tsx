/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Solidified Workspace Evolution & Physical Discipline Component
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Layers, CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface Milestone {
  id: string;
  label: string;
  completed: boolean;
}

const STORAGE_KEY = 'sdc_workspace_milestones_v1';

const INITIAL_MILESTONES: Milestone[] = [
  { id: '1', label: 'Main Desk Clear & Wire Cable Management', completed: true },
  { id: '2', label: 'Concrete Dumbbell Training Station Setup', completed: false },
  { id: '3', label: 'Termux / Cloudflare Deployment Station', completed: false },
  { id: '4', label: 'Acoustic / Cymatic Sound Frequency Tuning', completed: false }
];

export default function RoomMakeover({ progress }: { progress?: number }) {
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MILESTONES;
    } catch {
      return INITIAL_MILESTONES;
    }
  });

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

  const calculatedProgress = useMemo(() => {
    if (milestones.length === 0) return 0;
    const done = milestones.filter(m => m.completed).length;
    return Math.round((done / milestones.length) * 100);
  }, [milestones]);

  return (
    <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Camera size={18} className="text-emerald-400" /> Spatial Evolution
        </h3>
        <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
          {calculatedProgress}% Structuring
        </div>
      </div>

      {/* Visual Progress Bar Container */}
      <div className="relative h-20 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center z-10">
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Physical Workspace State</span>
          <span className="text-xs font-black text-emerald-400">{calculatedProgress}%</span>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            style={{ width: `${calculatedProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-tighter z-10">
          <span>Chaos / Unorganized</span>
          <span>Architect Command Center</span>
        </div>
      </div>

      {/* Physical Workspace Milestones */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Physical Workspace Checklist</h4>
        {milestones.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleMilestone(item.id)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              item.completed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <span className="text-xs font-semibold truncate pr-2">{item.label}</span>
            {item.completed ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <Circle size={16} className="text-gray-600 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
