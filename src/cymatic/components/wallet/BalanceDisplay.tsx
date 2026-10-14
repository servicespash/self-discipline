// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { Wallet, ArrowDownRight, Plus } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface BalanceDisplayProps {
  cashOnHand: number;
  currency: string;
  unintendedTotal: number;
  mode: 'view' | 'deposit' | 'expense';
  setMode: (m: 'view' | 'deposit' | 'expense') => void;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  cashOnHand, currency, unintendedTotal, mode, setMode 
}) => (
  <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
    <div className="flex justify-between items-start z-10 relative">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Liquid Cash in Hand</p>
        <p className="text-3xl font-black text-white tracking-tight">
          {cashOnHand.toLocaleString()} <span className="text-xs font-bold text-emerald-400">{currency}</span>
        </p>
      </div>
      {unintendedTotal > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[9px] font-bold">
          <AlertTriangle size={12} />
          <span>Unintended: {unintendedTotal.toLocaleString()} {currency}</span>
        </div>
      )}
    </div>

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
);
