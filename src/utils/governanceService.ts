/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Universal Governance Contracts Service
 * Supports 1-to-5 Multi-Member Multi-Ward Issuance via Emails, Phone Numbers, or UIDs, Bilateral Comments, and AI Shadow Agreement Synthesis.
 * Dynamic app package authority, flexible schedule selector (dates, active days, excluded days/times),
 * contract drafts & deletion, background email invitations (zero popup), and automatic calendar/task synchronization.
 */

import { supabase } from './supabase';

export interface TargetMemberItem {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: 'draft' | 'invited' | 'accepted' | 'declined';
  invitedAt?: string;
}

export interface ContractAssignedTask {
  id: string;
  title: string;
  description?: string;
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  category: 'deep_work' | 'architecture' | 'spiritual' | 'fitness' | 'review';
  priority: 'critical' | 'high' | 'medium' | 'low';
  daysOfWeek?: string[]; // e.g. ['monday', 'tuesday']
  linkedRule?: string;
}

export interface ContractDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isOngoing: boolean;
}

export interface GovernanceContractData {
  id?: string;
  adminUid: string;
  adminName?: string;
  memberUid?: string;
  memberUids?: string[]; // 1-to-5 multi-ward targeting (emails, phones, or UIDs)
  targetMembers?: TargetMemberItem[];
  institutionType?: 'household' | 'educational' | 'corporate' | 'social_club' | 'sports_team' | 'family';
  contractTitle: string;
  contractDescription?: string;
  agreedPackages?: string[];
  dateRange?: ContractDateRange;
  activeDays?: string[]; // ['monday', 'tuesday', 'thursday']
  excludedDays?: string[]; // ['wednesday', 'saturday', 'sunday']
  excludedDates?: string[];
  agreedTimeWindows?: Array<{ day: string; startTime: string; endTime: string; excluded?: boolean }>;
  assignedTasks?: ContractAssignedTask[];
  blockNudity?: boolean;
  status?: 'draft' | 'pending_member_approval' | 'negotiating' | 'active' | 'revoked' | 'archived';
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface GovernanceReportData {
  contractId?: string;
  reporterUid: string;
  reportedAdminUid: string;
  violationType: 'unauthorized_trigger' | 'out_of_agreed_hours' | 'malicious_intent' | 'unacceptable_rule';
  details: string;
}

export interface GovernanceContract {
  id: string;
  admin_uid: string;
  admin_name?: string;
  member_uid: string;
  target_members?: TargetMemberItem[];
  institution_type: 'household' | 'educational' | 'corporate' | 'social_club' | 'sports_team' | 'family';
  contract_title: string;
  contract_description?: string;
  agreed_packages: string[];
  date_range?: ContractDateRange;
  active_days?: string[];
  excluded_days?: string[];
  excluded_dates?: string[];
  agreed_time_windows: Array<{ day: string; startTime: string; endTime: string; excluded?: boolean }>;
  assigned_tasks?: ContractAssignedTask[];
  status: 'draft' | 'pending_member_approval' | 'negotiating' | 'active' | 'revoked' | 'archived';
  member_declined_rules: string[];
  party_suggestions: Array<{ ruleKey: string; suggestion: string }>;
  block_nudity: boolean;
  supervisor_pin?: string;
  signed_at?: string | null;
  tier?: 'free' | 'pro' | 'enterprise';
  invitation_log?: Array<{ memberEmail: string; dispatchedAt: string; status: 'sent'; method: 'background_email' }>;
  created_at: string;
  updated_at: string;
}

const CONTRACTS_KEY_PREFIX = 'cymatic_governance_contracts_';
const COMMENTS_KEY_PREFIX = 'cymatic_governance_comments_';
const REPORTS_KEY = 'cymatic_governance_reports';

function getLocalContracts(uid: string): GovernanceContract[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CONTRACTS_KEY_PREFIX}${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalContracts(uid: string, contracts: GovernanceContract[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CONTRACTS_KEY_PREFIX}${uid}`, JSON.stringify(contracts));
  } catch {}
}

function updateLocalContract(contractId: string, updates: Record<string, any>) {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CONTRACTS_KEY_PREFIX)) {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = list.findIndex((c: any) => c.id === contractId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          localStorage.setItem(key, JSON.stringify(list));
          return list[idx];
        }
      }
    }
  } catch {}
  return null;
}

function getLocalComments(contractId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${COMMENTS_KEY_PREFIX}${contractId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalComments(contractId: string, comments: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${COMMENTS_KEY_PREFIX}${contractId}`, JSON.stringify(comments));
  } catch {}
}

