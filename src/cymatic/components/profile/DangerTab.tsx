import React from 'react';
import { ShieldAlert, LogOut, Trash2 } from 'lucide-react';

interface DangerTabProps {
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export const DangerTab: React.FC<DangerTabProps> = ({ onSignOut, onDeleteAccount }) => (
  <div className="space-y-4">
    <div className="p-4 bg-red-950/35 rounded-2xl border border-red-500/30 space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
        <ShieldAlert size={14} /> Account Danger Zone
      </h3>
      <p className="text-[11px] text-gray-300">
        Sign out of your active session or permanently delete your account and all associated local and Supabase cloud records.
      </p>

      <div className="pt-2 space-y-2">
        <button
          onClick={onSignOut}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut size={16} /> Sign Out of Session
        </button>

        <button
          onClick={onDeleteAccount}
          className="w-full py-3 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/50 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <Trash2 size={16} /> Delete Account & Wipe Data
        </button>
      </div>
    </div>
  </div>
);
