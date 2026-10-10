/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal Discipline OS Command Center - Responsive Grid Layout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { UniversalDisciplineState } from '../types/discipline';

// Internal Components
import TaskWidget from './TaskWidget';
import CalendarWidget from './CalendarWidget';
import WalletDiscipline from './WalletDiscipline';
import RoomMakeover from './RoomMakeover';
import PrayerDiscipline from './PrayerDiscipline';
import LockdownSettings from './LockdownSettings';
import RealCalendarIntegration from './RealCalendarIntegration';
import RealCalendarRoom from './RealCalendarRoom';
import CalendarManager from './CalendarManager';
import PWAInstallBanner from './PWAInstallBanner';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';

import { 
  Wallet, 
  CalendarDays, 
  CheckSquare, 
  LogOut, 
  Shield, 
  ShieldAlert, 
  Settings, 
  Wifi,
  WifiOff,
  DollarSign,
  Target,
  Menu,
  X,
  Home,
  Monitor,
  HeartPulse,
  Lock,
  Sparkles
} from 'lucide-react';

const STORAGE_KEY = 'sdc_universal_discipline_matrix_v2';

const INITIAL_STATE: UniversalDisciplineState = {
  capital: {
    currencySymbol: '$',
    totalBudget: 0,
    entries: []
  },
  customGoals: [],
  dailyRoutines: [],
  lastUpdated: Date.now()
};

// Helper to get initials (e.g., "Lucky Adams" -> "LA")
const getInitials = (name: string) => {
  if (!name) return 'SO';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export default function Dashboard({ accessToken }: { accessToken: string | null }) {
  const { session, signOut } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const location = useLocation();

  const getTitle = () => {
    switch(location.pathname) {
      case '/dashboard': return 'Neural Core Command';
      case '/tasks': return 'Task Manager';
      case '/calendar': return 'Real Calendar Grid';
      case '/wallet': return 'Capital Tracker';
      case '/prayer': return 'Prayer Discipline';
      case '/makeover': return 'Room Makeover';
      case '/rio': return 'Google Sync';
      case '/settings': return 'Protocols';
      default: return 'Cymatic OS';
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to DisciplineBridge State
  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });
    return () => unsubscribe();
  }, []);

  // Lockdown countdown ticker
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) => `w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all border group relative ${
        isActive
          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 border-transparent'
      }`}
    >
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-full" />}
          <Icon size={18} className={isActive ? 'text-emerald-400' : 'group-hover:text-emerald-400/70 transition-colors'} />
          <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
      <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
        {/* Sidebar */}
        <aside className={`${isMobileMenuOpen ? 'fixed' : 'hidden'} md:static w-72 border-r border-gray-800/50 flex flex-col bg-gray-950/95 backdrop-blur-3xl inset-y-0 left-0 z-50 md:flex shadow-2xl`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8 md:hidden">
              <button className="text-gray-400" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="space-y-1.5">
              <NavItem to="/dashboard" icon={Home} label="Core Hub" />
              <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
              <NavItem to="/calendar" icon={CalendarDays} label="Calendar" />
              <NavItem to="/wallet" icon={Wallet} label="Wallet" />
              <NavItem to="/prayer" icon={HeartPulse} label="Prayer Discipline" />
              <NavItem to="/makeover" icon={Monitor} label="Room Makeover" />
              <NavItem to="/rio" icon={Sparkles} label="Real Google Sync" />
              <NavItem to="/settings" icon={Lock} label="Lockdown Protocols" />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-gray-950 to-gray-950 flex flex-col h-screen overflow-y-auto">
           {/* Top Navigation with Algorithmic Lockdown Control */}
           <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-2.5 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <button className="md:hidden text-gray-400 hover:text-white p-1" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu size={20} />
                </button>
                <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase truncate max-w-[130px] sm:max-w-none">
                  {getTitle()}
                </h2>
              </div>

              {/* Top Algorithmic Lockdown Control Pill & Session Status */}
              <div className="flex items-center gap-2 sm:gap-3">
                {lockdownState.active ? (
                  <div className="flex items-center gap-2 bg-red-950/50 border border-red-500/50 px-2.5 sm:px-3 py-1 rounded-full text-xs shadow-lg shadow-red-950/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-300 flex items-center gap-1">
                      <Lock size={11} className="text-red-400" />
                      <span className="hidden sm:inline">ALGO LOCKED:</span>
                    </span>
                    <span className="font-mono font-black text-xs text-white bg-gray-950/90 px-2 py-0.5 rounded border border-red-500/30">
                      {formatTimer(timeRemaining)}
                    </span>
                    <button
                      onClick={() => DisciplineBridge.terminateLockdown()}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-black text-[9px] uppercase rounded-full transition-colors"
                      title="Emergency Release Protocol"
                    >
                      Break
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-900/90 border border-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs shadow-inner">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400">
                      <ShieldAlert size={12} className="text-emerald-400" />
                      <span className="hidden md:inline">Algo Lock:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[15, 30, 60].map(mins => (
                        <button
                          key={mins}
                          onClick={() => DisciplineBridge.initiateLockdown(mins, 'com.whatsapp,com.instagram.android')}
                          className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-gray-950 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800/80 transition-all"
                        >
                          {mins}m
                        </button>
                      ))}
                      <button
                        onClick={() => DisciplineBridge.initiateLockdown(30, 'com.whatsapp,com.instagram.android')}
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-full text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-md shadow-emerald-950/40"
                      >
                        <Lock size={10} /> Engage
                      </button>
                    </div>
                  </div>
                )}

                <div className="hidden lg:flex items-center gap-1.5 bg-gray-900/80 px-2.5 py-1 rounded-full border border-gray-800 text-[10px] font-black uppercase">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-xs shadow-lg shrink-0">
                  {getInitials(session?.moniker || 'Architect')}
                </div>
              </div>
           </header>
           
           {/* PWA In-App Install Prompt Banner */}
           <PWAInstallBanner />
           
           <Routes>
             <Route path="/" element={<Navigate to="/dashboard" replace />} />
             <Route path="/dashboard" element={
               <div className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                   <div className="md:col-span-2 lg:col-span-2"><TaskWidget accessToken={accessToken} /></div>
                   <div><CalendarWidget accessToken={accessToken} /></div>
                   <div className="md:col-span-2 lg:col-span-1"><WalletDiscipline /></div>
                   <div><PrayerDiscipline /></div>
                   <div><RoomMakeover /></div>
                </div>
               </div>
             } />
             <Route path="/tasks" element={<div className="p-8 max-w-4xl mx-auto"><TaskWidget accessToken={accessToken} /></div>} />
             <Route path="/calendar" element={<div className="p-4 sm:p-8 max-w-7xl mx-auto w-full"><CalendarManager accessToken={accessToken} /></div>} />
             <Route path="/wallet" element={<div className="p-8 max-w-4xl mx-auto"><WalletDiscipline /></div>} />
             <Route path="/prayer" element={<div className="p-8 max-w-4xl mx-auto"><PrayerDiscipline /></div>} />
             <Route path="/makeover" element={<div className="p-8 max-w-4xl mx-auto"><RoomMakeover /></div>} />
             <Route path="/rio" element={<div className="p-8 max-w-4xl mx-auto"><RealCalendarIntegration /></div>} />
             <Route path="/settings" element={<div className="p-8 max-w-4xl mx-auto"><LockdownSettings /></div>} />
           </Routes>
        </main>
      </div>
  );
}

