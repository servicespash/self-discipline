/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Production-Grade Prayer & Spiritual Discipline Matrix
 */
import React, { useState, useEffect } from 'react';
import { HeartPulse, CheckCircle2, Circle, Clock, ShieldCheck, Flame } from 'lucide-react';
import { DisciplineBridge } from '../DisciplineBridge';

interface PrayerNode {
  id: string;
  name: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  time: string;
  completed: boolean;
  streak: number;
}

const PRAYER_STORAGE_KEY = 'sdc_prayer_discipline_v2';

export default function PrayerDiscipline() {
  const [prayers, setPrayers] = useState<PrayerNode[]>(() => {
    try {
      const saved = localStorage.getItem(PRAYER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Prayer state load error:', e);
    }
    return [
      { id: '1', name: 'Fajr', time: '05:00 AM', completed: false, streak: 5 },
      { id: '2', name: 'Dhuhr', time: '01:00 PM', completed: false, streak: 3 },
      { id: '3', name: 'Asr', time: '04:30 PM', completed: false, streak: 4 },
      { id: '4', name: 'Maghrib', time: '07:00 PM', completed: false, streak: 7 },
      { id: '5', name: 'Isha', time: '08:30 PM', completed: false, streak: 6 }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(prayers));
    } catch (e) {
      console.error('Prayer state save error:', e);
    }
  }, [prayers]);

  const togglePrayer = (id: string) => {
    setPrayers(prev => prev.map(p => {
      if (p.id === id) {
        const nextCompleted = !p.completed;
        if (nextCompleted && (p.name === 'Fajr' || p.name === 'Isha')) {
          // Trigger brief focus lockdown for spiritual centering
          DisciplineBridge.initiateLockdown(15, 'com.whatsapp,com.instagram.android');
        }
        return {
          ...p,
          completed: nextCompleted,
          streak: nextCompleted ? p.streak + 1 : Math.max(0, p.streak - 1)
        };
      }
      return p;
    }));
  };

  const completedCount = prayers.filter(p => p.completed).length;
  const alignmentScore = Math.round((completedCount / prayers.length) * 100);

  return (
    <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-5">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <HeartPulse size={18} className="text-emerald-400" /> Prayer & Spiritual Alignment
          </h3>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Canonical observance and physiological focus synchronization</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-mono font-black text-emerald-400">{alignmentScore}%</span>
          <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Matrix Alignment</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span>Daily Progress</span>
          <span>{completedCount} / {prayers.length} Secured</span>
        </div>
        <div className="w-full bg-gray-950 h-2.5 rounded-full overflow-hidden border border-gray-800 shadow-inner">
          <div className="bg-emerald-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${alignmentScore}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {prayers.map(prayer => (
          <div 
            key={prayer.id}
            onClick={() => togglePrayer(prayer.id)}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${prayer.completed ? 'bg-emerald-950/20 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/20' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'}`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2 rounded-xl transition-colors ${prayer.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-900 text-gray-600 group-hover:text-emerald-400'}`}>
                {prayer.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${prayer.completed ? 'text-white' : 'text-gray-300'}`}>{prayer.name}</p>
                <p className="text-[9px] font-mono text-gray-500 flex items-center gap-1 mt-0.5 font-bold">
                  <Clock size={10} /> {prayer.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-xl text-[10px] font-mono font-bold text-amber-400">
                <Flame size={12} className="text-amber-500 fill-amber-500" /> {prayer.streak}d streak
              </div>
              <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-xl border ${prayer.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-900 text-gray-500 border-gray-800'}`}>
                {prayer.completed ? 'Secured' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex items-center gap-3 text-emerald-400">
        <ShieldCheck size={20} className="shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
          Canonical prayer verification automatically triggers a 15-minute auxiliary lockdown for Fajr and Isha protocols.
        </p>
      </div>
    </div>
  );
}
