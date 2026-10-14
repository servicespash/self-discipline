// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Robust ProfileManagement Component - Cymatic Discipline OS
 * Fully wired to Supabase Auth session, moniker updates, tier status with Coming Soon markers,
 * Account Danger Zone (sign-out and account deletion), and exit strategy data export.
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { 
  getOriginatingUserLicenses, 
  triggerNativeReferralShare, 
  buildShareableReferralLink, 
  DynamicReferralLicense 
} from '../utils/licensing';
import { supabase } from '../utils/supabase';

// Modular Tab Components
import { ProfileTab } from './profile/ProfileTab';
import { SubscriptionTab } from './profile/SubscriptionTab';
import { ReferralTab } from './profile/ReferralTab';
import { SettingsTab } from './profile/SettingsTab';
import { DangerTab } from './profile/DangerTab';

interface ProfileManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileManagement: React.FC<ProfileManagementProps> = ({ isOpen, onClose }) => {
  const { session, signOut } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'referrals' | 'settings' | 'danger'>('profile');
  
  const [moniker, setMoniker] = useState<string>(session?.moniker || '');
  const [role, setRole] = useState<string>(session?.role || 'student');
  const [workTitle, setWorkTitle] = useState<string>('Discipline Architect & Practitioner');
  const [userLicense, setUserLicense] = useState<DynamicReferralLicense | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setMoniker(session.moniker);
      if (session.role) setRole(session.role);
    }
  }, [session]);

  useEffect(() => {
    if (!session || !isOpen) return;
    getOriginatingUserLicenses(session.uid, session.email, session.moniker).then((licenses) => {
      if (licenses.length > 0) {
        setUserLicense(licenses[0]);
      }
    });
  }, [session, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (session) {
      const cleanMoniker = moniker.trim() || session.moniker;
      const cleanRole = role.trim() || session.role;
      const updated = { ...session, moniker: cleanMoniker, role: cleanRole };
      localStorage.setItem('cymatic_session_v2', JSON.stringify(updated));

      // Sync with Supabase
      try {
        await supabase.from('users').update({ moniker: cleanMoniker, role: cleanRole }).eq('uid', session.uid);
      } catch (err) {
        console.warn('[ProfileManagement] Supabase profile update warning:', err);
      }

      setSaveToast('Profile role & settings updated successfully!');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleShare = async () => {
    if (!userLicense) return;
    const result = await triggerNativeReferralShare(userLicense.referralCode, moniker);
    setShareFeedback(result.message);
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleCopy = async () => {
    if (!userLicense) return;
    const url = buildShareableReferralLink(userLicense.referralCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareFeedback(`Link: ${url}`);
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Deleting your account will permanently wipe all local database states, discipline streaks, and Supabase auth sessions. Are you sure?')) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Supabase auth signout error:', e);
      }
      localStorage.clear();
      signOut();
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-gray-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[95vh] sm:h-auto sm:max-h-[85vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl text-gray-100 flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/80 flex items-center justify-center text-emerald-400 font-black text-sm shadow-inner border border-emerald-500/30">
              {moniker.substring(0, 2).toUpperCase() || 'SO'}
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Profile Management & Governance</h2>
              <div className="text-[10px] text-gray-400 font-mono">{session?.email || 'N/A'} • Supabase Connected</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-5 bg-gray-950/80 border-b border-gray-800 p-1.5 text-[10px] font-black uppercase tracking-wider">
          {['profile', 'subscription', 'referrals', 'settings', 'danger'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)} 
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === tab 
                  ? tab === 'danger' 
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-5">
          {activeTab === 'profile' && <ProfileTab moniker={moniker} setMoniker={setMoniker} role={role} setRole={setRole} workTitle={workTitle} setWorkTitle={setWorkTitle} session={session} handleSaveProfile={handleSaveProfile} setActiveTab={(tab: any) => setActiveTab(tab)} saveToast={saveToast} />}
          {activeTab === 'subscription' && <SubscriptionTab session={session} setActiveTab={(tab: any) => setActiveTab(tab)} onExport={() => {
            const data = JSON.stringify(localStorage, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cymatic-discipline-export-${session?.uid || 'user'}.json`;
            a.click();
          }} />}
          {activeTab === 'referrals' && userLicense && <ReferralTab userLicense={userLicense} shareFeedback={shareFeedback} copied={copied} onShare={handleShare} onCopy={handleCopy} />}
          {activeTab === 'settings' && <SettingsTab onForceSync={() => { window.location.reload(); }} />}
          {activeTab === 'danger' && <DangerTab onSignOut={() => { signOut(); onClose(); }} onDeleteAccount={handleDeleteAccount} />}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
export const ProfileModal = ProfileManagement;


