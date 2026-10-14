// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Reseller, Multi-Seat Team Billing & Dynamic Referral Center
 * Free Tier is the only active functional tier with unlimited referrals.
 * Enterprise & Institutional tiers are marked as Coming Soon.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import { 
  DynamicReferralLicense, 
  getOriginatingUserLicenses, 
  subscribeToOriginatingUserLicenses,
  triggerNativeReferralShare,
  buildShareableReferralLink,
  deduplicateLicenses
} from '../utils/licensing';
import { 
  DollarSign, 
  Users, 
  Award, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Search,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function ResellerManager() {
  const { session } = useSession();
  const [licenses, setLicenses] = useState<DynamicReferralLicense[]>([]);
  const [activeLicenseId, setActiveLicenseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchLeadQuery, setSearchLeadQuery] = useState<string>('');

  // UI Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const userMoniker = session?.moniker || 'Architect';
  const userEmail = session?.email || 'architect@cymatic.local';
  const userUid = session?.uid || 'local-user';

  const uniqueLicenses = useMemo(() => deduplicateLicenses(licenses), [licenses]);

  // Load originating user's dynamic referral licenses & subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    getOriginatingUserLicenses(userUid, userEmail, userMoniker).then((userLicenses) => {
      const deduped = deduplicateLicenses(userLicenses);
      setLicenses(deduped);
      if (deduped.length > 0) {
        setActiveLicenseId(prev => (prev && deduped.some(l => l.id === prev) ? prev : deduped[0].id));
      }
      setLoading(false);
    });

    const unsubscribe = subscribeToOriginatingUserLicenses(userUid, (liveLicenses) => {
      const deduped = deduplicateLicenses(liveLicenses);
      setLicenses(deduped);
      if (deduped.length > 0) {
        setActiveLicenseId(prev => (prev && deduped.some(l => l.id === prev) ? prev : deduped[0].id));
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userUid, userEmail, userMoniker]);

  const activeLicense = uniqueLicenses.find(l => l.id === activeLicenseId) || uniqueLicenses[0] || null;

  // OS Native Share Trigger (Unlimited for Free Tier)
  const handleNativeShare = async () => {
    if (!activeLicense) return;
    const result = await triggerNativeReferralShare(activeLicense.referralCode, userMoniker);
    showToast(result.message);
  };

  // Copy Link (Unlimited for Free Tier)
  const handleCopyLink = async () => {
    if (!activeLicense) return;
    const url = buildShareableReferralLink(activeLicense.referralCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Referral deep-link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(`Link: ${url}`);
    }
  };

  // Enterprise Tier Opt-In Alert (Coming Soon)
  const handleEnterpriseTierClick = (tierName: string) => {
    showToast(`The ${tierName} Tier is Coming Soon. Currently, the Free Tier is 100% active with unlimited referrals.`);
  };

  // Aggregated Metrics
  const totalClicksTracked = uniqueLicenses.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const totalReferredSignups = uniqueLicenses.reduce((sum, l) => sum + (l.referredUsers?.length || 0), 0);

  // Filtered Leads
  const filteredReferredUsers = useMemo(() => {
    if (!activeLicense?.referredUsers) return [];
    if (!searchLeadQuery.trim()) return activeLicense.referredUsers;
    const q = searchLeadQuery.toLowerCase();
    return activeLicense.referredUsers.filter(u => 
      (u.moniker || '').toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );
  }, [activeLicense, searchLeadQuery]);

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto min-w-0">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-3 bg-emerald-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-gray-900 to-gray-950 border border-emerald-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ShieldCheck size={12} /> Free Tier Active (Unlimited Referrals)
              </span>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1">
                <Clock size={11} /> Enterprise Tiers: Coming Soon
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wider uppercase">
              Referrals & Team Seat Center
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-2xl font-mono leading-relaxed">
              The Free Tier is fully functional. You can share your link and refer as many users, peers, and collaborators as you wish with zero restrictions. Enterprise multi-seat institutional tiers will be introduced in an upcoming release.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-4 py-2.5 sm:px-5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Share2 size={16} /> Share Referral Link
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Share2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Total Clicks Tracked</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">{totalClicksTracked}</div>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Referred Signups</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">{totalReferredSignups}</div>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Active Working Tier</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono uppercase">Free Tier (100% Active)</div>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Enterprise Team Seats</div>
            <div className="text-sm font-black text-amber-400 mt-1 font-mono uppercase flex items-center gap-1">
              <Clock size={12} /> Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Referral Code & Subscription Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Referral License & Referred Users List */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          
          {/* Active Referral Card */}
          {activeLicense ? (
            <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-4 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Dynamic Referral License</h2>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Share your personal referral code to invite new members to Cymatic OS.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
                  Free Tier (Unlimited Referrals)
                </span>
              </div>

              {/* Referral Code Box */}
              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="font-mono font-black text-xl text-emerald-400 tracking-wider text-center sm:text-left select-all">
                  {activeLicense.referralCode}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 size={14} /> OS Share
                  </button>
                </div>
              </div>

              {/* Referred User Signups List */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Users size={14} className="text-emerald-400" /> Referred User Signups ({activeLicense.referredUsers?.length || 0})
                  </h3>

                  {activeLicense.referredUsers && activeLicense.referredUsers.length > 3 && (
                    <div className="relative w-full sm:w-48">
                      <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search signups..."
                        value={searchLeadQuery}
                        onChange={e => setSearchLeadQuery(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-gray-600 outline-none font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredReferredUsers && filteredReferredUsers.length > 0 ? (
                    filteredReferredUsers.map((lead, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-950 rounded-2xl border border-gray-800 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0">
                            {(lead.moniker || lead.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{lead.moniker || lead.email.split('@')[0]}</div>
                            <div className="text-[10px] text-gray-400 font-mono truncate">{lead.email}</div>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0 ml-2">
                          {new Date(lead.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs font-mono bg-gray-950/50 rounded-2xl border border-gray-800 p-4">
                      {searchLeadQuery 
                        ? 'No referred signups match your search.' 
                        : 'No referred user signups recorded yet. Share your referral link above to invite other users to Cymatic OS!'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-gray-900/60 rounded-3xl border border-gray-800 text-center text-xs font-mono text-gray-400">
              Generating your personal Free Tier dynamic referral license...
            </div>
          )}

        </div>

        {/* Right Col: Subscription Tiers with Coming Soon Badges */}
        <div className="space-y-6">
          <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-4 sm:p-6 space-y-4">
            <div className="border-b border-gray-800 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Award size={14} className="text-emerald-400" /> Platform Tiers & Institutional Seats
              </h2>
              <p className="text-[11px] text-gray-400 font-mono mt-1">
                The Free Tier is currently the only active working tier. Enterprise and multi-seat tiers are coming soon.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { 
                  name: 'Individual Free Tier', 
                  price: 'Free ($0)', 
                  desc: 'The only currently active tier. Full access to OS, unlimited referrals, habit formation, and discipline hubs.', 
                  active: true,
                  comingSoon: false 
                },
                { 
                  name: 'Team Admin Seats', 
                  price: '$29/mo', 
                  desc: 'Multi-seat team allocations and synchronized institutional dashboards. Coming Soon.', 
                  active: false,
                  comingSoon: true 
                },
                { 
                  name: 'Reseller Pro Tier', 
                  price: '$49/mo', 
                  desc: 'Advanced affiliate and reseller dynamic commission routing. Coming Soon.', 
                  active: false,
                  comingSoon: true 
                },
                { 
                  name: 'Enterprise Sovereign', 
                  price: '$199/mo', 
                  desc: 'Full enterprise sovereign database deployment and unlimited team seat control. Coming Soon.', 
                  active: false,
                  comingSoon: true 
                },
              ].map((tier) => (
                <div 
                  key={tier.name} 
                  className={`p-4 rounded-2xl border transition-all ${
                    tier.active 
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20' 
                      : 'bg-gray-950/70 border-gray-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white uppercase flex items-center gap-1.5">
                      {tier.name}
                      {tier.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </span>
                    <span className="font-mono font-black text-xs text-emerald-400">{tier.price}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mb-3 leading-relaxed">{tier.desc}</p>
                  
                  {tier.active ? (
                    <div className="w-full py-2 bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-xl font-black text-[10px] uppercase text-center flex items-center justify-center gap-1.5 shadow-sm">
                      <Check size={12} className="text-emerald-400" /> Current Functional Tier (Active)
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEnterpriseTierClick(tier.name)}
                      className="w-full py-2 bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-amber-300 border border-gray-800 hover:border-amber-500/30 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Clock size={12} className="text-amber-400" /> Coming Soon (Enterprise)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
