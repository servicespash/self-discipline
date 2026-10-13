import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { AppPackageInfo } from '../../utils/packageManager';

interface AppInventoryProps {
  filteredApps: AppPackageInfo[];
  blockedApps: string[];
  toggleAppBlock: (appId: string) => void;
}

export const AppInventory: React.FC<AppInventoryProps> = ({ filteredApps, blockedApps, toggleAppBlock }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredApps.map(app => {
      const isBlocked = blockedApps.includes(app.packageName);

      return (
        <div 
          key={app.packageName}
          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
            isBlocked 
              ? 'bg-red-950/20 border-red-500/30' 
              : 'bg-gray-950/70 border-gray-800 hover:border-gray-700'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{app.appName}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold ${
                  app.isSystemApp ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {app.isSystemApp ? 'System App' : 'Installed App'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-gray-500 truncate max-w-[220px]">
                {app.packageName}
              </div>
            </div>

            <div className="shrink-0">
              {isBlocked ? (
                <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-mono font-bold text-red-400 flex items-center gap-1">
                  <Lock size={10} /> Suppressed
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Unlock size={10} /> Active
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[10px] text-gray-400">
            <span>Version: <strong className="text-gray-300 font-mono">{app.versionName || '1.0'}</strong></span>

            <button
              type="button"
              onClick={() => toggleAppBlock(app.packageName)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                isBlocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black'
                  : 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30'
              }`}
            >
              {isBlocked ? 'Restore App' : 'Suppress / Block'}
            </button>
          </div>
        </div>
      );
    })}
  </div>
);
