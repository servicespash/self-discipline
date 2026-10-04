/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Solidified Goal Architecture & Rule Configuration Engine
 */

import React, { useState, useEffect } from 'react';
import { Target, Trash2, ShieldAlert, Plus, Calendar, DollarSign, Zap, CheckCircle2, Circle, Lock } from 'lucide-react';

export type GoalType = 'financial' | 'timeline' | 'discipline';

export interface ObjectiveGoal {
  id: string;
  title: string;
  type: GoalType;
  priority: 'high' | 'medium' | 'low';
  startDate?: string;
  endDate?: string;
  targetAmount?: number; // UGX
  currentAmount?: number; // UGX
  completed: boolean;
}

export interface SystemRules {
  sleepSchedule: string;
  restrictedApps: string;
  dailyProtocol: string;
  lockdownDurationDays?: number;
}

const GOALS_STORAGE_KEY = 'sdc_goals_v2';
const RULES_STORAGE_KEY = 'sdc_system_rules_v1';

const INITIAL_GOALS: ObjectiveGoal[] = [
  {
    id: 'goal_1',
    title: 'Deploy Cymatic Hub & Resonance Core Modules',
    type: 'timeline',
    priority: 'high',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    completed: false
  },
  {
    id: 'goal_2',
    title: 'Workstation RAM & Hardware Upgrade',
    type: 'financial',
    priority: 'high',
    targetAmount: 350000,
    currentAmount: 120000,
    completed: false
  }
];

const INITIAL_RULES: SystemRules = {
  sleepSchedule: 'Sleep at 23:00, Awake at 05:00',
  restrictedApps: 'WhatsApp, Social Media, Streaming, Non-essential Web',
  dailyProtocol: 'Fajr -> Concrete Dumbbell Workout -> Code Cymatic Engine -> Night Review',
  lockdownDurationDays: 7
};

export default function GoalSetting() {
  const [goals, setGoals] = useState<ObjectiveGoal[]>(() => {
    try {
      const saved = localStorage.getItem(GOALS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [rules, setRules] = useState<SystemRules>(() => {
    try {
      const saved = localStorage.getItem(RULES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_RULES;
    } catch {
      return INITIAL_RULES;
    }
  });

  // Form Input States
  const [titleInput, setTitleInput] = useState('');
  const [typeInput, setTypeInput] = useState<GoalType>('timeline');
  const [priorityInput, setPriorityInput] = useState<'high' | 'medium' | 'low'>('high');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (e) {
      console.error('Goal Storage Error:', e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
    } catch (e) {
      console.error('Rules Storage Error:', e);
    }
  }, [rules]);

  const addObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    const newGoal: ObjectiveGoal = {
      id: `goal_${Date.now()}`,
      title: titleInput.trim(),
      type: typeInput,
      priority: priorityInput,
      startDate: startDateInput || new Date().toISOString().split('T')[0],
      endDate: endDateInput || undefined,
      targetAmount: typeInput === 'financial' ? parseFloat(targetAmountInput) || 0 : undefined,
      currentAmount: typeInput === 'financial' ? 0 : undefined,
      completed: false
    };

    setGoals([newGoal, ...goals]);
    setTitleInput('');
    setTargetAmountInput('');
    setStartDateInput('');
    setEndDateInput('');
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Objective Deployment Matrix */}
      <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Target size={18} className="text-emerald-400" /> Goal & Milestone Architecture
          </h3>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            {goals.filter(g => !g.completed).length} Active
          </span>
        </div>

        {/* Creation Form */}
        <form onSubmit={addObjective} className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Objective Title</label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Complete Cymatic Hub offline sync / Save 500,000 UGX"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Category</label>
              <select
                value={typeInput}
                onChange={(e: any) => setTypeInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="timeline">📅 Timeline / Milestone</option>
                <option value="financial">💰 Financial / Target Savings</option>
                <option value="discipline">⚡ Habit / System Rule</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {typeInput === 'financial' ? (
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Target Amount (UGX)</label>
                <input
                  type="number"
                  value={targetAmountInput}
                  onChange={(e) => setTargetAmountInput(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Priority</label>
              <div className="flex gap-1">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriorityInput(p)}
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${
                      priorityInput === p
                        ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                        : 'bg-gray-900 text-gray-500 border-gray-800 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Deploy Objective
          </button>
        </form>

        {/* Objectives Display List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {goals.length === 0 && (
            <p className="text-[10px] text-gray-500 font-bold uppercase text-center py-8">No active objectives in orbit.</p>
          )}

          {goals.map((g) => {
            const isFinancial = g.type === 'financial';
            const remaining = isFinancial && g.targetAmount ? Math.max(0, g.targetAmount - (g.currentAmount || 0)) : 0;

            return (
              <div
                key={g.id}
                className={`p-4 rounded-2xl border transition-all ${
                  g.completed
                    ? 'bg-emerald-950/20 border-emerald-500/20 opacity-60'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleGoal(g.id)} className="mt-0.5 text-gray-500 hover:text-emerald-400">
                      {g.completed ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} />}
                    </button>
                    <div>
                      <p className={`text-xs font-bold ${g.completed ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                        {g.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[9px] font-black uppercase tracking-wider text-gray-500">
                        <span className="flex items-center gap-1">
                          {g.type === 'financial' && <DollarSign size={10} className="text-emerald-400" />}
                          {g.type === 'timeline' && <Calendar size={10} className="text-blue-400" />}
                          {g.type === 'discipline' && <Zap size={10} className="text-purple-400" />}
                          {g.type}
                        </span>
                        {g.endDate && <span>Deadline: {g.endDate}</span>}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => deleteGoal(g.id)} className="text-gray-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>

                {isFinancial && g.targetAmount && (
                  <div className="mt-3 pt-3 border-t border-gray-900">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1">
                      <span className="text-gray-500">Target Allocation</span>
                      <span className="text-emerald-400">
                        {(g.currentAmount || 0).toLocaleString()} / {g.targetAmount.toLocaleString()} UGX
                      </span>
                    </div>
                    <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (((g.currentAmount || 0) / g.targetAmount) * 100))}%` }}
                      />
                    </div>
                    {remaining > 0 && (
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter mt-1 text-right">
                        Remaining: {remaining.toLocaleString()} UGX
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enforcement & Lockdown Protocol Setup */}
      <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-400" /> Lockdown & Protocol Configuration
          </h3>
          <Lock size={16} className="text-amber-400/60" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Sleep & Physical Protocol</label>
            <input
              type="text"
              value={rules.sleepSchedule}
              onChange={(e) => setRules({ ...rules, sleepSchedule: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Target Apps for Lockdown / Suppression</label>
            <input
              type="text"
              value={rules.restrictedApps}
              onChange={(e) => setRules({ ...rules, restrictedApps: e.target.value })}
              placeholder="e.g. WhatsApp, Instagram, Browsers"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Daily Operations Sequence</label>
            <textarea
              rows={2}
              value={rules.dailyProtocol}
              onChange={(e) => setRules({ ...rules, dailyProtocol: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
