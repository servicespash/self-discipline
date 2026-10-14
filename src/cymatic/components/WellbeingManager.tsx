// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React, { useState, useEffect } from 'react';
import { Droplet, Activity, Wind, Monitor, Check, Clock, TrendingUp } from 'lucide-react';

export default function WellbeingAndMonitoringHub() {
  const [preferences, setPreferences] = useState({
    hydration: true,
    activity: true,
    breathing: true,
    screenTime: true,
  });

  // Mock stats
  const [screenTimeMinutes, setScreenTimeMinutes] = useState(145);
  const disciplineStats = {
    goalsMet: 8,
    habitsMaintained: 12,
    efficiencyScore: 88,
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Wellbeing & Monitoring Hub</h2>
        <p className="text-sm text-gray-400">Track your screen time, wellbeing nudges, and system discipline statistics.</p>
      </div>

      {/* Monitoring Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-4">
            <Monitor className="text-emerald-400" size={32} />
            <div>
                <div className="text-xs text-gray-400 font-bold uppercase">Screen Time</div>
                <div className="text-xl font-black text-white">{Math.floor(screenTimeMinutes / 60)}h {screenTimeMinutes % 60}m</div>
            </div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-4">
            <TrendingUp className="text-emerald-400" size={32} />
            <div>
                <div className="text-xs text-gray-400 font-bold uppercase">Efficiency Score</div>
                <div className="text-xl font-black text-white">{disciplineStats.efficiencyScore}%</div>
            </div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-4">
            <Check className="text-emerald-400" size={32} />
            <div>
                <div className="text-xs text-gray-400 font-bold uppercase">Habits Maintained</div>
                <div className="text-xl font-black text-white">{disciplineStats.habitsMaintained}</div>
            </div>
        </div>
      </div>

      {/* Wellbeing Nudges */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Wellbeing Nudges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
            { key: 'hydration', label: 'Hydration Reminder', icon: Droplet },
            { key: 'activity', label: 'Activity Reminder (Pushups/Squats)', icon: Activity },
            { key: 'breathing', label: 'Deep Breath Intervals', icon: Wind },
            { key: 'screenTime', label: 'Screen Time Alerts', icon: Monitor },
            ].map(({ key, label, icon: Icon }) => (
            <button
                key={key}
                onClick={() => togglePreference(key as keyof typeof preferences)}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                preferences[key as keyof typeof preferences]
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-gray-900 border-gray-800'
                }`}
            >
                <div className={`p-2 rounded-xl ${preferences[key as keyof typeof preferences] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                <Icon size={20} />
                </div>
                <span className="font-bold text-sm text-gray-200">{label}</span>
                {preferences[key as keyof typeof preferences] && <Check className="ml-auto text-emerald-500" size={16} />}
            </button>
            ))}
        </div>
      </div>
    </div>
  );
}
