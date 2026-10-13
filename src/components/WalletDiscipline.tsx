import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useWalletBreakdown } from '../hooks/useWalletBreakdown';
import { BalanceDisplay } from './wallet/BalanceDisplay';
import { TransactionForm } from './wallet/TransactionForm';
import { AllocationPillars } from './wallet/AllocationPillars';
import { TransactionHistory } from './wallet/TransactionHistory';

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

  const breakdown = useWalletBreakdown(wallet.cashOnHand);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch (e) {
      console.error('Wallet Storage Save Failed:', e);
    }
  }, [wallet]);

  const unintendedTotal = wallet.transactions
      .filter(t => t.type === 'expense' && t.category === 'unintended')
      .reduce((sum, t) => sum + t.amount, 0);

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

      <BalanceDisplay 
        cashOnHand={wallet.cashOnHand}
        currency={wallet.currency}
        unintendedTotal={unintendedTotal}
        mode={mode}
        setMode={setMode}
      />

      {mode !== 'view' && (
        <TransactionForm 
          mode={mode as 'deposit' | 'expense'}
          amountInput={amountInput}
          setAmountInput={setAmountInput}
          categoryInput={categoryInput}
          setCategoryInput={setCategoryInput}
          noteInput={noteInput}
          setNoteInput={setNoteInput}
          onSubmit={mode === 'deposit' ? handleDeposit : handleExpense}
          onCancel={() => setMode('view')}
          currency={wallet.currency}
        />
      )}

      <AllocationPillars breakdown={breakdown} currency={wallet.currency} />
      <TransactionHistory transactions={wallet.transactions} currency={wallet.currency} />
    </div>
  );
}
