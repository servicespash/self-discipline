/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * App Execution Shell - Cymatic Architecture Root
 */

import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import Dashboard from './components/Dashboard';
import LockdownOverlay from './components/LockdownOverlay';
import RamaFloatingHub from './components/RamaFloatingHub';
import { DisciplineBridge, SystemLockdownPayload } from './DisciplineBridge';
import { SpiritualNotifications } from './utils/spiritualNotificationService';
import { Shield, ShieldAlert, Cpu, LogOut, Terminal, BotMessageSquare } from 'lucide-react';

const AppContent: React.FC = () => {
  const { session, loading, signIn, signOut } = useSession();
  const [inputEmail, setInputEmail] = useState('');
  const [inputMoniker, setInputMoniker] = useState('');
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [bridgeReady, setBridgeReady] = useState(false);
  const [isHubVisible, setIsHubVisible] = useState(false);

  // Subscribe to DisciplineBridge State & Initialize Notifications
  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });

    SpiritualNotifications.init();

    // Initialize Native System Permissions
    DisciplineBridge.checkPermissions().then(() => {
      setBridgeReady(true);
    });

    // Deep linking & App-launch shortcut event interception
    const handleLaunchUrl = (urlStr: string) => {
      try {
        if (urlStr.includes('action=summon_rama') || urlStr.includes('open_rama')) {
          setIsHubVisible(true);
        }
      } catch (err) {
        console.error('[Launch] Intercept error:', err);
      }
    };

    handleLaunchUrl(window.location.href);

    const onHashOrPop = () => handleLaunchUrl(window.location.href);
    window.addEventListener('hashchange', onHashOrPop);
    window.addEventListener('popstate', onHashOrPop);

    // Support W3C launchQueue API for PWA OS shortcut launch interception
    if (typeof window !== 'undefined' && 'launchQueue' in window && (window as any).launchQueue) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        if (launchParams && launchParams.targetURL) {
          handleLaunchUrl(launchParams.targetURL);
        }
      });
    }

    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', onHashOrPop);
      window.removeEventListener('popstate', onHashOrPop);
    };
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
    <HashRouter>
      {/* Global Discipline Lockdown Overlay */}
      <LockdownOverlay />

      {/* Primary Workspace View */}
      <Dashboard accessToken={null} />

      {/* Global AI Floating Execution Hub */}
      {isHubVisible ? (
        <RamaFloatingHub 
          context="Cymatic Hub & Resonance Universal Shell" 
          session={session}
          onClose={() => setIsHubVisible(false)} 
        />
      ) : (
        <button
          onClick={() => setIsHubVisible(true)}
          className="fixed bottom-6 right-6 z-[120] p-4 bg-gray-900/90 hover:bg-gray-800 backdrop-blur-xl border border-emerald-500/40 rounded-full text-emerald-400 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
          title="Summon Rama AI Hub"
        >
          <BotMessageSquare size={24} className="group-hover:rotate-6 transition-transform" />
          <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider text-emerald-400">Rama AI</span>
        </button>
      )}
    </HashRouter>
  );
};

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
