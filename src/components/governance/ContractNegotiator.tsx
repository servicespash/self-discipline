/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Universal Bilateral Governance & Institutional Contracts
 * Features:
 * - Administrator View vs. Managed Member View (what each role sees)
 * - Zero hardcoded package identifiers: interactive System App Selector from device apps
 * - Full draft lifecycle: Save as Draft, Edit Draft, Delete Contract, Clear Contracts
 * - Flexible scheduling: Date ranges (start to end), active days, excluded days & times
 * - 100% editable templates: Household, Educational, Corporate, Athletic, Social Club
 * - 1-to-5 Target Member management with Free Tier (max 5) enforcement (Name, Email, Phone)
 * - Assigned tasks and routines automatically synchronized to Calendar & Tasks
 * - Background email invitation execution without opening external email windows
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Scale, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Bot, 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Clock, 
  Send, 
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Zap,
  Trash2,
  Calendar,
  Save,
  Sparkles,
  Home,
  GraduationCap,
  Briefcase,
  Trophy,
  Edit,
  Mail,
  Phone,
  UserPlus,
  Smartphone,
  Eye,
  Check,
  Lock,
  Plus
} from 'lucide-react';
import { 
  governanceService, 
  GovernanceContractData, 
  GovernanceReportData, 
  GovernanceContract,
  TargetMemberItem,
  ContractAssignedTask,
  sendBackgroundEmailInvite,
  syncContractTasksToCalendarAndTasks
} from '../../utils/governanceService';
import { GOVERNANCE_TEMPLATES, GovernanceTemplate } from '../../utils/governanceTemplates';
import { SystemAppSelectorModal } from './SystemAppSelectorModal';
import { PackageManager, AppPackageInfo } from '../../utils/packageManager';

export interface ContractNegotiatorProps {
  currentUserUid: string;
  userRole: string;
  userMoniker: string;
  userEmail?: string;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export function ContractNegotiator({ currentUserUid, userRole, userMoniker, userEmail }: ContractNegotiatorProps) {
  // Perspective view mode: Administrator (overseer) vs. Managed Member (person being governed)
  const [viewPerspective, setViewPerspective] = useState<'admin' | 'member'>(() => {
    return userRole === 'student' || userRole === 'ward' || userRole === 'member' ? 'member' : 'admin';
  });

  const [activeTab, setActiveTab] = useState<'contracts' | 'templates' | 'draft' | 'negotiate' | 'report'>('contracts');
  const [contractsFilter, setContractsFilter] = useState<'all' | 'active' | 'pending' | 'drafts'>('all');
  
  const [contracts, setContracts] = useState<GovernanceContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<GovernanceContract | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentInput, setCommentInput] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [aiSynthesizing, setAiSynthesizing] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // App selector modal state
  const [isAppSelectorOpen, setIsAppSelectorOpen] = useState<boolean>(false);

