/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Solidified Capital & Wallet Discipline Matrix (UGX / Cash Control)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  ShieldAlert, 
  PiggyBank, 
  TrendingUp, 
  Zap, 
  History, 
  Plus, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface Transaction {
  id: string;
  amount: number;
  type: 'cash_in' | 'expense';
  category: 'savings' | 'operations' | 'investment' | 'unintended';
  note: string;
  timestamp: number;
}

export interface WalletStorage {
  cashOnHand: number;
  currency: string;
  transactions: Transaction[];
}

const STORAGE_KEY = 'sdc_wallet_discipline_v2';

const INITIAL_WALLET: WalletStorage = {
  cashOnHand: 10000,
  currency: 'UGX',
  transactions: [
    {
      id: 'init_1',
      amount: 10000,
      type: 'cash_in',
      category: 'operations',
      note: 'Initial Cash in Hand Report',
      timestamp: Date.now()
    }
  ]
};

export default function WalletDiscipline({ data }: { data?: any }) {
  const [wallet, setWallet] = useState<WalletStorage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_WALLET;
    } catch {
      return INITIAL_WALLET;
    }
  });

  const [mode, setMode] = useState<'view' | 'deposit' | 'expense'>('view');
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<'savings' | 'operations' | 'investment' | 'unintended'>('operations');
  const [noteInput, setNoteInput] = useState<string>('');

  // Local Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch (e) {
      console.error('Wallet Storage Save Failed:', e);
    }
  }, [wallet]);

  // Financial Breakdown Logic (Calculated off current Liquid Cash)
  const breakdown = useMemo(() => {
    const cash = Math.max(0, wallet.cashOnHand);
    return {
      savings: Math.round(cash * 0.30),      // 30% Savings Vault
      operations: Math.round(cash * 0.40),   // 40% Daily Operations & Food
      investment: Math.round(cash * 0.20),   // 20% R&D & Execution
      unintended: Math.round(cash * 0.10)    // 10% Unintended Expenditure Buffer
    };
  }, [wallet.cashOnHand]);

  // Unintended Expenditures Analysis
  const unintendedTotal = useMemo(() => {
    return wallet.transactions
      .filter(t => t.type === 'expense' && t.category === 'unintended')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [wallet.transactions]);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      amount: val,
      type: 'cash_in',
      category: categoryInput,
      note: noteInput.trim() || 'Cash In Hand Reported',
      timestamp: Date.now()
    };

    setWallet(prev => ({
      ...prev,
      cashOnHand: prev.cashOnHand + val,
      transactions: [newTx, ...prev.transactions]
    }));

    setAmountInput('');
    setNoteInput('');
    setMode('view');
  };

  const handleExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      amount: val,
      type: 'expense',
      category: categoryInput,
      note: noteInput.trim() || 'Expenditure',
      timestamp: Date.now()
    };

    setWallet(prev => ({
      ...prev,
      cashOnHand: Math.max(0, prev.cashOnHand - val),
      transactions: [newTx, ...prev.transactions]
    }));

    setAmountInput('');
    setNoteInput('');
    setMode('view');
  };

  return (
    <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Wallet size={18} className="text-emerald-400" /> Capital Control Matrix
        </h3>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase rounded-full">
          {wallet.currency} Active
        </span>
      </div>

      {/* Main Liquid Balance Display */}
      <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Liquid Cash in Hand</p>
            <p className="text-3xl font-black text-white tracking-tight">
              {wallet.cashOnHand.toLocaleString()} <span className="text-xs font-bold text-emerald-400">{wallet.currency}</span>
            </p>
          </div>
          {unintendedTotal > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[9px] font-bold">
              <AlertTriangle size={12} />
              <span>Unintended: {unintendedTotal.toLocaleString()} {wallet.currency}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => setMode(mode === 'deposit' ? 'view' : 'deposit')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
              mode === 'deposit'
                ? 'bg-emerald-600 text-gray-950 border-emerald-400'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Plus size={14} /> Report Cash
          </button>
          <button
            onClick={() => setMode(mode === 'expense' ? 'view' : 'expense')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
              mode === 'expense'
                ? 'bg-red-600 text-white border-red-400'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
            }`}
          >
            <ArrowDownRight size={14} /> Log Expense
          </button>
        </div>
      </div>

      {/* Action Form (Deposit / Expense) */}
      {mode !== 'view' && (
        <form onSubmit={mode === 'deposit' ? handleDeposit : handleExpense} className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase text-gray-300">
              {mode === 'deposit' ? 'Report Cash In Hand' : 'Log Expenditure / Debt'}
            </h4>
            <button type="button" onClick={() => setMode('view')} className="text-[10px] text-gray-500 font-bold uppercase hover:text-white">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Amount ({wallet.currency})</label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Pillar Allocation</label>
              <select
                value={categoryInput}
                onChange={(e: any) => setCategoryInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="operations">⚡ Operations (40%)</option>
                <option value="savings">🛡️ Savings Vault (30%)</option>
                <option value="investment">🚀 R&D / Execution (20%)</option>
                <option value="unintended">⚠️ Unintended Expenditure (10%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Note / Description</label>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g. Food, Transport, Hardware Component"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              mode === 'deposit'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-gray-950'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {mode === 'deposit' ? 'Confirm Cash In' : 'Deduct Expense'}
          </button>
        </form>
      )}

      {/* Disciplined Allocation Pillars */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disciplined Capital Pillars</h4>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase mb-1">
              <PiggyBank size={12} /> Savings (30%)
            </div>
            <p className="text-sm font-black text-white">{breakdown.savings.toLocaleString()} <span className="text-[9px] text-gray-500">{wallet.currency}</span></p>
          </div>

          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase mb-1">
              <Zap size={12} /> Operations (40%)
            </div>
            <p className="text-sm font-black text-white">{breakdown.operations.toLocaleString()} <span className="text-[9px] text-gray-500">{wallet.currency}</span></p>
          </div>

          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-black uppercase mb-1">
              <TrendingUp size={12} /> R&D / Build (20%)
            </div>
            <p className="text-sm font-black text-white">{breakdown.investment.toLocaleString()} <span className="text-[9px] text-gray-500">{wallet.currency}</span></p>
          </div>

          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase mb-1">
              <ShieldAlert size={12} /> Unintended (10%)
            </div>
            <p className="text-sm font-black text-white">{breakdown.unintended.toLocaleString()} <span className="text-[9px] text-gray-500">{wallet.currency}</span></p>
          </div>
        </div>
      </div>

      {/* Transaction History Log */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <History size={12} /> Financial Audit Log
        </h4>
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          {wallet.transactions.length === 0 && (
            <p className="text-[10px] text-gray-600 font-bold uppercase text-center py-4">No transactions recorded.</p>
          )}
          {wallet.transactions.map((tx) => (
            <div key={tx.id} className="p-2.5 bg-gray-950/80 rounded-xl border border-gray-800/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-gray-300 truncate">{tx.note}</p>
                <span className="text-[8px] font-black uppercase tracking-wider text-gray-500">
                  {tx.category} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`text-xs font-black ${tx.type === 'cash_in' ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.type === 'cash_in' ? '+' : '-'}{tx.amount.toLocaleString()} {wallet.currency}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