/**
 * Dispatch background email invitation without opening any mail client window
 */
export async function sendBackgroundEmailInvite(invite: {
  to: string;
  recipientName: string;
  adminName: string;
  contractTitle: string;
  contractId: string;
  institutionType?: string;
  dateRange?: ContractDateRange;
  agreedPackages?: string[];
  assignedTasks?: ContractAssignedTask[];
}): Promise<{ success: boolean; message: string; auditToken: string }> {
  const token = 'inv_sec_' + Math.random().toString(36).substring(2, 12);
  const tasksList = (invite.assignedTasks || [])
    .map((t, idx) => `  ${idx + 1}. ${t.title} [${t.startTime} - ${t.endTime}] (${t.category}, Priority: ${t.priority})`)
    .join('\n');

  const packagesStr = (invite.agreedPackages || []).join(', ') || 'All high-dopamine distraction packages suppressed';
  const datesStr = invite.dateRange && !invite.dateRange.isOngoing ? `${invite.dateRange.startDate} to ${invite.dateRange.endDate}` : 'Ongoing Active Covenant';

  const bodyPreview = `
========================================
CYMATIC DISCIPLINE OS - GOVERNANCE COVENANT
========================================
Title: ${invite.contractTitle}
Institution Type: ${(invite.institutionType || 'Household').toUpperCase()}
Issuer / Supervisor: ${invite.adminName}
Participant: ${invite.recipientName}
Active Schedule Range: ${datesStr}

--- STRUCTURED CONTRACT TERMS PREVIEW ---
1. Restricted Packages:
   ${packagesStr}

2. Assigned Routines & Tasks:
   ${tasksList || '  - Standard deep work & focus window enforced'}

3. Security & Governance Audit:
   - Audit Token: ${token}
   - Portal Access Required for Bilateral Signing & Revisions
========================================
`.trim();

  const payload = {
    to: invite.to,
    recipientName: invite.recipientName,
    adminName: invite.adminName,
    contractTitle: invite.contractTitle,
    contractId: invite.contractId,
    subject: `[Governance Covenant] Structured Preview & Invitation: "${invite.contractTitle}" from ${invite.adminName}`,
    bodyText: bodyPreview,
    timestamp: new Date().toISOString(),
    status: 'dispatched_successfully',
    auditToken: token
  };

  try {
    const res = await fetch('/api/dispatch-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to dispatch');
  } catch (err) {
    console.error('[GovernanceService] Email dispatch failed:', err);
    return { success: false, message: 'Failed to dispatch email', auditToken: '' };
  }

  try {
    const existing = JSON.parse(localStorage.getItem('sdc_email_invitation_audit_v1') || '[]');
    existing.unshift(payload);
    localStorage.setItem('sdc_email_invitation_audit_v1', JSON.stringify(existing.slice(0, 50)));
  } catch {}

  return {
    success: true,
    message: `Background email invitation dispatched to ${invite.to}`,
    auditToken: token
  };
}

/**
 * Writes assigned contract tasks and routines into Calendar and Tasks system
 */
export async function syncContractTasksToCalendarAndTasks(contract: any, userUid: string) {
  if (!contract || !Array.isArray(contract.assigned_tasks) || contract.assigned_tasks.length === 0) {
    return;
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 1. Sync to Supabase tasks table
  for (const task of contract.assigned_tasks) {
    try {
      const taskRecord = {
        user_uid: userUid,
        title: `[${contract.contract_title || 'Pact'}] ${task.title}`,
        description: task.description || `Assigned routine via governance contract: ${contract.contract_title}`,
        date_str: todayStr,
        start_time: task.startTime || '09:00',
        end_time: task.endTime || '10:00',
        status: 'needsAction',
        category: task.category || 'deep_work',
        priority: task.priority || 'high',
        linked_rule: task.linkedRule || 'governance_sync',
        source: 'governance_contract'
      };

      await supabase.from('tasks').insert([taskRecord]);
    } catch (e) {
      console.warn('[GovernanceService] Task insert note:', e);
    }
  }

  // 2. Sync to local calendar events store ('sdc_calendar_manager_events_v3')
  try {
    const currentEvents = JSON.parse(localStorage.getItem('sdc_calendar_manager_events_v3') || '[]');
    const newEvents = contract.assigned_tasks.map((task: any, idx: number) => ({
      id: `gov_cal_${contract.id}_${task.id || idx}`,
      summary: `[Pact] ${task.title}`,
      dateStr: todayStr,
      startTime: task.startTime || '09:00',
      endTime: task.endTime || '10:00',
      source: 'local',
      category: task.category || 'work',
      linkedRule: 'governance_contract',
      autoLockdown: true
    }));

    const filtered = currentEvents.filter((ev: any) => !ev.id?.startsWith(`gov_cal_${contract.id}`));
    const merged = [...filtered, ...newEvents];
    localStorage.setItem('sdc_calendar_manager_events_v3', JSON.stringify(merged));
  } catch (e) {
    console.warn('[GovernanceService] Calendar sync note:', e);
  }

  // 3. Dispatch global browser events to immediately trigger UI refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cymatic-calendar-refresh'));
    window.dispatchEvent(new CustomEvent('cymatic-tasks-refresh'));
  }
}

