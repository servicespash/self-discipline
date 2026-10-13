import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProfileTabProps {
  moniker: string;
  setMoniker: (m: string) => void;
  workTitle: string;
  setWorkTitle: (w: string) => void;
  session: any;
  handleSaveProfile: (e: React.FormEvent) => void;
  setActiveTab: (tab: string) => void;
  saveToast: string | null;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ 
  moniker, setMoniker, workTitle, setWorkTitle, session, handleSaveProfile, setActiveTab, saveToast 
}) => (
  <form onSubmit={handleSaveProfile} className="space-y-4">
    {saveToast && (
      <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl text-center animate-in fade-in">
        {saveToast}
      </div>
    )}
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
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Professional Role / Specialty</label>
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
        <div className="text-xs font-black text-emerald-400 mt-1">{session?.role || 'User'}</div>
      </div>
      <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
        <div className="text-[9px] text-gray-500 uppercase font-bold">System UID</div>
        <div className="text-[10px] font-mono text-gray-300 mt-1 truncate">{session?.uid || 'local'}</div>
      </div>
    </div>

    <div className="p-3 bg-gray-950 rounded-xl border border-emerald-500/20 flex items-center justify-between">
      <div>
        <div className="text-[9px] text-gray-500 uppercase font-bold">Subscription Tier</div>
        <div className="text-xs font-black text-white mt-1">{(session?.tier || 'free').charAt(0).toUpperCase() + (session?.tier || 'free').slice(1)} Tier (Active)</div>
      </div>
      <button 
        type="button"
        onClick={() => setActiveTab('subscription')}
        className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 cursor-pointer"
      >
        View Details
      </button>
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
      Save Profile Changes
    </button>
  </form>
);
