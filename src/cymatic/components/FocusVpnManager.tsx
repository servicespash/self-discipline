// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Focus & Local VPN Firewall Manager - System App Picker & Interminable Lockdown
 * Wired to PackageManager discovery without hardcoded mock apps.
 */

import React, { useState, useEffect } from 'react';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { PackageManager, AppPackageInfo } from '../utils/packageManager';
import { Shield, ShieldAlert, Lock, Smartphone, Wifi, WifiOff, Check, Cpu, AlertTriangle, Key } from 'lucide-react';

interface InstalledApp {
  id: string;
  name: string;
  category: string;
  blocked: boolean;
  systemApp: boolean;
}

export default function FocusVpnManager() {
  const [duration, setDuration] = useState<number>(30);
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(true);
  const [internetBlock, setInternetBlock] = useState<boolean>(true);
  const [supervisorCode, setSupervisorCode] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [pinError, setPinError] = useState<string | null>(null);

  const [apps, setApps] = useState<InstalledApp[]>([]);

  useEffect(() => {
    PackageManager.fetchAllApps().then(pkgList => {
      const blockedList = PackageManager.getBlockedPackages();
      const mapped: InstalledApp[] = pkgList.map(p => ({
        id: p.packageName,
        name: p.appName,
        category: p.category,
        blocked: blockedList.includes(p.packageName),
        systemApp: p.isSystemApp
      }));
      setApps(mapped);
    });
  }, []);

  const state = DisciplineBridge.getState();

  const native = typeof window !== 'undefined' && window.Capacitor?.isPluginAvailable?.('DisciplineNative')
    ? window.Capacitor.Plugins.DisciplineNative : null;
  const [perms, setPerms] = useState<Record<string, boolean> | null>(null);
  const refreshPerms = () => native?.checkPermissions().then(setPerms).catch(() => setPerms(null));
  useEffect(() => {
    refreshPerms();
    const onFocus = () => refreshPerms();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, []);
  const askPerm = async (permission: string) => {
    try { await native?.requestPermission({ permission }); } catch (e) { setPinError(String(e?.message || e)); }
    refreshPerms();
  };

  useEffect(() => {
    setIsLocked(state.active);
    const unsubscribe = DisciplineBridge.subscribe((payload) => {
      setIsLocked(payload.active);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLocked) {
      setTimeRemaining(0);
      return;
    }
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
      setTimeRemaining(diff);
      if (diff <= 0) {
        DisciplineBridge.terminateLockdown();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, state.endTime]);

  const toggleAppBlock = (id: string) => {
    if (isLocked) return;
    setApps(prev => prev.map(a => {
      if (a.id === id) {
        const nextState = !a.blocked;
        PackageManager.toggleBlockPackage(id);
        return { ...a, blocked: nextState };
      }
      return a;
    }));
  };

  const handleStartLockdown = async () => {
    const blockedCsv = apps.filter(a => a.blocked).map(a => a.id).join(',');
    try {
      await DisciplineBridge.initiateLockdown(duration, blockedCsv);
      setIsLocked(true);
    } catch (e) {
      setPinError('Lockdown could not fully start: ' + (e?.message || e));
    }
    refreshPerms();
  };

  const handleSupervisorUnlock = () => {
    if (supervisorCode === 'CYMATIC777' || supervisorCode === '1234') {
      DisciplineBridge.terminateLockdown();
      setIsLocked(false);
      setSupervisorCode('');
      setPinError(null);
    } else {
      setPinError('Invalid Supervisor Passcode. Default: 1234 or CYMATIC777');
      setTimeout(() => setPinError(null), 4000);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full min-w-0">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-emerald-950/40 via-gray-900 to-gray-900 border border-emerald-500/20 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            <Shield size={12} /> System Lockdown & VPN Firewall
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Device App Interception & Local VPN Filtering
          </h2>
          <p className="text-xs text-gray-400 max-w-xl">
            Bypasses system distractors legally via Accessibility intent suppression and local VpnService packet filtering.
          </p>
        </div>

        {isLocked ? (
          <div className="px-4 py-2.5 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center gap-3 shadow-xl shrink-0">
            <Lock size={20} className="text-red-400 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] font-black uppercase text-red-300">Lockdown Active</div>
              <div className="font-mono font-black text-sm text-white">{formatTimer(timeRemaining)} remaining</div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl flex items-center gap-3 shrink-0">
            <ShieldAlert size={20} className="text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] font-black uppercase text-emerald-300">Discipline Ready</div>
              <div className="text-xs text-gray-300 font-mono">Full Device Control Enabled</div>
            </div>
          </div>
        )}
      </div>

      {native && perms && (
        <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-3xl flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black uppercase text-gray-400 mr-2">Phone permissions</span>
          {[['accessibility','Close blocked apps'],['notificationListener','Silence notifications'],['vpn','Block app internet']].map(([k,label]) => (
            <button key={k} type="button" onClick={() => askPerm(k)} disabled={perms[k]}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${perms[k] ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/40 border-amber-500/40 text-amber-300'}`}>
              {perms[k] ? '✓ ' : 'Allow: '}{label}
            </button>
          ))}
          {!isLocked && pinError && <p className="w-full text-[11px] text-red-400 font-mono">{pinError}</p>}
        </div>
      )}

      {/* Grid Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Duration & VPN Options */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 sm:p-6 bg-gray-900/90 border border-gray-800 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Lock size={14} className="text-emerald-400" /> Lockdown Parameters
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Duration (Minutes)</label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60, 120, 240, 480].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setDuration(mins)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      duration === mins 
                        ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/20 font-black' 
                        : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* VPN & Internet Toggle */}
            <div className="pt-4 border-t border-gray-800 space-y-2.5">
              <div 
                onClick={() => !isLocked && setVpnEnabled(!vpnEnabled)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  vpnEnabled ? 'bg-emerald-950/20 border-emerald-500/30 text-white' : 'bg-gray-950 border-gray-800 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wifi size={16} className={vpnEnabled ? 'text-emerald-400' : 'text-gray-600'} />
                  <div>
                    <div className="text-xs font-bold">Local VPN Firewall</div>
                    <div className="text-[10px] text-gray-500">Route packets locally</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${vpnEnabled ? 'bg-emerald-500 border-emerald-400 text-gray-950 font-black' : 'border-gray-700 bg-gray-900'}`}>
                  {vpnEnabled && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              <div 
                onClick={() => !isLocked && setInternetBlock(!internetBlock)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  internetBlock ? 'bg-red-950/20 border-red-500/30 text-white' : 'bg-gray-950 border-gray-800 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <WifiOff size={16} className={internetBlock ? 'text-red-400' : 'text-gray-600'} />
                  <div>
                    <div className="text-xs font-bold">Strict No-Internet Mode</div>
                    <div className="text-[10px] text-gray-500">Block external network requests</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${internetBlock ? 'bg-red-500 border-red-400 text-gray-950 font-black' : 'border-gray-700 bg-gray-900'}`}>
                  {internetBlock && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isLocked}
              onClick={handleStartLockdown}
              className={`w-full py-3.5 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                isLocked 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-gray-950 shadow-emerald-950/40'
              }`}
            >
              <ShieldAlert size={16} /> {isLocked ? 'Interminable Lockdown Enforced' : 'Enforce Absolute Lockdown'}
            </button>

            {/* Supervisor Unlock Section */}
            {isLocked && (
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Key size={12} className="text-amber-400" /> Supervisor Emergency Override Pin
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter Pin (1234)"
                    value={supervisorCode}
                    onChange={(e) => setSupervisorCode(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSupervisorUnlock}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-gray-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
                {pinError && (
                  <p className="text-[11px] text-red-400 font-mono">{pinError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Installed Apps Device Scanner */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 sm:p-6 bg-gray-900/90 border border-gray-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Smartphone size={14} className="text-emerald-400" /> Package Interception Targets
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Selected apps will be intercepted and closed when focus mode is initiated.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase rounded-full shrink-0">
                {apps.filter(a => a.blocked).length} Targets Suppressed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {apps.map(app => (
                <div
                  key={app.id}
                  onClick={() => toggleAppBlock(app.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer min-w-0 ${
                    app.blocked 
                      ? 'bg-red-950/20 border-red-500/30 text-white' 
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl border shrink-0 ${app.blocked ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                      <Smartphone size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{app.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{app.id}</div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ml-2 transition-all ${
                    app.blocked ? 'bg-red-500 border-red-400 text-gray-950 font-black' : 'border-gray-700 bg-gray-900'
                  }`}>
                    {app.blocked && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
