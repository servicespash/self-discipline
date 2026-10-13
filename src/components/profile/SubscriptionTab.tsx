import React from 'react';

interface SubscriptionTabProps {
  session: any;
  setActiveTab: (tab: string) => void;
  onExport: () => void;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ session, setActiveTab, onExport }) => (
  <div className="space-y-4">
    <div className="p-4 bg-gray-950 rounded-2xl border border-emerald-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">Active Subscription Tier</h3>
        <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
          {(session?.tier || 'free').charAt(0).toUpperCase() + (session?.tier || 'free').slice(1)} Tier (Active)
        </span>
      </div>
      <p className="text-[11px] text-gray-400">
        Your testing sandbox account operates on the secure Free Tier with full Supabase Auth synchronization, dynamic referrals, and native OS sharing.
      </p>
    </div>

    <div className="space-y-2.5">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Advanced Tiers & Licensing</h4>
      
      <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">Reseller & Partner Tier</div>
          <div className="text-[10px] text-gray-400">Commission management and custom partner portals.</div>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono font-bold">
          Coming Soon
        </span>
      </div>

      <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">Team Admin & Multi-Seat Licensing</div>
          <div className="text-[10px] text-gray-400">Batch seat provisioning and institutional governance.</div>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono font-bold">
          Coming Soon
        </span>
      </div>

      <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">Enterprise Sovereign Tier</div>
          <div className="text-[10px] text-gray-400">Dedicated encrypted nodes and custom RLS policies.</div>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 font-mono font-bold">
          Coming Soon
        </span>
      </div>
    </div>

    <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wider text-white">Data Sovereignty & Exit Strategy</h4>
      <p className="text-[11px] text-gray-400">
        Export all local discipline states, prayer logs, and referral records instantly as JSON.
      </p>
      <button
        onClick={onExport}
        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        Export All Account Data (JSON)
      </button>
    </div>
  </div>
);
