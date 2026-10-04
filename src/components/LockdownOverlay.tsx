/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Hardened Lockdown & Algorithmic Suppression Overlay Engine
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Lock, AlertTriangle, Play, EyeOff } from 'lucide-react';
import { ObjectiveGoal, SystemRules } from './GoalSetting';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';

interface LockdownProps {
  onTerminate?: () => void;
}

export default function LockdownOverlay({ onTerminate }: LockdownProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [overrideProgress, setOverrideProgress] = useState<number>(0);
  const [overrideHolding, setOverrideHolding] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  // Subscribe to DisciplineBridge State Updates
  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((newState) => {
      setLockdownState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Fetch active goals and rules from storage
  const activeGoals: ObjectiveGoal[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('sdc_goals_v2');
      if (saved) {
        const goals: ObjectiveGoal[] = JSON.parse(saved);
        return goals.filter(g => !g.completed && g.priority === 'high');
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [lockdownState.active]);

  const activeRules: SystemRules | null = useMemo(() => {
    try {
      const saved = localStorage.getItem('sdc_system_rules_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!lockdownState.active) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((lockdownState.endTime - now) / 1000));
      
      setTimeRemaining(diff);

      if (diff <= 0) {
        DisciplineBridge.terminateLockdown();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockdownState]);

  // Handle emergency termination hold button
  useEffect(() => {
    let holdTimer: NodeJS.Timeout;
    if (overrideHolding) {
      holdTimer = setInterval(() => {
        setOverrideProgress((prev) => {
          if (prev >= 100) {
            clearInterval(holdTimer);
            handleTerminate();
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    } else {
      setOverrideProgress(0);
    }
    return () => clearInterval(holdTimer);
  }, [overrideHolding]);

  const handleStartLockdown = async (minutes: number) => {
    const targetApps = activeRules?.restrictedApps || '';
    await DisciplineBridge.initiateLockdown(minutes, targetApps);
    setIsMinimized(false);
  };

  const handleTerminate = async () => {
    await DisciplineBridge.terminateLockdown();
    setOverrideHolding(false);
    setOverrideProgress(0);
    if (onTerminate) onTerminate();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Inactive State -> Control Panel
  if (!lockdownState.active) {
    return (
      <div className="p-6 bg-gray-900 rounded-3xl border border-gray-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={18} className="text-emerald-400" /> Algorithmic Lockdown Control
          </h3>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded-full">
            Bridge Connected
          </span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed font-medium">
          Engage Protocol Lockdown to dispatch system suppression rules across target application packages and isolate high-priority objectives.
        </p>

        <div className="flex items-center gap-2">
          {[15, 30, 60, 120].map((mins) => (
            <button
              key={mins}
              onClick={() => setSelectedDuration(mins)}
              className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all ${
                selectedDuration === mins
                  ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                  : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              {mins < 60 ? `${mins}m` : `${mins / 60}h`}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleStartLockdown(selectedDuration)}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Play size={16} /> Initiate {selectedDuration}-Minute System Lock
        </button>
      </div>
    );
  }

  // 2. Minimized Floating View
  if (isMinimized) {
    return (
      <div className="fixed top-6 right-6 z-[110] animate-in slide-in-from-right duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 hover:bg-emerald-500 transition-all group"
        >
          <div className="bg-gray-950/40 p-2 rounded-xl">
            <ShieldAlert size={18} className="text-white animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">Bridge Active</p>
            <p className="text-xs text-white font-mono font-black">{formatTimer(timeRemaining)}</p>
          </div>
          <ChevronUp size={18} className="text-emerald-200 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // 3. Fullscreen Active Lockdown Overlay
  return (
    <div className="fixed inset-0 z-[100] bg-gray-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full relative space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsMinimized(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest bg-gray-900/80 px-4 py-2 rounded-full border border-gray-800"
          >
            <ChevronDown size={14} /> Background View
          </button>
        </div>

        <div className="p-8 rounded-3xl border border-emerald-500/30 bg-gray-900/80 shadow-2xl backdrop-blur-md relative overflow-hidden text-left space-y-6">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 animate-pulse" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Lock size={24} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Protocol Active</h2>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Discipline Bridge Locked</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-mono font-black text-emerald-400 tracking-tight">
                {formatTimer(timeRemaining)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Primary Target Focus</p>
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {activeGoals.length > 0 ? (
                activeGoals.map((g) => (
                  <div key={g.id} className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{g.title}</span>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                      {g.priority}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 text-xs text-gray-400 font-bold">
                  Core Architectural Execution Mode
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1">
            <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest flex items-center gap-1.5">
              <EyeOff size={12} /> Target Suppression Packages
            </p>
            <p className="text-xs text-gray-300 font-mono font-medium truncate">
              {lockdownState.restrictedPackages.join(', ')}
            </p>
          </div>

          <div className="pt-2">
            <button
              onMouseDown={() => setOverrideHolding(true)}
              onMouseUp={() => setOverrideHolding(false)}
              onMouseLeave={() => setOverrideHolding(false)}
              onTouchStart={() => setOverrideHolding(true)}
              onTouchEnd={() => setOverrideHolding(false)}
              className="relative w-full py-4 rounded-2xl font-black bg-gray-950 hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-all border border-gray-800 hover:border-red-500/50 uppercase tracking-widest text-xs overflow-hidden select-none"
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-red-600/30 transition-all duration-75"
                style={{ width: `${overrideProgress}%` }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <AlertTriangle size={14} /> Hold to Break Protocol (Emergency)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
