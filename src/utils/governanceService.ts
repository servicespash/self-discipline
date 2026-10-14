/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Universal Governance Contracts Service
 * Supports 1-to-5 Multi-Member Multi-Ward Issuance via Emails, Phone Numbers, or UIDs, Bilateral Comments, and AI Shadow Agreement Synthesis.
 */

import { supabase } from './supabase';

export interface GovernanceContractData {
  adminUid: string;
  memberUid?: string;
  memberUids?: string[]; // 1-to-5 multi-ward targeting (emails, phones, or UIDs)
  institutionType?: 'sports_team' | 'educational' | 'corporate' | 'family';
  contractTitle: string;
  agreedPackages?: string[];
  agreedTimeWindows?: Array<{ day: string; startTime: string; endTime: string }>;
  blockNudity?: boolean;
}

export interface GovernanceReportData {
  contractId?: string;
  reporterUid: string;
  reportedAdminUid: string;
  violationType: 'unauthorized_trigger' | 'out_of_agreed_hours' | 'malicious_intent' | 'unacceptable_rule';
  details: string;
}

export const governanceService = {
  /**
   * Drafts 1-to-5 governance contracts simultaneously for up to 5 member emails, phone numbers, or UIDs.
   */
  async createGovernanceContract(data: GovernanceContractData) {
    const rawIdentifiers = data.memberUids && data.memberUids.length > 0 
      ? data.memberUids.slice(0, 5) 
      : data.memberUid ? [data.memberUid] : [];

    if (rawIdentifiers.length === 0) {
      throw new Error('At least one target member email, phone number, or UID is required for multi-ward contract issuance.');
    }

    const createdContracts = [];

    for (const identifier of rawIdentifiers) {
      const cleanId = identifier.trim();
      if (!cleanId) continue;

      let resolvedUid = cleanId;

      // If identifier is an email, lookup or provision in public.users
      if (cleanId.includes('@')) {
        let { data: existingUser } = await supabase
          .from('users')
          .select('uid')
          .eq('email', cleanId)
          .maybeSingle();

        if (existingUser) {
          resolvedUid = existingUser.uid;
        } else {
          const newUid = 'ward_' + Math.random().toString(36).substring(2, 10);
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              uid: newUid,
              email: cleanId,
              moniker: cleanId.split('@')[0],
              role: 'student'
            })
            .select('uid')
            .maybeSingle();
          resolvedUid = newUser?.uid || newUid;
        }
      }

      const { data: result, error } = await supabase
        .from('governance_contracts')
        .insert({
          admin_uid: data.adminUid,
          member_uid: resolvedUid,
          institution_type: data.institutionType || 'sports_team',
          contract_title: data.contractTitle,
          agreed_packages: data.agreedPackages || [],
          agreed_time_windows: data.agreedTimeWindows || [],
          block_nudity: data.blockNudity ?? true,
          status: 'pending_member_approval',
        })
        .select()
        .single();

      if (error) {
        console.error('[GovernanceService] Failed to create contract for identifier:', cleanId, error);
      } else if (result) {
        createdContracts.push(result);
      }
    }

    return createdContracts.length === 1 ? createdContracts[0] : createdContracts;
  },

  /**
   * Fetches active or pending contracts for a given user (admin or member).
   */
  async fetchUserContracts(uid: string) {
    const { data, error } = await supabase
      .from('governance_contracts')
      .select('*')
      .or(`admin_uid.eq.${uid},member_uid.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GovernanceService] Failed to fetch contracts:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Inserts comments into public.governance_comments.
   */
  async addContractComment(contractId: string, senderUid: string, senderMoniker: string, commentText: string) {
    const { data, error } = await supabase
      .from('governance_comments')
      .insert({
        contract_id: contractId,
        sender_uid: senderUid,
        sender_moniker: senderMoniker || 'Discipline Architect',
        comment_text: commentText.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('[GovernanceService] Failed to add contract comment:', error);
      throw error;
    }
    return data;
  },

  /**
   * Retrieves comment thread ordered by created_at ascending.
   */
  async fetchContractComments(contractId: string) {
    const { data, error } = await supabase
      .from('governance_comments')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[GovernanceService] Warning fetching contract comments:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Formulates a balanced AI shadow agreement resolving disputes between admin and member.
   */
  async synthesizeShadowAgreement(contractId: string, comments: any[], declinedRules: string[]) {
    const mediationNote = declinedRules.length === 0
      ? '🤖 AI Shadow Agreement Mediator: Zero rule disputes detected. Full bilateral consensus ratified.'
      : `🤖 AI Shadow Agreement Mediator Synthesis: Disputed rules detected (${declinedRules.join(', ')}). Recommended compromise: Shift strict auto-lockdown on disputed packages to scheduled focus intervals during evening operational hours, preserving daytime emergency exception access.`;

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

    const { data, error } = await supabase
      .from('governance_contracts')
      .update({
        agreed_packages: acceptedPackages,
        member_declined_rules: declinedRules,
        party_suggestions: counterSuggestions,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      console.error('[GovernanceService] Failed to update contract rules:', error);
      throw error;
    }
    return data;
  },

  /**
   * Finalizes bilateral consent and activates the contract.
   */
  async signGovernanceContract(contractId: string) {
    const { data, error } = await supabase
      .from('governance_contracts')
      .update({
        status: 'active',
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      console.error('[GovernanceService] Failed to sign contract:', error);
      throw error;
    }
    return data;
  },

  /**
   * Logs an out-of-bounds trigger or bully admin attempt to governance_reports for audit review.
   */
  async reportMaliciousLockdown(reportData: GovernanceReportData) {
    const { data, error } = await supabase
      .from('governance_reports')
      .insert({
        contract_id: reportData.contractId || null,
        reporter_uid: reportData.reporterUid,
        reported_admin_uid: reportData.reportedAdminUid,
        violation_type: reportData.violationType,
        details: reportData.details,
        status: 'pending_review',
      })
      .select()
      .single();

    if (error) {
      console.error('[GovernanceService] Failed to report malicious lockdown:', error);
      throw error;
    }
    return data;
  },
};
