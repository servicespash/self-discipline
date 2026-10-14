// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dynamic Multi-Seat Licensing & Referral Propagation Engine
 * Powered by Supabase & Local Cache with OS Native Share
 */

import { supabase } from './supabase';

export interface AssignedSeatMember {
  seatId: string;
  email: string;
  assignedAt: string;
  status: 'Active' | 'Pending' | 'Revoked';
}

export interface ReferredUserLead {
  uid: string;
  email: string;
  moniker?: string;
  joinedAt: string;
}

export interface DynamicReferralLicense {
  id: string; // Document ID (e.g. LIC-REF-LATIF-84A)
  licenseKey: string;
  referralCode: string;
  ownerUid: string;
  ownerEmail: string;
  ownerMoniker: string;
  tier: 'Team' | 'Enterprise' | 'Reseller Pro' | 'Individual';
  totalSeats: number;
  usedSeats: number;
  clicks: number;
  assignedMembers: AssignedSeatMember[];
  referredUsers: ReferredUserLead[];
  status: 'Active' | 'Exhausted' | 'Revoked';
  createdAt: string;
  updatedAt: string;
}

export interface ReferralResolution {
  valid: boolean;
  referralCode: string;
  ownerMoniker?: string;
  ownerEmail?: string;
  tier?: string;
  totalSeats?: number;
  usedSeats?: number;
}

const LOCAL_STORAGE_LICENSES_KEY = 'sdc_dynamic_referral_licenses_v2';
export const PENDING_REFERRAL_CODE_KEY = 'sdc_pending_incoming_referral_code';
export const ACTIVE_REFERRER_META_KEY = 'sdc_active_referrer_meta';

export function loadLocalLicenses(): DynamicReferralLicense[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LICENSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Licensing] Local license load warning:', e);
  }
  return [];
}

export function saveLocalLicenses(licenses: DynamicReferralLicense[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_LICENSES_KEY, JSON.stringify(licenses));
  } catch (e) {
    console.warn('[Licensing] Local license save warning:', e);
  }
}

/**
 * Deduplicate an array of licenses strictly by unique license ID
 */
export function deduplicateLicenses(licenses: DynamicReferralLicense[]): DynamicReferralLicense[] {
  if (!Array.isArray(licenses)) return [];
  const seen = new Set<string>();
  const result: DynamicReferralLicense[] = [];
  for (const lic of licenses) {
    if (!lic || !lic.id) continue;
    const key = String(lic.id).trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ ...lic, id: key });
    }
  }
  return result;
}

/**
 * Generate a cryptographically distinct, dynamic referral code
 */
export function generateDynamicReferralCode(moniker: string): string {
  const cleanPrefix = moniker
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5) || 'CYM';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  return `REF-${cleanPrefix}-${randomSuffix}${timestampSuffix}`;
}

/**
 * Build dynamic shareable URL pointing to current deployment with referral param
 */
export function buildShareableReferralLink(referralCode: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#/?ref=${encodeURIComponent(referralCode.trim().toUpperCase())}`;
}

/**
 * Extract referral code from URL search queries, hash routes, or deep links
 */
export function extractReferralCodeFromUrl(): string | null {
  try {
    const fullHref = window.location.href;
    const searchParams = new URLSearchParams(window.location.search);
    const codeFromSearch = searchParams.get('ref') || searchParams.get('referral');
    if (codeFromSearch && codeFromSearch.trim()) {
      return codeFromSearch.trim().toUpperCase();
    }

    const hash = window.location.hash;
    if (hash.includes('?')) {
      const hashQuery = hash.substring(hash.indexOf('?') + 1);
      const hashParams = new URLSearchParams(hashQuery);
      const codeFromHash = hashParams.get('ref') || hashParams.get('referral');
      if (codeFromHash && codeFromHash.trim()) {
        return codeFromHash.trim().toUpperCase();
      }
    }

    const regexMatch = fullHref.match(/[?&](?:ref|referral)=([a-zA-Z0-9\-_]+)/i);
    if (regexMatch && regexMatch[1]) {
      return regexMatch[1].trim().toUpperCase();
    }
  } catch (err) {
    console.warn('[Licensing] URL referral code extraction exception:', err);
  }
  return null;
}

/**
 * Trigger User's OS Native Share Sheet (with graceful clipboard fallback)
 */
