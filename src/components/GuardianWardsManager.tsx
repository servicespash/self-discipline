/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * GuardianWardsManager - Parental Control & Remote Device Discipline Governance Component
 * Designed against the new robust public.guardian_wards database migration schema.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, Users, Plus, Check, Eye, EyeOff, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSession } from '../context/SessionContext';

interface GuardianWardRecord {
  id: string;
  guardian_uid: string;
  student_uid: string;
  block_nudity: boolean;
  strict_revision_lockdown: boolean;
  remote_lock_active: boolean;
  allowed_study_hours: Array<{ start: string; end: string }>;
  created_at: string;
  updated_at: string;
}

export default function GuardianWardsManager() {
  const { session, uid } = useSession();
  const [wards, setWards] = useState<GuardianWardRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newStudentUid, setNewStudentUid] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isGuardian = session?.role === 'Guardian' || session?.role === 'admin' || session?.role === 'Administrator';

  useEffect(() => {
    if (!uid) return;

    const fetchWards = async () => {
      setLoading(true);
      const query = isGuardian
        ? supabase.from('guardian_wards').select('*').eq('guardian_uid', uid)
        : supabase.from('guardian_wards').select('*').eq('student_uid', uid);

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching guardian wards:', error);
      } else if (data) {
        setWards(data as GuardianWardRecord[]);
      }
      setLoading(false);
    };

    fetchWards();
  }, [uid, isGuardian]);

  const handleToggleSetting = async (wardId: string, field: keyof GuardianWardRecord, currentValue: boolean) => {
    const nextValue = !currentValue;
    const { error } = await supabase
      .from('guardian_wards')
      .update({ [field]: nextValue })
      .eq('id', wardId);

    if (error) {
      showToast('Failed to update governance policy');
      console.error(error);
      return;
    }

    setWards(wards.map(w => w.id === wardId ? { ...w, [field]: nextValue } : w));
    showToast(`Updated ${field.replace(/_/g, ' ')} successfully.`);
  };

  const handleAddWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentUid.trim() || !uid) return;

    const newRecord = {
      guardian_uid: uid,
      student_uid: newStudentUid.trim(),
      block_nudity: true,
      strict_revision_lockdown: true,
      remote_lock_active: false,
      allowed_study_hours: [{ start: '08:00', end: '20:00' }]
    };

    const { data, error } = await supabase
      .from('guardian_wards')
      .insert([newRecord])
      .select();

    if (error) {
      showToast('Error linking student ward. Ensure valid student UID.');
      console.error(error);
      return;
    }

    if (data && data[0]) {
      setWards([...wards, data[0] as GuardianWardRecord]);
    }

    setNewStudentUid('');
    showToast('Student ward successfully linked under guardian governance.');
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 text-gray-100 min-w-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-emerald-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-gray-900 via-gray-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-wider">
            <Users size={12} /> Parental Controls & Guardian Wards
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Remote Device Discipline Governance
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            {isGuardian 
              ? 'Manage nudity filtering, discipline lockdowns, and remote device locks for linked student wards.' 
              : 'View active guardian protections and discipline hours governing your student device session.'}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <ShieldCheck size={14} /> Active RLS Sovereignty
          </span>
        </div>
      </div>

      {/* Add Ward Form (For Guardians) */}
      {isGuardian && (
        <form onSubmit={handleAddWard} className="p-5 bg-gray-950 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
          <div className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Plus size={14} className="text-indigo-400" /> Link Student Ward UID
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newStudentUid}
              onChange={(e) => setNewStudentUid(e.target.value)}
              placeholder="Enter student Supabase user UID..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer shrink-0"
            >
              Establish Governance
            </button>
          </div>
        </form>
      )}

      {/* Wards List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
          {isGuardian ? `Linked Student Wards (${wards.length})` : 'Guardian Governance Protections'}
        </h3>

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs bg-gray-950/60 rounded-2xl border border-gray-800">
            Loading governance records...
          </div>
        ) : wards.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs bg-gray-950/60 rounded-2xl border border-gray-800 space-y-2">
            <ShieldAlert size={24} className="mx-auto text-indigo-400 opacity-60" />
            <p>No active guardian-ward governance records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {wards.map((ward) => (
              <div 
                key={ward.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  ward.remote_lock_active 
                    ? 'bg-red-950/20 border-red-500/40' 
                    : 'bg-gray-950/80 border-gray-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 font-bold">
                        Student: {ward.student_uid}
                      </span>
                      {ward.remote_lock_active && (
                        <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-[9px] font-black uppercase animate-pulse">
                          🔒 Remote Lockdown Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      Guardian: {ward.guardian_uid} • Updated: {new Date(ward.updated_at).toLocaleString()}
                    </div>
                  </div>

                  {isGuardian && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSetting(ward.id, 'remote_lock_active', ward.remote_lock_active)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                          ward.remote_lock_active
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-gray-950'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        {ward.remote_lock_active ? 'Release Lock' : 'Trigger Remote Lock'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Nudity Filtering</span>
                      <span className="text-xs font-mono text-white font-bold">
                        {ward.block_nudity ? '🛡️ Enabled (Strict)' : '⚠️ Disabled'}
                      </span>
                    </div>
                    {isGuardian && (
                      <button
                        type="button"
                        onClick={() => handleToggleSetting(ward.id, 'block_nudity', ward.block_nudity)}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-bold"
                      >
                        Toggle
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Discipline Lockdown</span>
                      <span className="text-xs font-mono text-white font-bold">
                        {ward.strict_revision_lockdown ? '🔒 Strict Active' : '⚡ Flexible'}
                      </span>
                    </div>
                    {isGuardian && (
                      <button
                        type="button"
                        onClick={() => handleToggleSetting(ward.id, 'strict_revision_lockdown', ward.strict_revision_lockdown)}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-bold"
                      >
                        Toggle
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 bg-gray-900/80 rounded-2xl border border-gray-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Allowed Discipline Window</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {ward.allowed_study_hours?.[0]?.start || '08:00'} - {ward.allowed_study_hours?.[0]?.end || '20:00'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
