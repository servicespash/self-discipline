// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { Menu, User, Share2, Lock } from 'lucide-react';

interface HeaderProps {
  title: string;
  isOnline: boolean;
  lockdownActive: boolean;
  timeRemaining: number;
  formatTimer: (seconds: number) => string;
  onMenuClick: () => void;
  onShareClick: () => void;
  onProfileClick: () => void;
  onTerminateLockdown: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, isOnline, lockdownActive, timeRemaining, formatTimer, onMenuClick, onShareClick, onProfileClick, onTerminateLockdown 
}) => (
  <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/60 px-3 sm:px-6 py-2.5 flex justify-between items-center gap-2 w-full max-w-full overflow-hidden shrink-0">
    {/* Left: Mobile Menu & Current Title */}
    <div className="flex items-center gap-2.5 min-w-0">
      <button 
        type="button"
        className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-900 shrink-0 cursor-pointer" 
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu size={18} />
      </button>
      <h2 className="text-xs sm:text-sm font-black text-white tracking-[0.15em] uppercase truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md">
        {title}
      </h2>
    </div>

    {/* Right: Lockdown Indicator, Online Status, Share & Profile */}
    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
      {lockdownActive && (
        <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-500/50 px-2 py-1 rounded-full text-xs shadow-md">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider text-red-300">
            LOCKED:
          </span>
          <span className="font-mono font-black text-[11px] sm:text-xs text-white">
            {formatTimer(timeRemaining)}
          </span>
          <button
            type="button"
            onClick={onTerminateLockdown}
            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white font-black text-[9px] uppercase rounded-full transition-colors cursor-pointer shrink-0"
            title="Emergency Release Protocol"
          >
            Break
          </button>
        </div>
      )}

      {/* Online indicator */}
      <div className="hidden lg:flex items-center gap-1.5 bg-gray-900/80 px-2.5 py-1 rounded-full border border-gray-800 text-[10px] font-black uppercase">
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className="text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Share Button */}
      <button
        type="button"
        onClick={onShareClick}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
        title="Share App via OS Native Dialog"
      >
        <Share2 size={13} className="shrink-0" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Profile Button */}
      <button 
        type="button"
        onClick={onProfileClick}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer shrink-0"
        title="Profile Management"
      >
        <User size={15} />
      </button>
    </div>
  </header>
);
