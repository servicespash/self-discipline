import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from './';
import { useSession } from '../context/SessionContext';
import { Layout } from './ui/Layout';
import { Sidebar } from './dashboard/Sidebar';
import { Header } from './dashboard/Header';

// Internal Components
import TaskWidget from './TaskWidget';
import CalendarWidget from './CalendarWidget';
import WalletDiscipline from './WalletDiscipline';
import RoomMakeover from './RoomMakeover';
import PrayerDiscipline from './PrayerDiscipline';
import WellbeingAndMonitoringHub from './WellbeingManager';
import LockdownProtocols from './LockdownProtocols';
import AppAuthority from './AppAuthority';
import FocusVpnManager from './FocusVpnManager';
import ResellerManager from './ResellerManager';
import RealCalendarIntegration from './RealCalendarIntegration';
import CalendarManager from './CalendarManager';
import PWAInstallBanner from './PWAInstallBanner';
import LegalTrustModal from './LegalTrustModal';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { ProfileManagement } from './ProfileManagement';
import { getOriginatingUserLicenses, triggerNativeReferralShare } from '../utils/licensing';

export default function Dashboard({ accessToken }: { accessToken: string | null }) {
  const { session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const location = useLocation();

  const handleQuickNativeShare = async () => {
    if (!session) return;
    try {
      const licenses = await getOriginatingUserLicenses(session.uid, session.email, session.moniker);
      const code = licenses[0]?.referralCode;
      if (!code) return;
      const res = await triggerNativeReferralShare(code, session.moniker);
      setShareToast(res.message);
      setTimeout(() => setShareToast(null), 3500);
    } catch (err) {
      console.warn('[Dashboard] Quick share error:', err);
    }
  };

  const getTitle = () => {
    switch(location.pathname) {
      case '/dashboard': return 'Core Engine';
      case '/apps': return 'App Authority';
      case '/settings': return 'Lockdown Protocols';
      case '/tasks': return 'Task Manager';
      case '/calendar': return 'Real Calendar Grid';
      case '/wallet': return 'Capital Tracker';
      case '/prayer': return 'Prayer Discipline';
      case '/makeover': return 'Room Makeover';
      case '/rio': return 'Google Sync';
      case '/focus': return 'Focus & VPN Firewall';
      case '/reseller': return 'Referrals & Team Seats';
      case '/governance': return 'Governance & Contracts';
      case '/wellbeing': return 'Wellbeing Manager';
      case '/trust': return 'Google Trust & Audit';
      case '/author': return 'Author & Ideologist Dossier';
      case '/terms': return 'Terms & Conditions';
      case '/privacy': return 'Privacy Policy';
      case '/cloud': return 'Cloud Layer Deployment';
      case '/legal': return 'Legal & Rights Reserved';
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

  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });
    return () => unsubscribe();
  }, []);

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

  return (
      <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30 w-full max-w-full">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <main className="flex-1 min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-gray-950 to-gray-950 flex flex-col h-screen overflow-hidden w-full max-w-full">
           <Header 
              title={getTitle()}
              isOnline={isOnline}
              lockdownActive={lockdownState.active}
              timeRemaining={timeRemaining}
              formatTimer={formatTimer}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              onShareClick={handleQuickNativeShare}
              onProfileClick={() => setIsProfileModalOpen(true)}
              onTerminateLockdown={() => DisciplineBridge.terminateLockdown()}
           />
           
           {shareToast && (
             <div className="fixed top-14 right-6 z-50 px-4 py-2.5 bg-emerald-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
               <span>{shareToast}</span>
             </div>
           )}

           <PWAInstallBanner />
           
           <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full custom-scrollbar">
             <Routes>
               <Route path="/" element={<Navigate to="/dashboard" replace />} />
               <Route path="/dashboard" element={
                 <Layout>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sm:p-10 text-center space-y-3">
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest">Welcome to Cymatic OS</h2>
                      <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">Select a tool from the navigation menu to begin your disciplined architectural workflow.</p>
                    </div>
                 </Layout>
               } />
               <Route path="/tasks" element={<Layout><TaskWidget accessToken={accessToken} /></Layout>} />
               <Route path="/calendar" element={<Layout><CalendarManager accessToken={accessToken} /></Layout>} />
               <Route path="/wallet" element={<Layout><WalletDiscipline /></Layout>} />
               <Route path="/prayer" element={<Layout><PrayerDiscipline /></Layout>} />
               <Route path="/makeover" element={<Layout><RoomMakeover /></Layout>} />
               <Route path="/rio" element={<Layout><RealCalendarIntegration /></Layout>} />
               <Route path="/settings" element={<Layout><LockdownProtocols /></Layout>} />
               <Route path="/apps" element={<Layout><AppAuthority /></Layout>} />
               <Route path="/focus" element={<Layout><FocusVpnManager /></Layout>} />
               <Route path="/reseller" element={<Layout><ResellerManager /></Layout>} />
               <Route path="/trust" element={<Layout><LegalTrustModal initialTab="trust" /></Layout>} />
               <Route path="/author" element={<Layout><LegalTrustModal initialTab="author" /></Layout>} />
               <Route path="/terms" element={<Layout><LegalTrustModal initialTab="terms" /></Layout>} />
               <Route path="/privacy" element={<Layout><LegalTrustModal initialTab="privacy" /></Layout>} />
               <Route path="/cloud" element={<Layout><LegalTrustModal initialTab="cloud" /></Layout>} />
               <Route path="/wellbeing" element={<Layout><WellbeingAndMonitoringHub /></Layout>} />
               <Route path="/legal" element={<Layout><LegalTrustModal initialTab="author" /></Layout>} />
             </Routes>
           </div>
           
           <ProfileManagement isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </main>
      </div>
  );
}
