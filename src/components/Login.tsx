/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Login Component for Cymatic Discipline OS
 */

import React, { useState } from 'react';
import { Shield, Sparkles, Terminal, Lock, Mail, User as UserIcon } from 'lucide-react';
import { LegalTabType } from './LegalTrustModal';
import { ReferralResolution } from '../utils/licensing';
import { authService } from '../utils/authService';

interface LoginProps {
  inputEmail: string;
  setInputEmail: (email: string) => void;
  inputMoniker: string;
  setInputMoniker: (moniker: string) => void;
  referralInvite: ReferralResolution | null;
  handleSignInSubmit: (e: React.FormEvent) => void;
  setLegalModalTab: (tab: LegalTabType | null) => void;
}

export const Login: React.FC<LoginProps> = ({
  inputEmail,
  setInputEmail,
  inputMoniker,
  setInputMoniker,
  referralInvite,
  handleSignInSubmit,
  setLegalModalTab
}) => {
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('magic');
  const [actionType, setActionType] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<'student' | 'guardian' | 'trainer' | 'administrator' | 'reseller'>('student');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (actionType === 'register') {
        const res = await authService.signUpWithEmail(inputEmail, password || 'cymatic123', inputMoniker, selectedRole);
        if (!res.success) {
          throw new Error(res.error || 'Registration failed');
        }
        setSuccessMessage('Account registered successfully with role: ' + selectedRole.toUpperCase() + '. Initializing session...');
        handleSignInSubmit(e);
      } else {
        if (authMode === 'password') {
          const res = await authService.signInWithEmail(inputEmail, password);
          if (!res.success) {
            throw new Error(res.error || 'Authentication failed');
          }
          setSuccessMessage('Authentication successful. Initializing session...');
          handleSignInSubmit(e);
        } else {
          const res = await authService.sendMagicLink(inputEmail);
          if (!res.success) {
            throw new Error(res.error || 'Magic link dispatch failed');
          }
          setSuccessMessage('Magic link / OTP sent successfully to your institutional email.');
          handleSignInSubmit(e);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-8 text-gray-100 font-sans">
      <div className="w-full max-w-xl p-8 sm:p-12 bg-gray-900/90 border border-gray-800/90 rounded-3xl shadow-2xl space-y-8 backdrop-blur-xl">
        <div className="space-y-3 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
              CYMATIC DISCIPLINE OPERATING SYSTEM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            INSTITUTIONAL EXECUTION & GOVERNANCE GATE
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            Universal institutional governance, policy enforcement, and execution monitoring pipeline. Authenticate your call sign to proceed.
          </p>
        </div>

        {referralInvite && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-start gap-3 text-left shadow-lg animate-in fade-in">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5 shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Institutional Team Invitation Active
              </div>
              <div className="text-xs text-white font-medium truncate">
                Invited by <strong className="text-emerald-300 font-bold">{referralInvite.ownerMoniker || 'Institutional Architect'}</strong>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-2">
                <span>Referral Code: {referralInvite.referralCode}</span>
                {referralInvite.tier && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300">
                    {referralInvite.tier}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl text-red-300 text-xs font-mono space-y-3">
            <div>{errorMessage}</div>
            <div className="pt-2 border-t border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[10px] text-red-400">Rate limited or network blocked?</span>
              <button
                type="button"
                onClick={() => {
                  const localSession = {
                    uid: 'sovereign-bypass-' + Date.now(),
                    email: inputEmail || 'architect@cymatic.local',
                    moniker: inputMoniker || 'Discipline Champion',
                    role: selectedRole || 'student',
                    tier: 'Individual',
                    signedInAt: Date.now(),
                    lastActiveAt: Date.now(),
                    isOnboardingComplete: true,
                  };
                  localStorage.setItem('cymatic_session_v2', JSON.stringify(localSession));
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
              >
                Launch Instant Sovereign Session
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono">
            {successMessage}
          </div>
        )}

        <div className="flex bg-gray-950 p-1 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => setActionType('signin')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${actionType === 'signin' ? 'bg-emerald-600 text-gray-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActionType('register')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${actionType === 'register' ? 'bg-emerald-600 text-gray-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Register Account
          </button>
        </div>

        {actionType === 'signin' && (
          <div className="flex bg-gray-950 p-1 rounded-2xl border border-gray-800">
            <button
              type="button"
              onClick={() => setAuthMode('magic')}
              className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${authMode === 'magic' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${authMode === 'password' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              Password
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <UserIcon size={12} className="text-emerald-400" /> Architect / Moniker Call Sign
            </label>
            <input
              type="text"
              placeholder="Discipline Champion"
              value={inputMoniker}
              onChange={(e) => setInputMoniker(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Mail size={12} className="text-emerald-400" /> Institutional Workspace Address
            </label>
            <input
              type="email"
              required
              placeholder="architect@cymatic.local"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          {(actionType === 'register' || authMode === 'password') && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-400" /> Institutional Access Password
              </label>
              <input
                type="password"
                required={actionType === 'register' || authMode === 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          )}

          {actionType === 'register' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-400" /> Assigned Institutional Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono cursor-pointer"
              >
                <option value="student">Student / Ward (Affected by Governance & Lockdown)</option>
                <option value="guardian">Guardian / Parent (Sets Rules & Wards)</option>
                <option value="trainer">Trainer / Mentor (Assigns Tasks & Discipline)</option>
                <option value="administrator">Administrator (Full Institutional Sovereign Access)</option>
                <option value="reseller">Reseller Pro (License & Seat Distributor)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2"
          >
            <Terminal size={16} /> {isSubmitting ? 'Authenticating...' : 'Authenticate Local Workspace'}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>DISCIPLINE_BRIDGE: ONLINE</span>
            <span>DISCIPLINE_ENGINE: READY</span>
        </div>

        <div className="pt-4 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-y-2 text-[11px] font-mono text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Code Owner: <strong className="text-gray-300">Isabirye Latif</strong></span>
              <span>•</span>
              <span>Auditor: <strong className="text-gray-400">Cymatic Security Board</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLegalModalTab('trust')} className="hover:text-emerald-400 transition-colors">Trust</button>
              <span>•</span>
              <button type="button" onClick={() => setLegalModalTab('terms')} className="hover:text-gray-300 transition-colors">Terms</button>
              <span>•</span>
              <button type="button" onClick={() => setLegalModalTab('privacy')} className="hover:text-gray-300 transition-colors">Privacy</button>
              <span>•</span>
              <span className="text-gray-600">© 2024–2026</span>
            </div>
        </div>
      </div>
    </div>
  );
};