export async function triggerNativeReferralShare(
  referralCode: string, 
  ownerMoniker: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'dismissed'; message: string }> {
  const cleanCode = referralCode.trim().toUpperCase();
  const shareUrl = buildShareableReferralLink(cleanCode);
  const shareData = {
    title: `Cymatic Discipline OS // Invitation from ${ownerMoniker}`,
    text: `Take control of your focus with Cymatic Discipline OS. Provisioned referral access code from ${ownerMoniker}: ${cleanCode}`,
    url: shareUrl
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully via OS native share sheet.'
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'dismissed',
          message: 'Share sheet dismissed.'
        };
      }
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return {
        success: true,
        method: 'clipboard',
        message: 'Shareable referral link copied to clipboard!'
      };
    }
  } catch (clipErr) {
    console.error('[Licensing] Clipboard copy error:', clipErr);
  }

  return {
    success: true,
    method: 'clipboard',
    message: `Referral Link: ${shareUrl}`
  };
}

/**
 * Create a new dynamic referral license in Supabase and local cache
 */
export async function createDynamicReferralLicense(params: {
  ownerUid: string;
  ownerEmail: string;
  ownerMoniker: string;
  tier: 'Team' | 'Enterprise' | 'Reseller Pro' | 'Individual';
  totalSeats: number;
}): Promise<DynamicReferralLicense> {
  const licenseKey = `LIC-KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const referralCode = generateDynamicReferralCode(params.ownerMoniker);
  const now = new Date().toISOString();

  const newLicense: DynamicReferralLicense = {
    id: `lic_${Math.random().toString(36).substring(2, 9)}`,
    licenseKey,
    referralCode,
    ownerUid: params.ownerUid,
    ownerEmail: params.ownerEmail,
    ownerMoniker: params.ownerMoniker,
    tier: params.tier,
    totalSeats: params.totalSeats,
    usedSeats: 0,
    clicks: 0,
    assignedMembers: [],
    referredUsers: [],
    status: 'Active',
    createdAt: now,
    updatedAt: now
  };

  try {
    await supabase.from('licenses').insert([{
      license_key: licenseKey,
      referral_code: referralCode,
      owner_uid: params.ownerUid,
      owner_email: params.ownerEmail,
      owner_moniker: params.ownerMoniker,
      tier: params.tier,
      total_seats: params.totalSeats,
      used_seats: 0,
      clicks: 0,
      assigned_members: [],
      referred_users: [],
      status: 'Active'
    }]);
  } catch (err) {
    console.warn('[Licensing] Supabase create license warning:', err);
  }

  const local = loadLocalLicenses();
  const updated = deduplicateLicenses([newLicense, ...local]);
  saveLocalLicenses(updated);

  return newLicense;
}

/**
 * Assign a seat to an email address
 */
export async function assignSeatToEmail(
  licenseId: string,
  memberEmail: string,
  ownerUid: string
): Promise<{ success: boolean; message: string; updatedLicense?: DynamicReferralLicense }> {
  const cleanEmail = memberEmail.trim().toLowerCase();
  const local = loadLocalLicenses();
  const licenseIndex = local.findIndex(l => l.id === licenseId);

  if (licenseIndex === -1) {
    return { success: false, message: 'License record not found.' };
  }

  const license = local[licenseIndex];
  if (license.usedSeats >= license.totalSeats) {
    return { success: false, message: 'All seats in this license batch are currently exhausted.' };
  }

  const existingMembers = license.assignedMembers || [];
  if (existingMembers.some(m => m.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This email address is already assigned to a seat in this batch.' };
  }

  const newMember: AssignedSeatMember = {
    seatId: `seat_${Math.random().toString(36).substring(2, 8)}`,
    email: cleanEmail,
    assignedAt: new Date().toISOString(),
    status: 'Pending'
  };

  const updatedMembers = [...existingMembers, newMember];
  const activeCount = updatedMembers.filter(m => m.status === 'Active').length;

  const updatedLicense: DynamicReferralLicense = {
    ...license,
    assignedMembers: updatedMembers,
    usedSeats: activeCount,
    updatedAt: new Date().toISOString()
  };

  local[licenseIndex] = updatedLicense;
  saveLocalLicenses(local);

  try {
    await supabase.from('licenses').update({
      assigned_members: updatedMembers,
      used_seats: activeCount,
      updated_at: new Date().toISOString()
    }).eq('referral_code', license.referralCode);
  } catch (err) {
    console.warn('[Licensing] Supabase seat assign update warning:', err);
  }

  // Also record a reseller commission of $0.50 per seat assignment / referral deal
  try {
    await supabase.from('reseller_commissions').insert([{
      reseller_uid: ownerUid,
      referred_user_uid: cleanEmail,
      commission_amount: 0.50,
      status: 'Pending'
    }]);
  } catch {}

  return { success: true, message: `Seat successfully bound and assigned to ${cleanEmail}`, updatedLicense };
}

/**
 * Revoke an assigned seat
 */
export async function revokeSeatAssignment(
  licenseId: string,
  seatId: string,
  ownerUid: string
): Promise<{ success: boolean; message: string; updatedLicense?: DynamicReferralLicense }> {
  const local = loadLocalLicenses();
  const licenseIndex = local.findIndex(l => l.id === licenseId);
  if (licenseIndex === -1) {
    return { success: false, message: 'License record not found.' };
  }

  const license = local[licenseIndex];
  const updatedMembers = (license.assignedMembers || []).filter(m => m.seatId !== seatId);
  const activeCount = updatedMembers.filter(m => m.status === 'Active').length;

  const updatedLicense: DynamicReferralLicense = {
    ...license,
    assignedMembers: updatedMembers,
    usedSeats: activeCount,
    status: 'Active',
    updatedAt: new Date().toISOString()
  };

  local[licenseIndex] = updatedLicense;
  saveLocalLicenses(local);

  try {
    await supabase.from('licenses').update({
      assigned_members: updatedMembers,
      used_seats: activeCount,
      status: 'Active',
      updated_at: new Date().toISOString()
    }).eq('referral_code', license.referralCode);
  } catch (err) {
    console.warn('[Licensing] Supabase seat revoke warning:', err);
  }

  return { success: true, message: 'Seat assignment revoked successfully.', updatedLicense };
}

/**
 * Resolve details of a referral code from Supabase or local cache
 */
export async function resolveReferralInfo(referralCode: string): Promise<ReferralResolution | null> {
  if (!referralCode || !referralCode.trim()) return null;
  const cleanCode = referralCode.trim().toUpperCase();

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('referral_code', cleanCode)
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      return {
        valid: true,
        referralCode: cleanCode,
        ownerMoniker: row.owner_moniker,
        ownerEmail: row.owner_email,
        tier: row.tier,
        totalSeats: row.total_seats,
        usedSeats: row.used_seats
      };
    }
  } catch (err) {
    console.warn('[Licensing] Remote resolve error:', err);
  }

  const local = loadLocalLicenses();
  const match = local.find(l => l.referralCode === cleanCode);
  if (match) {
    return {
      valid: true,
      referralCode: cleanCode,
      ownerMoniker: match.ownerMoniker,
      ownerEmail: match.ownerEmail,
      tier: match.tier,
      totalSeats: match.totalSeats,
      usedSeats: match.usedSeats
    };
  }

  return null;
}

/**
 * Track an incoming referral visit/click
 */
export async function trackReferralVisit(
  referralCode: string
): Promise<{ success: boolean; info?: ReferralResolution }> {
  if (!referralCode || !referralCode.trim()) return { success: false };
  const cleanCode = referralCode.trim().toUpperCase();

  try {
    localStorage.setItem(PENDING_REFERRAL_CODE_KEY, cleanCode);
  } catch {}

  const resolved = await resolveReferralInfo(cleanCode);
  if (resolved) {
    try {
      localStorage.setItem(ACTIVE_REFERRER_META_KEY, JSON.stringify(resolved));
      try {
        await supabase.rpc('increment_clicks', { ref_code: cleanCode });
      } catch {}
    } catch {}
    return { success: true, info: resolved };
  }

  return { success: false };
}

/**
 * Record a user authentication/redemption against originating referral code
 */
export async function recordReferralRedemption(
  newUserUid: string,
  newUserEmail: string,
  newUserMoniker?: string
): Promise<{ redeemed: boolean; referralCode?: string; ownerMoniker?: string }> {
  let pendingCode: string | null = null;
  try {
    pendingCode = localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
  } catch {
    return { redeemed: false };
  }

  if (!pendingCode) return { redeemed: false };
  const cleanCode = pendingCode.trim().toUpperCase();
  const cleanEmail = newUserEmail.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('referral_code', cleanCode)
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      const existingReferred = row.referred_users || [];
      const alreadyRecorded = existingReferred.some((u: any) => u.uid === newUserUid || u.email?.toLowerCase() === cleanEmail);

      let updatedReferred = existingReferred;
      if (!alreadyRecorded) {
        updatedReferred = [
          ...existingReferred,
          {
            uid: newUserUid,
            email: cleanEmail,
            moniker: newUserMoniker || cleanEmail.split('@')[0],
            joinedAt: new Date().toISOString()
          }
        ];
      }

      let updatedMembers = row.assigned_members || [];
      updatedMembers = updatedMembers.map((m: any) => {
        if (m.email?.toLowerCase() === cleanEmail && m.status === 'Pending') {
          return { ...m, status: 'Active' };
        }
        return m;
      });

      const activeSeatsCount = updatedMembers.filter((m: any) => m.status === 'Active').length;

      await supabase.from('licenses').update({
        referred_users: updatedReferred,
        assigned_members: updatedMembers,
        used_seats: activeSeatsCount,
        status: activeSeatsCount >= row.total_seats ? 'Exhausted' : 'Active',
        updated_at: new Date().toISOString()
      }).eq('referral_code', cleanCode);

      // Trigger silent commission check: after 10 verified referral signups, trigger $1 commission
      if (updatedReferred.length >= 10 && updatedReferred.length % 10 === 0) {
        try {
          await supabase.from('reseller_commissions').insert([{
            reseller_uid: row.owner_uid,
            referred_user_uid: newUserUid,
            commission_amount: 1.00,
            status: 'Triggered'
          }]);
        } catch {}
      }

      try {
        localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
      } catch {}

      return {
        redeemed: true,
        referralCode: cleanCode,
        ownerMoniker: row.owner_moniker
      };
    }
  } catch (err) {
    console.warn('[Licensing] Supabase redemption recording warning:', err);
  }

  // Local fallback
  try {
    const local = loadLocalLicenses();
    const match = local.find(l => l.referralCode === cleanCode);
    if (match) {
      const existingReferred = match.referredUsers || [];
      if (!existingReferred.some(u => u.uid === newUserUid || u.email.toLowerCase() === cleanEmail)) {
        match.referredUsers = [
          ...existingReferred,
          {
            uid: newUserUid,
            email: cleanEmail,
            moniker: newUserMoniker || cleanEmail.split('@')[0],
            joinedAt: new Date().toISOString()
          }
        ];
        match.updatedAt = new Date().toISOString();
        saveLocalLicenses(local);
      }
      localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
      return { redeemed: true, referralCode: cleanCode, ownerMoniker: match.ownerMoniker };
    }
  } catch {}

  return { redeemed: false, referralCode: cleanCode };
}

/**
 * Fetch or initialize dynamic referral licenses for the originating user
 */
export async function getOriginatingUserLicenses(
  ownerUid: string, 
  ownerEmail: string, 
  ownerMoniker: string
): Promise<DynamicReferralLicense[]> {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('owner_uid', ownerUid);

    if (!error && data && data.length > 0) {
      const mapped: DynamicReferralLicense[] = data.map((row: any) => ({
        id: row.id,
        licenseKey: row.license_key,
        referralCode: row.referral_code,
        ownerUid: row.owner_uid,
        ownerEmail: row.owner_email,
        ownerMoniker: row.owner_moniker,
        tier: row.tier,
        totalSeats: row.total_seats,
        usedSeats: row.used_seats,
        clicks: row.clicks || 0,
        assignedMembers: row.assigned_members || [],
        referredUsers: row.referred_users || [],
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      const deduped = deduplicateLicenses(mapped);
      saveLocalLicenses(deduped);
      return deduped;
    }
  } catch (err) {
    console.warn('[Licensing] Supabase load licenses warning:', err);
  }

  const local = loadLocalLicenses();
  const userLocal = deduplicateLicenses(local.filter(l => l.ownerUid === ownerUid));
  if (userLocal.length > 0) {
    return userLocal;
  }

  const initialLicense = await createDynamicReferralLicense({
    ownerUid,
    ownerEmail,
    ownerMoniker,
    tier: 'Team',
    totalSeats: 10
  });

  return [initialLicense];
}

/**
 * Real-time subscription to originating user's dynamic referral licenses
 */
export function subscribeToOriginatingUserLicenses(
  ownerUid: string,
  onUpdate: (licenses: DynamicReferralLicense[]) => void,
  _onError?: (error: any) => void
): () => void {
  try {
    const channel = supabase
      .channel(`public:licenses:ownerUid=eq.${ownerUid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licenses',
          filter: `owner_uid=eq.${ownerUid}`
        },
        async () => {
          // Re-fetch on change
          const updated = await getOriginatingUserLicenses(ownerUid, '', '');
          onUpdate(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
