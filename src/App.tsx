/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * App Execution Shell - Cymatic Architecture Root
 */

import React, { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import Dashboard from './components/Dashboard';
import LockdownOverlay from './components/LockdownOverlay';
import RamaFloatingHub from './components/RamaFloatingHub';
import { DisciplineBridge, SystemLockdownPayload } from './DisciplineBridge';
import { Shield, ShieldAlert, Cpu, LogOut, Terminal } from 'lucide-react';

const AppContent: React.FC = () => {
  const { session, loading, signIn, signOut } = useSession();
  const [inputEmail, setInputEmail] = useState('');
  const [inputMoniker, setInputMoniker] = useState('');
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [bridgeReady, setBridgeReady] = useState(false);

  // Subscribe to DisciplineBridge State
  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });

    // Initialize Native System Permissions
    DisciplineBridge.checkPermissions().then(() => {
      setBridgeReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    signIn(inputEmail, inputMoniker || 'Isabirye Latif (Solo Architect)');
  };

  if (loading || !bridgeReady) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-950 text-emerald-400 p-8 text-center font-mono">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 animate-pulse">
          <Cpu size={32} className="text-emerald-400" />
        </div>
        <div className="text-sm font-black uppercase tracking-widest text-white mb-1">
          Initializing Cymatic Engine...
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          Verifying DisciplineBridge & System Privileges
        </p>
      </div>
    );
  }

  // Session Gate (Login)
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-8 text-gray-100 font-sans">
        {/* Widened Container for clean text layout */}
        <div className="w-full max-w-2xl p-8 sm:p-10 bg-gray-900/90 border border-gray-800/90 rounded-3xl shadow-2xl space-y-8 backdrop-blur-xl">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Shield size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                Cymatic Hub & Resonance Operating System
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SYSTEM EXECUTION GATE
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Institutional register, study synchronization, and execution monitoring pipeline. Authenticate local call sign to proceed.
            </p>
          </div>

          <form onSubmit={handleSignInSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                Architect / Moniker Call Sign
              </label>
              <input
                type="text"
                placeholder="Isabirye Latif (Solo Architect)"
                value={inputMoniker}
                onChange={(e) => setInputMoniker(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                Institutional Workspace Address
              </label>
              <input
                type="email"
                required
                placeholder="latif@cymatic.local"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Terminal size={16} /> Authenticate Local Workspace
            </button>
          </form>

          <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>DISCIPLINE_BRIDGE: ONLINE</span>
            <span>CYMATIC_HUB: READY</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500 selection:text-gray-950">
      {/* Top Navigation Bar */}
      <header className="fixed top-4 right-4 z-[90] flex items-center gap-3 bg-gray-900/90 border border-gray-800 px-4 py-2 rounded-full text-xs text-gray-300 shadow-2xl backdrop-blur-xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${lockdownState.active ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${lockdownState.active ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        </span>
        <span className="font-bold text-white tracking-wide">{session.moniker}</span>
        {lockdownState.active && (
          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
            <ShieldAlert size={10} /> Locked
          </span>
        )}
        <button
          onClick={signOut}
          className="ml-2 text-gray-500 hover:text-red-400 p-1 rounded-lg transition-colors"
          title="Disconnect Session"
        >
          <LogOut size={14} />
        </button>
      </header>

      {/* Primary Workspace View */}
      <Dashboard accessToken={null} />

      {/* Global Discipline Lockdown Overlay */}
      <LockdownOverlay />

      {/* Global AI Floating Execution Hub */}
      <RamaFloatingHub context="Cymatic Hub & Cymatic Resonance Unified Shell" />
    </div>
  );
};

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
