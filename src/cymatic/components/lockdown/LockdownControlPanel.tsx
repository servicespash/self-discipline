// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface LockdownControlPanelProps {
  lockdownActive: boolean;
  timeRemaining: number;
  formatTimer: (seconds: number) => string;
  onTerminateLockdown: () => void;
  duration: number;
  setDuration: (d: number) => void;
  customDuration: string;
  setCustomDuration: (d: string) => void;
  onInitiateLockdown: () => void;
  restrictedPackagesCount: number;
}

export const LockdownControlPanel: React.FC<LockdownControlPanelProps> = ({
  lockdownActive, timeRemaining, formatTimer, onTerminateLockdown,
  duration, setDuration, customDuration, setCustomDuration, onInitiateLockdown, restrictedPackagesCount
}) => (
  <div className="p-6 bg-gray-900/90 border border-gray-800 rounded-3xl shadow-xl space-y-5">
    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <Lock size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Lockdown Protocol Enforcer
          </h3>
          <p className="text-[11px] text-gray-400">
            Trigger intent interception and suppress high-dopamine distraction packages immediately.
          </p>
        </div>
      </div>
    </div>

    {lockdownActive ? (
      <div className="p-5 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-black uppercase text-red-300 flex items-center gap-2">
            <ShieldAlert size={16} /> Active System Suppression
          </div>
          <div className="text-2xl font-mono font-black text-white">
            {formatTimer(timeRemaining)} remaining
          </div>
          <p className="text-xs text-gray-300">
            Suppressed packages: <span className="font-mono text-red-300 font-bold">{restrictedPackagesCount}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onTerminateLockdown}
          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer shrink-0"
        >
          Emergency Release Protocol
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[15, 30, 60, 120, 240].map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                setDuration(mins);
                setCustomDuration('');
              }}
              className={`py-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                !customDuration && duration === mins
                  ? 'bg-emerald-600 text-gray-950 shadow-lg border border-emerald-400'
                  : 'bg-gray-950 text-gray-300 hover:text-white border border-gray-800'
              }`}
            >
              <span className="text-sm font-black">{mins}m</span>
              <span className="text-[9px] font-mono opacity-80">
                {mins >= 60 ? `${mins / 60}h` : 'Sprint'}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="720"
            placeholder="Custom duration in minutes..."
            value={customDuration}
            onChange={e => setCustomDuration(e.target.value)}
            className="flex-1 bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 font-mono outline-none"
          />
          <button
            type="button"
            onClick={onInitiateLockdown}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl cursor-pointer"
          >
            Enforce Lockdown
          </button>
        </div>
      </div>
    )}
  </div>
);