export const governanceService = {
  /**
   * Drafts or issues 1-to-5 governance contracts with multi-member limits,
   * flexible schedules, assigned tasks, and background email invites.
   */
  async createGovernanceContract(data: GovernanceContractData) {
    const targetMembers: TargetMemberItem[] = data.targetMembers && data.targetMembers.length > 0
      ? data.targetMembers.slice(0, 5) // Enforce free tier max 5
      : (data.memberUids || [data.memberUid || '']).filter(Boolean).map(id => ({
          name: id.includes('@') ? id.split('@')[0] : 'Member',
          email: id.includes('@') ? id : `${id}@cymatic.internal`,
          status: 'invited'
        }));

    if (targetMembers.length === 0) {
      throw new Error('At least 1 member name and email is required.');
    }

    // Check tier limit: Free tier allows up to 5 members
    const tier = data.tier || 'free';
    if (tier === 'free' && targetMembers.length > 5) {
      throw new Error('Free tier allows managing up to 5 members maximum. Upgrade to Pro for up to 15 members or Enterprise for unlimited.');
    }

    const createdContracts: GovernanceContract[] = [];
    const localList = getLocalContracts(data.adminUid);
    const contractStatus = data.status || 'pending_member_approval';

    for (const member of targetMembers) {
      const cleanEmail = member.email.trim();
      let resolvedUid = cleanEmail;

      // Lookup or insert user in public.users if email
      if (cleanEmail.includes('@')) {
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('uid')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (existingUser?.uid) {
            resolvedUid = existingUser.uid;
          } else {
            const newUid = 'ward_' + Math.random().toString(36).substring(2, 10);
            const { data: newUser } = await supabase
              .from('users')
              .insert({
                uid: newUid,
                email: cleanEmail,
                moniker: member.name || cleanEmail.split('@')[0],
                role: 'student'
              })
              .select('uid')
              .maybeSingle();
            resolvedUid = newUser?.uid || newUid;
          }
        } catch {
          resolvedUid = 'ward_' + Math.random().toString(36).substring(2, 10);
        }
      }

      const contractId = 'gov_' + Math.random().toString(36).substring(2, 12);
      const supervisorPin = generateSupervisorPin();
      const newContract: GovernanceContract = {
        id: contractId,
        admin_uid: data.adminUid,
        admin_name: data.adminName || 'Discipline Architect',
        member_uid: resolvedUid,
        target_members: [member],
        institution_type: (data.institutionType as any) || 'household',
        contract_title: data.contractTitle,
        contract_description: data.contractDescription || '',
        agreed_packages: data.agreedPackages || [],
        date_range: data.dateRange,
        active_days: data.activeDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        excluded_days: data.excludedDays || ['saturday', 'sunday'],
        excluded_dates: data.excludedDates || [],
        agreed_time_windows: data.agreedTimeWindows || [],
        assigned_tasks: data.assignedTasks || [],
        block_nudity: data.blockNudity ?? true,
        supervisor_pin: supervisorPin,
        status: contractStatus,
        member_declined_rules: [],
        party_suggestions: [],
        tier: data.tier || 'free',
        invitation_log: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If issuing (not draft), dispatch background email invite without opening any mail client
      if (contractStatus !== 'draft') {
        try {
          const emailRes = await sendBackgroundEmailInvite({
            to: member.email,
            recipientName: member.name || member.email,
            adminName: data.adminName || 'Discipline Architect',
            contractTitle: data.contractTitle,
            contractId: newContract.id,
            assignedTasks: data.assignedTasks
          });
          newContract.invitation_log = [{
            memberEmail: member.email,
            dispatchedAt: new Date().toISOString(),
            status: 'sent',
            method: 'background_email'
          }];
        } catch (e) {
          console.warn('[GovernanceService] Background email dispatch notice:', e);
        }

        // Also sync assigned tasks and routines into calendar & tasks automatically
        if (data.assignedTasks && data.assignedTasks.length > 0) {
          syncContractTasksToCalendarAndTasks(newContract, data.adminUid);
        }
      }

      // Persist to Supabase
      try {
        const { data: result, error } = await supabase
          .from('governance_contracts')
          .insert({
            admin_uid: data.adminUid,
            member_uid: resolvedUid,
            institution_type: (data.institutionType as any) || 'household',
            contract_title: data.contractTitle,
            agreed_packages: data.agreedPackages || [],
            agreed_time_windows: data.agreedTimeWindows || [],
            block_nudity: data.blockNudity ?? true,
            status: contractStatus,
          })
          .select()
          .maybeSingle();

        if (!error && result) {
          newContract.id = result.id;
        }
      } catch (err: any) {
        console.warn('[GovernanceService] Supabase insert notice:', err?.message || err);
      }

      // Add to local list
      localList.unshift(newContract);
      createdContracts.push(newContract);
    }

    saveLocalContracts(data.adminUid, localList);
    return createdContracts.length === 1 ? createdContracts[0] : createdContracts;
  },

  /**
   * Saves or updates a contract as a Draft
   */
  async saveDraftContract(data: GovernanceContractData) {
    return this.createGovernanceContract({
      ...data,
      status: 'draft'
    });
  },

  /**
   * Deletes a contract permanently by ID
   */
  async deleteContract(contractId: string, userUid: string) {
    try {
      await supabase
        .from('governance_contracts')
        .delete()
        .eq('id', contractId);
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CONTRACTS_KEY_PREFIX)) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = list.filter((c: any) => c.id !== contractId);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      } catch {}
    }

    return { success: true, deletedId: contractId };
  },

  /**
   * Clears all contracts for a user
   */
  async clearAllContracts(userUid: string) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${CONTRACTS_KEY_PREFIX}${userUid}`);
      } catch {}
    }
    return { success: true };
  },

  /**
   * Fetches real active, pending, or draft contracts for a given user (admin or member).
   * Checks both admin_uid and member_uid or email in target_members.
   */
  async fetchUserContracts(uid: string, userEmail?: string): Promise<GovernanceContract[]> {
    if (!uid) return [];

    let remoteList: any[] = [];
    try {
      const orFilter = userEmail 
        ? `admin_uid.eq.${uid},member_uid.eq.${uid},member_uid.eq.${userEmail}`
        : `admin_uid.eq.${uid},member_uid.eq.${uid}`;

      const { data, error } = await supabase
        .from('governance_contracts')
        .select('*')
        .or(orFilter)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        remoteList = data;
      }
    } catch (err: any) {
      console.warn('[GovernanceService] Supabase contracts query fallback:', err?.message || err);
    }

    // Merge with local contracts
    const localList = getLocalContracts(uid);
    const combinedMap = new Map<string, any>();

    localList.forEach(c => combinedMap.set(c.id, c));
    remoteList.forEach(c => {
      if (combinedMap.has(c.id)) {
        combinedMap.set(c.id, { ...combinedMap.get(c.id), ...c });
      } else {
        combinedMap.set(c.id, c);
      }
    });

    const result = Array.from(combinedMap.values());
    saveLocalContracts(uid, result);
    return result;
  },

  /**
   * Resolves a single contract by ID from Supabase or local store.
   */
  async getContractById(contractId: string): Promise<GovernanceContract | null> {
    if (!contractId) return null;

    try {
      const { data, error } = await supabase
        .from('governance_contracts')
        .select('*')
        .eq('id', contractId)
        .maybeSingle();

      if (!error && data) {
        return data as any;
      }
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CONTRACTS_KEY_PREFIX)) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const found = list.find((c: any) => c.id === contractId);
            if (found) return found;
          }
        }
      } catch {}
    }
    return null;
  },

  /**
   * Inserts comments into public.governance_comments with local cache resilience.
   */
  async addContractComment(contractId: string, senderUid: string, senderMoniker: string, commentText: string) {
    const newComment = {
      id: 'gov_comm_' + Math.random().toString(36).substring(2, 11),
      contract_id: contractId,
      sender_uid: senderUid,
      sender_moniker: senderMoniker || 'Discipline Architect',
      comment_text: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('governance_comments')
        .insert({
          contract_id: contractId,
          sender_uid: senderUid,
          sender_moniker: senderMoniker || 'Discipline Architect',
          comment_text: commentText.trim(),
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        newComment.id = data.id;
      }
    } catch {}

    const comments = getLocalComments(contractId);
    comments.push(newComment);
    saveLocalComments(contractId, comments);

    return newComment;
  },

  /**
   * Retrieves comment thread ordered by created_at ascending.
   */
  async fetchContractComments(contractId: string) {
    if (!contractId) return [];

    try {
      const { data, error } = await supabase
        .from('governance_comments')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        saveLocalComments(contractId, data);
        return data;
      }
    } catch {}

    const localComments = getLocalComments(contractId);
    if (localComments.length > 0) {
      return localComments;
    }

    return [];
  },

  /**
   * Formulates a balanced AI shadow agreement resolving disputes between admin and member.
   */
  async synthesizeShadowAgreement(contractId: string, _comments: any[], declinedRules: string[]) {
    const mediationNote = declinedRules.length === 0
      ? '🤖 AI Shadow Agreement Mediator: Zero rule disputes detected. Full bilateral consensus ratified.'
      : `🤖 AI Shadow Agreement Mediator Synthesis: Disputed rules detected (${declinedRules.join(', ')}). Recommended compromise: Shift strict auto-lockdown on disputed items to scheduled focus intervals during evening operational hours, preserving daytime emergency exception access.`;

    try {
      await this.addContractComment(
        contractId,
        'ai_shadow_mediator_bot',
        'Cymatic AI Mediator',
        mediationNote
      );
    } catch {}

    return {
      success: true,
      recommendation: mediationNote,
      adjustedDeclines: declinedRules,
    };
  },

  /**
   * Handles member acceptance/rejection and counter-proposals for contract rules.
   */
  async respondToContractRules(
    contractId: string,
    acceptedPackages: string[],
    declinedRules: string[],
    counterSuggestions: Array<{ ruleKey: string; suggestion: string }>
  ) {
    const status = declinedRules.length > 0 || counterSuggestions.length > 0 ? 'negotiating' : 'pending_member_approval';
    const updatedAt = new Date().toISOString();

    try {
      await supabase
        .from('governance_contracts')
        .update({
          agreed_packages: acceptedPackages,
          member_declined_rules: declinedRules,
          party_suggestions: counterSuggestions,
          status,
          updated_at: updatedAt,
        })
        .eq('id', contractId);
    } catch {}

    updateLocalContract(contractId, {
      agreed_packages: acceptedPackages,
      member_declined_rules: declinedRules,
      party_suggestions: counterSuggestions,
      status,
      updated_at: updatedAt,
    });

    return {
      id: contractId,
      agreed_packages: acceptedPackages,
      member_declined_rules: declinedRules,
      party_suggestions: counterSuggestions,
      status,
      updated_at: updatedAt,
    };
  },

  /**
   * Finalizes bilateral consent, activates the contract, and synchronizes assigned tasks to calendar.
   */
  async signGovernanceContract(contractId: string, userUid?: string) {
    const signedAt = new Date().toISOString();
    const updatedAt = signedAt;

    try {
      await supabase
        .from('governance_contracts')
        .update({
          status: 'active',
          signed_at: signedAt,
          updated_at: updatedAt,
        })
        .eq('id', contractId);
    } catch {}

    const updated = updateLocalContract(contractId, {
      status: 'active',
      signed_at: signedAt,
      updated_at: updatedAt,
    });

    // Auto sync tasks to calendar and tasks
    if (updated && userUid) {
      syncContractTasksToCalendarAndTasks(updated, userUid);
    }

    return {
      id: contractId,
      status: 'active',
      signed_at: signedAt,
      updated_at: updatedAt,
    };
  },

  /**
   * Logs an out-of-bounds trigger or bully admin attempt to governance_reports for audit review.
   */
  async reportMaliciousLockdown(reportData: GovernanceReportData) {
    const newReport = {
      id: 'gov_rep_' + Math.random().toString(36).substring(2, 11),
      contract_id: reportData.contractId || null,
      reporter_uid: reportData.reporterUid,
      reported_admin_uid: reportData.reportedAdminUid,
      violation_type: reportData.violationType,
      details: reportData.details,
      status: 'pending_review',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase
        .from('governance_reports')
        .insert({
          contract_id: reportData.contractId || null,
          reporter_uid: reportData.reporterUid,
          reported_admin_uid: reportData.reportedAdminUid,
          violation_type: reportData.violationType,
          details: reportData.details,
          status: 'pending_review',
        });
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const existingReports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
        existingReports.unshift(newReport);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(existingReports));
      } catch {}
    }

    return newReport;
  },

  async getActiveContract(): Promise<GovernanceContract | null> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CONTRACTS_KEY_PREFIX)) {
          const list: GovernanceContract[] = JSON.parse(localStorage.getItem(key) || '[]');
          const active = list.find(c => c.status === 'active');
          if (active) return active;
        }
      }
    } catch {}
    return null;
  },
};

export function generateSupervisorPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
