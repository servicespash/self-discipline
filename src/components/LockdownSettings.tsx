/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { DisciplineBridge } from '../DisciplineBridge';
import { Lock, Clock, Smartphone, ShieldAlert, Check } from 'lucide-react';

export default function LockdownSettings() {
  const [duration, setDuration] = useState(30);
  const [apps, setApps] = useState([
    { id: 'com.whatsapp', name: 'WhatsApp', blocked: true },
    { id: 'com.instagram.android', name: 'Instagram', blocked: true },
    { id: 'com.zhiliaoapp.musically', name: 'TikTok', blocked: true },
    { id: 'com.google.android.youtube', name: 'YouTube', blocked: false },
    { id: 'com.twitter.android', name: 'X / Twitter', blocked: false }
  ]);
  const [initiated, setInitiated] = useState(false);

  const toggleApp = (id: string) => {
    if (initiated) return; // Non-terminable / non-editable once initiated
    setApps(apps.map(a => a.id === id ? { ...a, blocked: !a.blocked } : a));
  };

  const initiateLockdown = async () => {
    const blockedCsv = apps.filter(a => a.blocked).map(a => a.id).join(',');
    await DisciplineBridge.initiateLockdown(duration, blockedCsv);
    setInitiated(true);
  };

  return (
    <div className="p-8 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Lock size={18} className="text-emerald-400" /> Lockdown Authority & Device Apps
        </h3>
        {initiated && (
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase rounded-full animate-pulse">
            Session Locked (Non-Terminable)
          </span>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Lockdown Authority Duration (Minutes)</label>
        <div className="flex gap-2">
          {[15, 30, 60, 120, 240].map(mins => (
            <button 
              key={mins} 
              disabled={initiated}
              onClick={() => setDuration(mins)} 
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${duration === mins ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/20' : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-white'}`}
            >
              {mins}m
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Clock size={14} className="text-gray-500" />
          <span className="text-xs font-mono text-gray-300">Custom Duration: </span>
          <input 
            type="number" 
            disabled={initiated}
            value={duration} 
            onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white w-24 font-mono"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Installed Device Applications to Suppress</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {apps.map(app => (
            <div 
              key={app.id} 
              onClick={() => toggleApp(app.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${app.blocked ? 'bg-emerald-950/20 border-emerald-500/30 text-white' : 'bg-gray-950 border-gray-800 text-gray-500'}`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone size={16} className={app.blocked ? 'text-emerald-400' : 'text-gray-600'} />
                <span className="text-xs font-bold">{app.name}</span>
              </div>
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${app.blocked ? 'bg-emerald-500 border-emerald-400 text-gray-950 font-black' : 'border-gray-700 bg-gray-900'}`}>
                {app.blocked && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        disabled={initiated}
        onClick={initiateLockdown} 
        className={`w-full py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 ${initiated ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-emerald-600 hover:bg-emerald-500 text-gray-950 shadow-emerald-950/40'}`}
      >
        <ShieldAlert size={16} /> {initiated ? 'Authority Lockdown Active & Locked' : 'Enforce Absolute Lockdown Authority'}
      </button>
    </div>
  );
}
