/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * App Execution Shell - Cymatic Architecture Root
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import Dashboard from './components/Dashboard';
import LockdownOverlay from './components/LockdownOverlay';
import RamaFloatingHub from './components/RamaFloatingHub';
import { InAppMediaPlayer } from './components/media/InAppMediaPlayer';
import LegalTrustModal, { LegalTabType } from './components/LegalTrustModal';
import { DisciplineBridge, SystemLockdownPayload } from './DisciplineBridge';
import { SpiritualNotifications } from './utils/spiritualNotificationService';
import { RamaVoice } from './utils/ramaVoiceService';
import { Shield, ShieldAlert, ShieldCheck, Cpu, LogOut, Terminal, BotMessageSquare, ExternalLink, Award, Sparkles, Share2 } from 'lucide-react';
import { OnboardingPermissions } from './components/OnboardingPermissions';
import { Login } from './components/Login';
import { 
  extractReferralCodeFromUrl, 
  trackReferralVisit, 
  PENDING_REFERRAL_CODE_KEY, 
  ACTIVE_REFERRER_META_KEY, 
  ReferralResolution 
} from './utils/licensing';

const AppContent: React.FC = () => {
  const { session, loading, signIn, signOut } = useSession();
  const [inputEmail, setInputEmail] = useState('');
  const [inputMoniker, setInputMoniker] = useState('');
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [bridgeReady, setBridgeReady] = useState(false);
  const [isHubVisible, setIsHubVisible] = useState(true);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType | null>(null);
  const [referralInvite, setReferralInvite] = useState<ReferralResolution | null>(null);

  // Deep linking & App-launch shortcut event interception wrapped in useCallback
  const handleLaunchUrl = useCallback((urlStr: string) => {
    try {
      if (urlStr.includes('action=summon_rama') || urlStr.includes('open_rama')) {
        setIsHubVisible(true);
      }
    } catch (err) {
      console.error('[Launch] Intercept error:', err);
    }
  }, []);

  // Intercept incoming dynamic referral link & track visit live against originating user in database
  const checkReferral = useCallback(() => {
    const incomingRefCode = extractReferralCodeFromUrl();
    if (incomingRefCode) {
      trackReferralVisit(incomingRefCode).then((res) => {
        if (res.info) {
          setReferralInvite(res.info);
        } else {
          setReferralInvite({
            valid: true,
            referralCode: incomingRefCode
          });
        }
      });
    } else {
      try {
        const savedMeta = localStorage.getItem(ACTIVE_REFERRER_META_KEY);
        const pending = localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
        if (savedMeta) {
          setReferralInvite(JSON.parse(savedMeta));
        } else if (pending) {
          setReferralInvite({ valid: true, referralCode: pending });
        }
      } catch {}
    }
  }, []);

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

    // Auto-start continuous background listening for wake words
    RamaVoice.startContinuousListening();

    const handleWakeWordEvent = () => setIsHubVisible(true);
    const unsubWakeWord = RamaVoice.onWakeWord(() => {
      setIsHubVisible(true);
    });
    window.addEventListener('rama-wake-word', handleWakeWordEvent);
    window.addEventListener('rama-activate-hub', handleWakeWordEvent);

    const onHashOrPop = () => {
      handleLaunchUrl(window.location.href);
      checkReferral();
    };
    window.addEventListener('hashchange', onHashOrPop);
    window.addEventListener('popstate', onHashOrPop);

    // Initial check
    checkReferral();
    handleLaunchUrl(window.location.href);

    // Support W3C launchQueue API for PWA OS shortcut launch interception
    if (typeof window !== 'undefined' && window.launchQueue) {
      window.launchQueue.setConsumer((launchParams: any) => {
        if (launchParams && launchParams.targetURL) {
          handleLaunchUrl(launchParams.targetURL);
        }
      });
    }

    return () => {
      unsubscribe();
      unsubWakeWord();
      window.removeEventListener('rama-wake-word', handleWakeWordEvent);
      window.removeEventListener('rama-activate-hub', handleWakeWordEvent);
      window.removeEventListener('hashchange', onHashOrPop);
      window.removeEventListener('popstate', onHashOrPop);
    };
  }, [handleLaunchUrl, checkReferral]);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    signIn(inputEmail, inputMoniker || 'Discipline Champion', 'User');
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


// ... in AppContent
  // Session Gate (Login)
  if (!session) {
    return (
      <Login
        inputEmail={inputEmail}
        setInputEmail={setInputEmail}
        inputMoniker={inputMoniker}
        setInputMoniker={setInputMoniker}
        referralInvite={referralInvite}
        handleSignInSubmit={handleSignInSubmit}
        setLegalModalTab={setLegalModalTab}
      />
    );
  }

  if (!session.isOnboardingComplete) {
    return <OnboardingPermissions />;
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

      {/* Global In-App Embedded Media Player (Spotify, YouTube Music, Deezer, Local Audio) */}
      <InAppMediaPlayer />

      {/* Global Legal & Trust Modal Dialog for Logged-In Sessions */}
      {legalModalTab && (
        <LegalTrustModal
          isOpen={true}
          initialTab={legalModalTab}
          isModal={true}
          onClose={() => setLegalModalTab(null)}
        />
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
