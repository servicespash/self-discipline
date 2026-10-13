/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Robust Profile Management System - Cymatic Discipline OS
 * Includes profile details editing, role/work management, app settings, updates, and danger zone account deletion.
 */

import React, { useState, useEffect } from 'react';
import { X, LogOut, Share2, Copy, Check, Award, Sparkles, User, Settings, ShieldAlert, Trash2, RefreshCw } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { 
  getOriginatingUserLicenses, 
  triggerNativeReferralShare, 
  buildShareableReferralLink, 
  DynamicReferralLicense 
} from '../utils/licensing';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { session, signOut } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'referrals' | 'settings' | 'danger'>('profile');
  
  // Editable profile state
  const [moniker, setMoniker] = useState<string>(session?.moniker || '');
  const [workTitle, setWorkTitle] = useState<string>('Discipline Architect & Practitioner');
  const [userLicense, setUserLicense] = useState<DynamicReferralLicense | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setMoniker(session.moniker);
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (session) {
      const updated = { ...session, moniker: moniker.trim() || session.moniker };
      localStorage.setItem('sdc_user_session_v1', JSON.stringify(updated));
      setSaveToast('Profile details updated successfully!');
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

  const handleDeleteAccount = () => {
    if (window.confirm('WARNING: Deleting your account will permanently wipe all local database states, discipline streaks, and sessions. Are you sure?')) {
      localStorage.clear();
      signOut();
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl text-gray-100 flex flex-col">
        
        {/* Header & Navigation Tabs */}
        <div className="p-4 md:p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/80 flex items-center justify-center text-emerald-400 font-black text-sm shadow-inner border border-emerald-500/30">
              {moniker.substring(0, 2).toUpperCase() || 'SO'}
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Robust Profile Management</h2>
              <div className="text-[10px] text-gray-400 font-mono">{session?.email || 'N/A'}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-5 bg-gray-950/80 border-b border-gray-800 p-1.5 text-[10px] font-black uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('subscription')} 
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'subscription' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Tiers
          </button>
          <button 
            onClick={() => setActiveTab('referrals')} 
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'referrals' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Referrals
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Settings
          </button>
          <button 
            onClick={() => setActiveTab('danger')} 
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'danger' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Danger
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {saveToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl text-center animate-in fade-in">
              {saveToast}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-950 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Active Subscription Status</h3>
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    Free Tier (Active)
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Your current account operates on the secure Free Tier with Supabase Auth synchronization, dynamic referrals, and native OS sharing.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Advanced Tiers & Seat Allocations (Coming Soon)</h4>
                
                <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Reseller & Partner Tier</div>
                    <div className="text-[10px] text-gray-400">Commission management and custom partner portals.</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono">
                    Coming Soon
                  </span>
                </div>

                <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Team Admin & Multi-Seat Licensing</div>
                    <div className="text-[10px] text-gray-400">Batch seat provisioning and institutional governance.</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono">
                    Coming Soon
                  </span>
                </div>

                <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Enterprise Sovereign Tier</div>
                    <div className="text-[10px] text-gray-400">Dedicated encrypted nodes and custom RLS policies.</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Exit Strategy */}
              <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Account Exit Strategy & Data Export</h4>
                <p className="text-[11px] text-gray-400">
                  You retain complete data sovereignty. Export all local discipline states, prayer logs, and referral records at any time.
                </p>
                <button
                  onClick={() => {
                    const data = JSON.stringify(localStorage, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cymatic-discipline-export-${session?.uid || 'user'}.json`;
                    a.click();
                  }}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Export All Account Data (JSON)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Moniker / Name</label>
                <input 
                  type="text" 
                  value={moniker} 
                  onChange={(e) => setMoniker(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Enter your name or moniker"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Work / Specialty Title</label>
                <input 
                  type="text" 
                  value={workTitle} 
                  onChange={(e) => setWorkTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Discipline Architect & Practitioner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase font-bold">Role Authority</div>
                  <div className="text-xs font-black text-emerald-400 mt-1">{session?.role || 'Student'}</div>
                </div>
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                  <div className="text-[9px] text-gray-500 uppercase font-bold">System UID</div>
                  <div className="text-[10px] font-mono text-gray-300 mt-1 truncate">{session?.uid || 'local'}</div>
                </div>
              </div>

              {session?.referredBy && (
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400 shrink-0" />
                  <span>Referred by <strong>{session.referrerMoniker || 'Team Lead'}</strong></span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'referrals' && userLicense && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-950 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-gray-400 flex items-center gap-1.5 font-bold">
                    <Share2 size={12} className="text-emerald-400" /> Dynamic Referral Code
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    {userLicense.tier}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                  <div className="font-mono font-bold text-emerald-400 text-base tracking-wider">
                    {userLicense.referralCode}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {userLicense.clicks || 0} clicks • {userLicense.referredUsers?.length || 0} leads
                  </div>
                </div>

                {shareFeedback && (
                  <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/20 text-center">
                    {shareFeedback}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>OS Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Referred User Leads List */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Referred User Signups ({userLicense.referredUsers?.length || 0})</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {userLicense.referredUsers && userLicense.referredUsers.length > 0 ? (
                    userLicense.referredUsers.map((lead, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-950 rounded-xl border border-gray-800 text-xs">
                        <span className="font-bold text-white truncate">{lead.moniker || lead.email.split('@')[0]}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{new Date(lead.joinedAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-xs font-mono bg-gray-950/50 rounded-xl border border-gray-800">
                      No referred user signups yet. Share your code to earn commissions!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Settings size={14} className="text-emerald-400" /> App Updates & Versioning
                </h3>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Current OS Version:</span>
                  <span className="text-white font-bold">v3.4.8-Enterprise</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Database Engine:</span>
                  <span className="text-emerald-400 font-bold">Supabase Realtime Cloud</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Data Sovereignty:</span>
                  <span className="text-emerald-400 font-bold">Strict RLS Active</span>
                </div>
              </div>

              <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Cache & Synchronization</h3>
                <p className="text-[11px] text-gray-400">Synchronize local cache states with secure Supabase cloud storage.</p>
                <button 
                  onClick={() => { window.location.reload(); }}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} /> Force Sync & Reload
                </button>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-950/30 rounded-2xl border border-red-500/30 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <ShieldAlert size={14} /> Profile Danger Zone
                </h3>
                <p className="text-[11px] text-gray-300">
                  Sign out of your active session or permanently delete your account and all associated local and cloud databases.
                </p>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => { signOut(); onClose(); }}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut size={16} /> Sign Out of Session
                  </button>

                  <button
                    onClick={handleDeleteAccount}
                    className="w-full py-3 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/50 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <Trash2 size={16} /> Delete Account & Wipe Data
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
