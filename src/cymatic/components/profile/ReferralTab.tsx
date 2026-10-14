// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ReferralTabProps {
  userLicense: any;
  shareFeedback: string | null;
  copied: boolean;
  onShare: () => void;
  onCopy: () => void;
}

export const ReferralTab: React.FC<ReferralTabProps> = ({ 
  userLicense, shareFeedback, copied, onShare, onCopy 
}) => (
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
          onClick={onShare}
          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <Share2 size={13} />
          <span>OS Share</span>
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Referred User Leads ({userLicense.referredUsers?.length || 0})</h3>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {userLicense.referredUsers && userLicense.referredUsers.length > 0 ? (
          userLicense.referredUsers.map((lead: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-950 rounded-xl border border-gray-800 text-xs">
              <span className="font-bold text-white truncate">{lead.moniker || lead.email.split('@')[0]}</span>
              <span className="text-[10px] text-emerald-400 font-mono">{new Date(lead.joinedAt).toLocaleDateString()}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 text-xs font-mono bg-gray-950/50 rounded-xl border border-gray-800">
            No referred user signups yet. Share your code to grow your network!
          </div>
        )}
      </div>
    </div>
  </div>
);
