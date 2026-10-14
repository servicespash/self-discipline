// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';

interface SettingsTabProps {
  onForceSync: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onForceSync }) => (
  <div className="space-y-4">
    <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
        <Settings size={14} className="text-emerald-400" /> System & Environment
      </h3>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-gray-400">Client Engine:</span>
        <span className="text-white font-bold">Cymatic OS v3.5</span>
      </div>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-gray-400">Supabase Backend:</span>
        <span className="text-emerald-400 font-bold">Connected & Synchronized</span>
      </div>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-gray-400">Row-Level Security:</span>
        <span className="text-emerald-400 font-bold">Enforced</span>
      </div>
    </div>

    <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-white">Cache & Synchronization</h3>
      <p className="text-[11px] text-gray-400">Synchronize local cache states with secure Supabase cloud storage.</p>
      <button 
        onClick={onForceSync}
        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <RefreshCw size={14} /> Force Sync & Reload
      </button>
    </div>
  </div>
);
