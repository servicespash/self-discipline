/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LockdownProtocols - Dedicated Command Center for Digital Lockdown & System Enforcement
 * Free of redundant app inventory bloat; focused strictly on lockdown protocols, profiles, timers, and intent interception.
 */

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { PackageManager } from '../utils/packageManager';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Sliders, 
  Smartphone, 
  Check, 
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';

interface LockdownProfile {
  id: string;
  name: string;
  description: string;
  targetCountDescription: string;
  defaultMinutes: number;
}

const PROFILES: LockdownProfile[] = [
  {
    id: 'fortress',
    name: 'Fortress Blackout',
    description: 'Strict, impenetrable lockdown suppressing all non-system entertainment, social media, and distractors.',
    targetCountDescription: 'All Distraction & Social Targets',
    defaultMinutes: 60
  },
  {
    id: 'social',
    name: 'Social Media Suppression',
    description: 'Blocks Instagram, TikTok, X, Facebook, and Reddit while keeping browsers and productivity tools active.',
    targetCountDescription: 'Social Media Targets',
    defaultMinutes: 30
  },
  {
    id: 'sprint',
    name: 'Pomodoro Deep Sprint',
    description: 'High-intensity, distraction-free sprint for coding, architecture, or deep cognitive execution.',
    targetCountDescription: 'Configured Blocklist',
    defaultMinutes: 25
  }
];

export default function LockdownProtocols() {
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [activeProfile, setActiveProfile] = useState<string>('social');
  const [allowedEmergencyApp, setAllowedEmergencyApp] = useState<string | null>(null);
  const [blockedPackages, setBlockedPackages] = useState<string[]>(() => PackageManager.getBlockedPackages());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe(state => {
      setLockdownState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!lockdownState.active) {
      setTimeRemaining(0);
      return;
    }
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((lockdownState.endTime - Date.now()) / 1000));
      setTimeRemaining(diff);
      if (diff <= 0) {
        DisciplineBridge.terminateLockdown();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockdownState]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInitiateLockdown = async () => {
    const mins = customDuration ? parseInt(customDuration, 10) || duration : duration;
    const packagesToBlock = blockedPackages.length > 0 
      ? blockedPackages.join(',') 
      : (PackageManager.getUserConfiguredApps().map(a => a.packageName).join(',') || '');

    await DisciplineBridge.initiateLockdown(
      mins,
      packagesToBlock,
      allowedEmergencyApp
    );
    showToast(`Lockdown protocol enforced for ${mins} minutes.`);
  };

  const handleTerminateLockdown = async () => {
    await DisciplineBridge.terminateLockdown();
    showToast('Lockdown protocol terminated.');
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 text-gray-100 min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-emerald-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-gray-900 via-gray-900 to-red-950/40 border border-gray-800 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-black uppercase tracking-wider">
            <Lock size={12} /> System Lockdown Protocols
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Lockdown Protocols & Interception Control
          </h2>
          <p className="text-xs text-gray-400 max-w-2xl">
            Configure enforceability windows, intent interception schedules, and system focus suppression parameters.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {lockdownState.active ? (
            <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Active Protocol
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} /> Standby Ready
            </span>
          )}
        </div>
      </div>

      {/* Active Lockdown Status Card */}
      {lockdownState.active ? (
        <div className="p-5 sm:p-7 bg-red-950/30 border border-red-500/40 rounded-3xl space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                <ShieldAlert size={16} /> Active System Interception Enforced
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
                {formatTimer(timeRemaining)}
              </div>
              <p className="text-xs text-gray-300">
                Suppressed packages: <strong className="text-red-300 font-mono">{lockdownState.restrictedPackages.length} active targets</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleTerminateLockdown}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer shrink-0"
            >
              Emergency Release Protocol
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Duration</span>
              <span className="font-mono text-white font-bold">{lockdownState.durationMinutes} Minutes</span>
            </div>
            <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Emergency Channel</span>
              <span className="font-mono text-emerald-400 font-bold">{lockdownState.allowedSocialPackage || 'None (Total Lockdown)'}</span>
            </div>
            <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Hardware Interception</span>
              <span className="font-mono text-emerald-400 font-bold">Local VPN Firewall + Accessibility</span>
            </div>
          </div>
        </div>
      ) : (
        /* Lockdown Initiation Panel */
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-900/90 border border-gray-800 rounded-3xl shadow-xl space-y-6">
          <div className="border-b border-gray-800 pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Zap size={16} className="text-emerald-400" /> Protocol Parameters & Enforcement
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Select an enforcement profile, duration, and target suppression intensity.
            </p>
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PROFILES.map(prof => (
              <button
                key={prof.id}
                type="button"
                onClick={() => {
                  setActiveProfile(prof.id);
                  setDuration(prof.defaultMinutes);
                  setCustomDuration('');
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  activeProfile === prof.id
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg'
                    : 'bg-gray-950/60 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{prof.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-900 text-gray-300">
                      {prof.defaultMinutes}m
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {prof.description}
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-400">
                  Target: {prof.targetCountDescription}
                </div>
              </button>
            ))}
          </div>

          {/* Duration Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-400" /> Lockdown Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[15, 30, 60, 120, 240].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setDuration(mins);
                    setCustomDuration('');
                  }}
                  className={`py-3 px-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    !customDuration && duration === mins
                      ? 'bg-emerald-600 text-gray-950 shadow-lg border border-emerald-400'
                      : 'bg-gray-950 text-gray-300 hover:text-white border border-gray-800'
                  }`}
                >
                  <span className="text-sm font-black">{mins}m</span>
                  <span className="text-[9px] font-mono opacity-80">
                    {mins >= 60 ? `${mins / 60}h Sprint` : 'Short Sprint'}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Input + Enforce Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="number"
                  min="1"
                  max="720"
                  placeholder="Or enter custom minutes (e.g. 45)..."
                  value={customDuration}
                  onChange={e => setCustomDuration(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 font-mono outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleInitiateLockdown}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl cursor-pointer shrink-0 flex items-center justify-center gap-2"
              >
                <Lock size={14} />
                <span>Enforce Protocol ({customDuration || duration}m)</span>
              </button>
            </div>
          </div>

          {/* Emergency Exception Channel */}
          <div className="pt-4 border-t border-gray-800 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Sliders size={14} className="text-emerald-400" /> Emergency Communication Exception
            </label>
            <p className="text-[11px] text-gray-400">
              Designate a single communication app permitted for emergencies during the lockdown.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { id: null, label: 'Strict Lockdown (No Exceptions)' },
                ...PackageManager.getUserConfiguredApps()
                  .filter(a => a.category === 'messaging' || a.category === 'system')
                  .map(a => ({ id: a.packageName, label: `${a.appName} Only` }))
              ].map(opt => (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => setAllowedEmergencyApp(opt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    allowedEmergencyApp === opt.id
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-md'
                      : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cross-Link Card to App Authority */}
      <div className="p-4 sm:p-6 bg-gray-900/60 border border-gray-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400">
            <Smartphone size={14} /> Application Target Registry
          </div>
          <p className="text-xs text-gray-300">
            Currently targeting <strong className="text-white font-mono">{blockedPackages.length} package targets</strong> for suppression.
          </p>
          <p className="text-[11px] text-gray-500">
            Need to inspect device packages, whitelist apps, or add custom Android package names?
          </p>
        </div>

        <NavLink
          to="/apps"
          className="shrink-0 px-4 py-2.5 bg-gray-950 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500/50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>Open App Authority</span>
          <ArrowRight size={14} className="text-emerald-400" />
        </NavLink>
      </div>
    </div>
  );
}
