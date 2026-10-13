import React from 'react';
import { Shield, Sparkles, Terminal } from 'lucide-react';
import { LegalTabType } from './LegalTrustModal';
import { ReferralResolution } from '../utils/licensing';

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
  return (
    <div className="h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-8 text-gray-100 font-sans">
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
                <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                  Authenticating your workspace below automatically binds your session to this referral and activates your allocated team seat in the database.
                </p>
              </div>
            </div>
        )}

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