  // Draft Form State
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftDescription, setDraftDescription] = useState<string>('');
  const [draftInstitution, setDraftInstitution] = useState<GovernanceContractData['institutionType']>('household');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [draftBlockNudity, setDraftBlockNudity] = useState<boolean>(true);

  // Schedule & Date Selection
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const thirtyDaysLater = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(thirtyDaysLater);
  const [isOngoing, setIsOngoing] = useState<boolean>(false);
  const [activeDays, setActiveDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [excludedDays, setExcludedDays] = useState<string[]>(['saturday', 'sunday']);
  const [draftStartTime, setDraftStartTime] = useState<string>('18:30');
  const [draftEndTime, setDraftEndTime] = useState<string>('21:30');

  // Target Members State (Up to 5 on Free Tier)
  const [targetMembers, setTargetMembers] = useState<TargetMemberItem[]>([
    { name: '', email: '', phone: '' }
  ]);
  const [tier, setTier] = useState<'free' | 'pro' | 'enterprise'>('free');

  // Assigned Tasks State
  const [assignedTasks, setAssignedTasks] = useState<ContractAssignedTask[]>([
    {
      id: 'task_1',
      title: 'Daily Deep Focus Routine',
      description: 'Dedicated focus block with all distractions quarantined.',
      startTime: '18:30',
      endTime: '20:00',
      category: 'deep_work',
      priority: 'high'
    }
  ]);

  // Report Form State
  const [reportAdminUid, setReportAdminUid] = useState<string>('');
  const [reportViolationType, setReportViolationType] = useState<GovernanceReportData['violationType']>('unauthorized_trigger');
  const [reportDetails, setReportDetails] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await governanceService.fetchUserContracts(currentUserUid, userEmail);
      const list = data || [];
      setContracts(list);
      if (list.length > 0) {
        if (!selectedContract) {
          setSelectedContract(list[0]);
        } else {
          const matching = list.find((c) => c.id === selectedContract.id);
          if (matching) {
            setSelectedContract(matching);
          }
        }
      }
    } catch (err: any) {
      console.warn('[ContractNegotiator] Contracts load fallback note:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserUid, userEmail, selectedContract]);

  const loadComments = useCallback(async (contractId: string) => {
    try {
      const data = await governanceService.fetchContractComments(contractId);
      setComments(data);
    } catch (err: any) {
      console.warn('[ContractNegotiator] Error fetching comments:', err);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    if (selectedContract?.id) {
      loadComments(selectedContract.id);
    }
  }, [selectedContract, loadComments]);

  // Handle Day of Week Toggling
  const toggleActiveDay = (dayId: string) => {
    if (activeDays.includes(dayId)) {
      setActiveDays(activeDays.filter((d) => d !== dayId));
      if (!excludedDays.includes(dayId)) {
        setExcludedDays([...excludedDays, dayId]);
      }
    } else {
      setActiveDays([...activeDays, dayId]);
      setExcludedDays(excludedDays.filter((d) => d !== dayId));
    }
  };

  const toggleExcludedDay = (dayId: string) => {
    if (excludedDays.includes(dayId)) {
      setExcludedDays(excludedDays.filter((d) => d !== dayId));
    } else {
      setExcludedDays([...excludedDays, dayId]);
      setActiveDays(activeDays.filter((d) => d !== dayId));
    }
  };

  // Target Members Helpers (Max 5 for Free Tier)
  const handleAddMember = () => {
    const maxAllowed = tier === 'free' ? 5 : tier === 'pro' ? 15 : 999;
    if (targetMembers.length >= maxAllowed) {
      showToast(`Free tier limit reached (Max 5 managed members). Upgrade tier for more.`, 'error');
      return;
    }
    setTargetMembers([...targetMembers, { name: '', email: '', phone: '' }]);
  };

  const handleUpdateMember = (index: number, field: keyof TargetMemberItem, value: string) => {
    const updated = [...targetMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTargetMembers(updated);
  };

  const handleRemoveMember = (index: number) => {
    if (targetMembers.length <= 1) {
      setTargetMembers([{ name: '', email: '', phone: '' }]);
      return;
    }
    setTargetMembers(targetMembers.filter((_, i) => i !== index));
  };

  // Assigned Tasks Helpers
  const handleAddTask = () => {
    const newTask: ContractAssignedTask = {
      id: 'task_' + Date.now(),
      title: 'New Assigned Routine',
      startTime: draftStartTime,
      endTime: draftEndTime,
      category: 'deep_work',
      priority: 'high'
    };
    setAssignedTasks([...assignedTasks, newTask]);
  };

  const handleUpdateTask = (index: number, field: keyof ContractAssignedTask, value: any) => {
    const updated = [...assignedTasks];
    updated[index] = { ...updated[index], [field]: value };
    setAssignedTasks(updated);
  };

  const handleRemoveTask = (index: number) => {
    setAssignedTasks(assignedTasks.filter((_, i) => i !== index));
  };

  // Load an Editable Template into the Draft Form
  const handleApplyTemplate = (tpl: GovernanceTemplate) => {
    setDraftTitle(tpl.title);
    setDraftDescription(tpl.description);
    setDraftInstitution(tpl.category);
    setDraftStartTime(tpl.defaultStartTime);
    setDraftEndTime(tpl.defaultEndTime);
    setActiveDays(tpl.activeDays);
    setExcludedDays(tpl.excludedDays);
    setDraftBlockNudity(tpl.blockNudity);
    setAssignedTasks(tpl.assignedTasks);
    setActiveTab('draft');
    showToast(`Template "${tpl.title}" loaded. You can now edit all fields and assign members.`, 'success');
  };

  // Edit an Existing Draft
  const handleEditDraft = (contract: GovernanceContract) => {
    setEditingContractId(contract.id);
    setDraftTitle(contract.contract_title);
    setDraftDescription(contract.contract_description || '');
    setDraftInstitution(contract.institution_type);
    setSelectedPackages(contract.agreed_packages || []);
    if (contract.date_range) {
      setStartDate(contract.date_range.startDate || todayStr);
      setEndDate(contract.date_range.endDate || thirtyDaysLater);
      setIsOngoing(contract.date_range.isOngoing || false);
    }
    if (contract.active_days) setActiveDays(contract.active_days);
    if (contract.excluded_days) setExcludedDays(contract.excluded_days);
    if (contract.agreed_time_windows?.[0]) {
      setDraftStartTime(contract.agreed_time_windows[0].startTime);
      setDraftEndTime(contract.agreed_time_windows[0].endTime);
    }
    if (contract.assigned_tasks) setAssignedTasks(contract.assigned_tasks);
    if (contract.target_members && contract.target_members.length > 0) {
      setTargetMembers(contract.target_members);
    }
    setActiveTab('draft');
  };

  // Delete Contract
  const handleDeleteContract = async (contractId: string) => {
    try {
      setLoading(true);
      await governanceService.deleteContract(contractId, currentUserUid);
      showToast('Contract deleted successfully.', 'info');
      setDeleteConfirmId(null);
      await loadContracts();
      if (selectedContract?.id === contractId) {
        setSelectedContract(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete contract', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Clear All Contracts
  const handleClearAllContracts = async () => {
    if (!window.confirm('Are you sure you want to clear all your local governance contracts?')) return;
    try {
      setLoading(true);
      await governanceService.clearAllContracts(currentUserUid);
      showToast('All local contracts cleared.', 'info');
      await loadContracts();
      setSelectedContract(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to clear contracts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save as Draft or Issue Contract
  const handleSubmitContract = async (asDraft: boolean) => {
    if (!draftTitle.trim()) {
      showToast('Contract title is required', 'error');
      return;
    }

    const validMembers = targetMembers.filter((m) => m.name.trim() && m.email.trim());
    if (validMembers.length === 0) {
      showToast('Please enter at least 1 target member name and email', 'error');
      return;
    }

    if (tier === 'free' && validMembers.length > 5) {
      showToast('Free tier allows managing up to 5 members only. Please reduce recipients.', 'error');
      return;
    }

    const contractData: GovernanceContractData = {
      id: editingContractId || undefined,
      adminUid: currentUserUid,
      adminName: userMoniker || 'Discipline Architect',
      targetMembers: validMembers,
      institutionType: draftInstitution,
      contractTitle: draftTitle.trim(),
      contractDescription: draftDescription.trim(),
      agreedPackages: selectedPackages,
      dateRange: {
        startDate,
        endDate,
        isOngoing
      },
      activeDays,
      excludedDays,
      agreedTimeWindows: [
        { day: 'active_days', startTime: draftStartTime, endTime: draftEndTime }
      ],
      assignedTasks: assignedTasks.filter((t) => t.title.trim()),
      blockNudity: draftBlockNudity,
      status: asDraft ? 'draft' : 'pending_member_approval',
      tier
    };

    try {
      setLoading(true);
      await governanceService.createGovernanceContract(contractData);
      
      if (asDraft) {
        showToast('Governance contract saved to Drafts!', 'success');
      } else {
        showToast(
          `Covenant issued! Background email invite sent to ${validMembers.length} member(s) without opening mail window.`,
          'success'
        );
      }

      // Reset form
      setEditingContractId(null);
      setDraftTitle('');
      setDraftDescription('');
      setSelectedPackages([]);
      setTargetMembers([{ name: '', email: '', phone: '' }]);
      await loadContracts();
      setActiveTab('contracts');
    } catch (err: any) {
      console.error('[ContractNegotiator] Error creating contract:', err);
      showToast(err.message || 'Failed to process contract', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedContract) return;

    try {
      await governanceService.addContractComment(
        selectedContract.id,
        currentUserUid,
        userMoniker || 'Discipline Architect',
        commentInput.trim()
      );
      setCommentInput('');
      await loadComments(selectedContract.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    }
  };

  const handleSynthesizeAI = async () => {
    if (!selectedContract) return;
    try {
      setAiSynthesizing(true);
      const declined = selectedContract.member_declined_rules || [];
      await governanceService.synthesizeShadowAgreement(
        selectedContract.id,
        comments,
        declined
      );
      showToast('AI Shadow Agreement synthesized and posted to negotiation feed!', 'success');
      await loadComments(selectedContract.id);
    } catch (err: any) {
      showToast('AI Synthesis encountered an issue', 'error');
    } finally {
      setAiSynthesizing(false);
    }
  };

  const handleSignContract = async () => {
    if (!selectedContract) return;
    try {
      setLoading(true);
      await governanceService.signGovernanceContract(selectedContract.id, currentUserUid);
      showToast('Contract ratified & signed! Assigned tasks written to Calendar & Tasks.', 'success');
      await loadContracts();
    } catch (err: any) {
      showToast(err.message || 'Failed to sign contract', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReportViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) {
      showToast('Please provide violation audit details', 'error');
      return;
    }

    const payload: GovernanceReportData = {
      contractId: selectedContract?.id,
      reporterUid: currentUserUid,
      reportedAdminUid: reportAdminUid.trim() || selectedContract?.admin_uid || 'unspecified_admin',
      violationType: reportViolationType,
      details: reportDetails.trim(),
    };

    try {
      setLoading(true);
      await governanceService.reportMaliciousLockdown(payload);
      showToast('Violation report dispatched to Cymatic Safety Tribunal.', 'success');
      setReportDetails('');
      setReportAdminUid('');
      setActiveTab('contracts');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered contracts based on perspective and status tab
  const displayedContracts = contracts.filter((c) => {
    const isAdmin = c.admin_uid === currentUserUid;
    const isMember = c.member_uid === currentUserUid || (userEmail && c.target_members?.some(m => m.email.toLowerCase() === userEmail.toLowerCase()));
    
    // In admin perspective, show contracts where current user is admin
    if (viewPerspective === 'admin' && !isAdmin) return false;
    // In member perspective, show contracts where current user is target member/ward
    if (viewPerspective === 'member' && !isMember && isAdmin) return false;

    if (contractsFilter === 'active') return c.status === 'active';
    if (contractsFilter === 'pending') return c.status === 'pending_member_approval' || c.status === 'negotiating';
    if (contractsFilter === 'drafts') return c.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-2xl border font-mono text-xs shadow-2xl flex items-center gap-3 animate-in fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-300' 
            : toast.type === 'error'
            ? 'bg-red-950/95 border-red-500/50 text-red-300'
            : 'bg-cyan-950/95 border-cyan-500/50 text-cyan-300'
        }`}>
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
          {toast.type === 'error' && <XCircle size={16} className="text-red-400" />}
          {toast.type === 'info' && <Zap size={16} className="text-cyan-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Delete Governance Contract?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              This action will permanently delete this contract and stop enforcing its schedule, locked apps, and routines. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteContract(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System App Selector Modal */}
      <SystemAppSelectorModal
        isOpen={isAppSelectorOpen}
        onClose={() => setIsAppSelectorOpen(false)}
        selectedPackages={selectedPackages}
        onConfirmSelection={(packages) => setSelectedPackages(packages)}
      />

      {/* Header Banner & Perspective Switcher */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900/90 to-emerald-950/30 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scale size={140} className="text-emerald-400" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2">
              <Scale size={16} />
              <span>Universal Governance & Institutional Consent Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
              Contract Governance
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Bilateral covenants, background email invitations, institutional templates, and routine task synchronization.
            </p>
          </div>

          {/* Perspective Switcher: Administrator vs. Managed Member */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-1 flex items-center">
              <button
                onClick={() => setViewPerspective('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  viewPerspective === 'admin'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Briefcase size={13} />
                <span>Administrator</span>
              </button>
              <button
                onClick={() => setViewPerspective('member')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  viewPerspective === 'member'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye size={13} />
                <span>Managed Member</span>
              </button>
            </div>

            <button
              onClick={loadContracts}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition border border-gray-700"
              title="Refresh Contracts"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-400' : ''} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-800/80">
          {[
            { id: 'contracts', label: viewPerspective === 'admin' ? 'Issued Contracts' : 'Contracts Administered on Me', icon: FileText },
            ...(viewPerspective === 'admin' ? [
              { id: 'templates', label: 'Sector Templates', icon: Sparkles },
              { id: 'draft', label: editingContractId ? 'Edit Draft Contract' : 'Draft New Contract', icon: PlusCircle }
            ] : []),
            { id: 'negotiate', label: 'Bilateral & AI Shadow', icon: Bot },
            { id: 'report', label: 'Report Abuse', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border ${
                  active
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon size={14} className={active ? 'text-emerald-400' : 'text-gray-500'} />
                <span>{tab.label}</span>
                {tab.id === 'contracts' && displayedContracts.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                    {displayedContracts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CONTRACTS LIST */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          {/* Sub-Filters */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-gray-900/60 border border-gray-800 p-1 rounded-2xl">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'drafts', label: 'Drafts' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setContractsFilter(f.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
                    contractsFilter === f.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {viewPerspective === 'admin' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-gray-700 rounded-xl text-xs font-mono transition flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Choose Template</span>
                </button>
                <button
                  onClick={() => {
                    setEditingContractId(null);
                    setDraftTitle('');
                    setActiveTab('draft');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
                >
                  <PlusCircle size={14} />
                  <span>New Contract</span>
                </button>
              </div>
            )}
          </div>

          {displayedContracts.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-12 text-center space-y-4">
              <Scale size={48} className="text-gray-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  No Contracts in this category
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                  {viewPerspective === 'admin'
                    ? 'You have not drafted or issued any contracts yet. Pick a pre-configured template or draft a custom covenant.'
                    : 'You have no contracts currently administered on your account.'}
                </p>
              </div>
              {viewPerspective === 'admin' && (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-gray-700 rounded-2xl text-xs font-bold uppercase tracking-wider"
                  >
                    Browse Sector Templates
                  </button>
                  <button
                    onClick={() => setActiveTab('draft')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider"
                  >
                    Draft First Contract
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedContracts.map((c) => {
                const isSelected = selectedContract?.id === c.id;
                const isAdmin = c.admin_uid === currentUserUid;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContract(c)}
                    className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gray-900 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold bg-gray-800 text-gray-300">
                          {c.institution_type || 'household'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : c.status === 'draft'
                            ? 'bg-gray-700/40 text-gray-400 border border-gray-600/30'
                            : c.status === 'negotiating'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white mb-1 flex items-center justify-between">
                          <span>{c.contract_title}</span>
                          <ChevronRight size={16} className={isSelected ? 'text-emerald-400' : 'text-gray-600'} />
                        </h3>
                        {c.contract_description && (
                          <p className="text-xs text-gray-400 line-clamp-2">{c.contract_description}</p>
                        )}
                      </div>

                      {/* Details summary */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-800/80 rounded-md">
                          👥 {c.target_members?.length || 1} Member{c.target_members?.length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-800/80 rounded-md">
                          📦 {c.agreed_packages?.length || 0} Apps Locked
                        </span>
                        <span className="px-2 py-0.5 bg-gray-800/80 rounded-md">
                          📋 {c.assigned_tasks?.length || 0} Tasks & Routines
                        </span>
                        {c.block_nudity && (
                          <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-900/40 rounded-md">
                            🛡️ Anti-Nudity
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Administrator options: edit draft, delete */}
                        {isAdmin && (
                          <>
                            {c.status === 'draft' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDraft(c);
                                }}
                                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono flex items-center gap-1"
                                title="Edit Draft"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(c.id);
                              }}
                              className="p-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/40 rounded-xl text-xs transition"
                              title="Delete Contract"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                        
                        {/* Professional Share Menu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // If native share is available, use it, otherwise show a simplified menu
                            if (navigator.share) {
                              navigator.share({
                                title: c.contract_title,
                                text: `Governance Pact: ${c.contract_title}`,
                                url: `https://app.cymatic.os/contracts/${c.id}`
                              }).catch(() => {});
                            } else {
                              // Simplified sharing alternatives
                              import('../../utils/ShareManager').then(m => m.ShareManager.shareContract(c, 'email'));
                            }
                          }}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono flex items-center gap-1"
                          title="Share Contract"
                        >
                          <Send size={12} />
                          <span>Share</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContract(c);
                            setActiveTab('negotiate');
                          }}
                          className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold uppercase tracking-wider transition"
                        >
                          Inspect & Mediate
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SECTOR TEMPLATES (100% EDITABLE) */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Institutional Governance Templates
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select any pre-configured template to load into the contract editor. Every command, title, target, routine, and day is 100% editable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GOVERNANCE_TEMPLATES.map((tpl) => {
              return (
                <div
                  key={tpl.id}
                  className="bg-gray-900/60 border border-gray-800 hover:border-emerald-500/50 rounded-3xl p-5 flex flex-col justify-between transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {tpl.badge}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {tpl.defaultStartTime} - {tpl.defaultEndTime}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {tpl.tagline}
                      </p>
                    </div>

                    {/* Assigned Tasks Preview */}
                    <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">
                        Pre-Configured Routines:
                      </span>
                      {tpl.assignedTasks.map((t) => (
                        <div key={t.id} className="text-[11px] text-gray-300 flex items-center justify-between">
                          <span className="truncate max-w-[180px]">• {t.title}</span>
                          <span className="text-[10px] font-mono text-gray-500 shrink-0">{t.startTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyTemplate(tpl)}
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>Load & Customize Template</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DRAFT OR EDIT CONTRACT */}
      {activeTab === 'draft' && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                {editingContractId ? 'Edit Contract Draft' : 'Draft Bilateral Governance Contract'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage target members (max 5 on Free Tier), schedule days/dates, select device apps, and assign routines.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/40 rounded-xl text-[11px] font-mono text-emerald-300">
                Tier: <strong className="uppercase">{tier}</strong> (5 Max Members)
              </span>
            </div>
          </div>

          {/* Section 1: Title & Institution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                Contract Title *
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="e.g. Household Evening Study & Bedtime Harmony"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                Institution / Context
              </label>
              <select
                value={draftInstitution}
                onChange={(e) => setDraftInstitution(e.target.value as any)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="household">Household & Family</option>
                <option value="educational">Educational Institution</option>
                <option value="corporate">Corporate Organization</option>
                <option value="sports_team">Sports & Athletic Team</option>
                <option value="social_club">Social Club & Community</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                Contract Objective & Preamble (Optional)
              </label>
              <input
                type="text"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Briefly state the shared goal of this discipline pact..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Target Members (Max 5 for Free Tier) */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-gray-300 block font-bold">
                  Target Members to Manage (Free Tier: Up to 5 Members)
                </label>
                <p className="text-[11px] text-gray-400">
                  Enter name, email (for background invitation dispatch), and optional phone number.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>Add Member ({targetMembers.length}/5)</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {targetMembers.map((member, idx) => (
                <div key={idx} className="p-3 bg-gray-950 border border-gray-800 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                      placeholder="Member Name (e.g. John Doe)"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => handleUpdateMember(idx, 'email', e.target.value)}
                      placeholder="member@email.com"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="tel"
                      value={member.phone || ''}
                      onChange={(e) => handleUpdateMember(idx, 'phone', e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition"
                      title="Remove Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Flexible Scheduling & Excluded Days */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-gray-300 block font-bold">
                Date Range & Active Schedule
              </label>
              <p className="text-[11px] text-gray-400">
                Specify duration, select active days, and exclude specific days (e.g. weekends or mid-week rest).
              </p>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">From Date (Start)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">To Date (End)</label>
                <input
                  type="date"
                  value={endDate}
                  disabled={isOngoing}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={isOngoing}
                    onChange={(e) => setIsOngoing(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded bg-gray-900 border-gray-700"
                  />
                  <span>Ongoing / Continuous Pact</span>
                </label>
              </div>
            </div>

            {/* Days of Week Selector */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono text-gray-400">Active Days of Week:</span>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isDayActive = activeDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleActiveDay(d.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                        isDayActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-gray-950 text-gray-500 border border-gray-800 hover:text-gray-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Excluded Days Selector */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono text-gray-400">
                Excluded Days (Pact is NOT enforced on these days):
              </span>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isExcluded = excludedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleExcludedDay(d.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                        isExcluded
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                          : 'bg-gray-950 text-gray-500 border border-gray-800 hover:text-gray-300'
                      }`}
                    >
                      {isExcluded ? `✕ ${d.label} (Excluded)` : d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Operational Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">
                  Daily Window Start Time
                </label>
                <input
                  type="time"
                  value={draftStartTime}
                  onChange={(e) => setDraftStartTime(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">
                  Daily Window End Time
                </label>
                <input
                  type="time"
                  value={draftEndTime}
                  onChange={(e) => setDraftEndTime(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Target Restricted Apps (Dynamic System App Selector - No Hardcoding!) */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-gray-300 block font-bold">
                  Restricted Applications (Selected from System Apps)
                </label>
                <p className="text-[11px] text-gray-400">
                  Select apps installed on your device to suppress during operational hours. Zero hardcoding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAppSelectorOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Smartphone size={14} />
                <span>Select Device Apps ({selectedPackages.length})</span>
              </button>
            </div>

            {selectedPackages.length === 0 ? (
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl text-center text-xs text-gray-400">
                No apps selected yet. Click "Select Device Apps" to choose from apps installed on your system.
              </div>
            ) : (
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl flex flex-wrap gap-2">
                {selectedPackages.map((pkg) => (
                  <span
                    key={pkg}
                    className="px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-1.5"
                  >
                    <span>{pkg}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPackages(selectedPackages.filter((p) => p !== pkg))}
                      className="text-gray-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Assigned Routines & Tasks (Synced to Calendar & Tasks) */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-gray-300 block font-bold">
                  Assigned Routines & Tasks (Auto-Synced to Calendar & Tasks)
                </label>
                <p className="text-[11px] text-gray-400">
                  Each assigned task will automatically be written to the calendar and task vaults of all parties.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Task Routine</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {assignedTasks.map((task, idx) => (
                <div key={task.id || idx} className="p-3.5 bg-gray-950 border border-gray-800 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateTask(idx, 'title', e.target.value)}
                      placeholder="Task Title (e.g. STEM Lab Homework)"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="time"
                      value={task.startTime}
                      onChange={(e) => handleUpdateTask(idx, 'startTime', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="time"
                      value={task.endTime}
                      onChange={(e) => handleUpdateTask(idx, 'endTime', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={task.category}
                      onChange={(e) => handleUpdateTask(idx, 'category', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="deep_work">Deep Work</option>
                      <option value="architecture">Architecture</option>
                      <option value="spiritual">Spiritual</option>
                      <option value="fitness">Fitness</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition"
                      title="Remove Task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Anti-Nudity Filter Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-950 border border-gray-800 rounded-2xl">
            <input
              type="checkbox"
              id="blockNudity"
              checked={draftBlockNudity}
              onChange={(e) => setDraftBlockNudity(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded bg-gray-900 border-gray-700 focus:ring-emerald-500"
            />
            <label htmlFor="blockNudity" className="text-xs text-gray-300 cursor-pointer">
              <strong className="text-white">Strict Anti-Nudity & Harmful Content Filter:</strong> Block explicit adult domains and illicit media triggers across device telemetry.
            </label>
          </div>

          {/* Action Buttons: Save as Draft vs. Issue & Background Email */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmitContract(true)}
                disabled={loading}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2"
              >
                <Save size={15} />
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitContract(false)}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center gap-2"
              >
                <Mail size={15} />
                <span>Issue & Send Background Email Invites</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NEGOTIATE & AI SHADOW AGREEMENT */}
      {activeTab === 'negotiate' && (
        <div className="space-y-6">
          {!selectedContract ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-10 text-center">
              <p className="text-sm text-gray-400">Please select a contract from the Contracts tab to inspect and negotiate.</p>
              <button
                onClick={() => setActiveTab('contracts')}
                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Go to Contracts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contract Terms Sidebar */}
              <div className="lg:col-span-1 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Contract Terms
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                    selectedContract.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedContract.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{selectedContract.contract_title}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {selectedContract.id.substring(0, 12)}...</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Restricted Apps */}
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80">
                    <span className="text-gray-400 block text-[10px] font-mono uppercase mb-1">Restricted Apps:</span>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-emerald-300">
                      {(selectedContract.agreed_packages || []).length === 0 ? (
                        <span className="text-gray-500">No specific app restrictions</span>
                      ) : (
                        selectedContract.agreed_packages.map((pkg) => (
                          <span key={pkg} className="px-2 py-0.5 bg-gray-900 rounded border border-gray-800">
                            {pkg}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Active Days & Time Windows */}
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80">
                    <span className="text-gray-400 block text-[10px] font-mono uppercase mb-1">Operating Hours:</span>
                    {(selectedContract.agreed_time_windows || []).map((tw, i) => (
                      <div key={i} className="text-gray-300 font-mono text-[11px] flex items-center gap-1.5">
                        <Clock size={12} className="text-emerald-400" />
                        <span>{tw.day}: {tw.startTime} - {tw.endTime}</span>
                      </div>
                    ))}
                    {selectedContract.excluded_days && selectedContract.excluded_days.length > 0 && (
                      <div className="mt-1 text-[10px] font-mono text-amber-400">
                        Excluded: {selectedContract.excluded_days.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Assigned Routines */}
                  {selectedContract.assigned_tasks && selectedContract.assigned_tasks.length > 0 && (
                    <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80 space-y-1">
                      <span className="text-gray-400 block text-[10px] font-mono uppercase">Assigned Tasks ({selectedContract.assigned_tasks.length}):</span>
                      {selectedContract.assigned_tasks.map((task, i) => (
                        <div key={i} className="text-[11px] text-gray-300 flex items-center justify-between">
                          <span>• {task.title}</span>
                          <span className="text-[10px] font-mono text-gray-500">{task.startTime}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-800 space-y-2">
                  <button
                    onClick={handleSynthesizeAI}
                    disabled={aiSynthesizing}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Bot size={15} />
                    <span>{aiSynthesizing ? 'Synthesizing...' : 'Synthesize AI Shadow Agreement'}</span>
                  </button>

                  {selectedContract.status !== 'active' && (
                    <button
                      onClick={handleSignContract}
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={15} />
                      <span>{viewPerspective === 'member' ? 'Agree & Sign Covenant' : 'Ratify & Activate'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bilateral Negotiation Feed */}
              <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Bilateral Negotiation Feed & Mediator Notes
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    {comments.length} message{comments.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 py-4 custom-scrollbar">
                  {comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-xs font-mono">
                      No bilateral negotiation remarks yet. Send a note or trigger AI shadow synthesis.
                    </div>
                  ) : (
                    comments.map((cm) => {
                      const isAI = cm.sender_uid === 'ai_shadow_mediator_bot';
                      const isMe = cm.sender_uid === currentUserUid;

                      return (
                        <div
                          key={cm.id}
                          className={`p-3.5 rounded-2xl max-w-[85%] ${
                            isAI
                              ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/40 text-emerald-200 mx-auto w-full max-w-full'
                              : isMe
                              ? 'bg-emerald-950/50 border border-emerald-800/50 text-white ml-auto'
                              : 'bg-gray-800/80 border border-gray-700 text-gray-200 mr-auto'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1 opacity-75">
                            <span className="font-bold flex items-center gap-1">
                              {isAI && <Bot size={12} className="text-emerald-400" />}
                              {cm.sender_moniker}
                            </span>
                            <span>{new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{cm.comment_text}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendComment} className="pt-3 border-t border-gray-800 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Type counter-proposal, objection, or consensus note..."
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                    title="Send"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORT MALICIOUS LOCKDOWN */}
      {activeTab === 'report' && (
        <form onSubmit={handleReportViolation} className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold uppercase mb-1">
              <ShieldAlert size={16} />
              <span>Anti-Bullying & Out-of-Bounds Enforcement Tribunal</span>
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              File Malicious Admin Trigger Report
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              If an administrator or guardian initiates an out-of-bounds lockdown outside agreed hours or with punitive intent, log an irrefutable report for platform safety audit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                Reported Admin Identifier / UID
              </label>
              <input
                type="text"
                value={reportAdminUid}
                onChange={(e) => setReportAdminUid(e.target.value)}
                placeholder={selectedContract?.admin_uid || "admin_uid_or_email"}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                Violation Classification
              </label>
              <select
                value={reportViolationType}
                onChange={(e) => setReportViolationType(e.target.value as any)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="unauthorized_trigger">Unauthorized Lockdown Trigger</option>
                <option value="out_of_agreed_hours">Enforcement Out of Agreed Window Hours</option>
                <option value="malicious_intent">Malicious Intent or Bullying</option>
                <option value="unacceptable_rule">Unacceptable / Hostile Rule Imposition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
              Incident Context & Forensic Description *
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Describe the timestamp, attempted lockdown reason, and why this violates the signed bilateral covenants..."
              rows={4}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-950/50 flex items-center gap-2"
            >
              <AlertTriangle size={15} />
              <span>Submit Incident Report</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ContractNegotiator;
