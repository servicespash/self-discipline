import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useWalletBreakdown } from '../hooks/useWalletBreakdown';
import { BalanceDisplay } from './wallet/BalanceDisplay';
import { TransactionForm } from './wallet/TransactionForm';
import { AllocationPillars } from './wallet/AllocationPillars';
import { TransactionHistory } from './wallet/TransactionHistory';
import { useSession } from '../context/SessionContext';
import { supabase } from '../utils/supabase';

export interface Transaction {
  id: string;
  user_uid: string;
  amount: number;
  type: 'cash_in' | 'expense';
  category: 'savings' | 'operations' | 'investment' | 'unintended';
  note: string;
  timestamp: string;
}

export default function WalletDiscipline({ data }: { data?: any }) {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashOnHand, setCashOnHand] = useState<number>(0);
  const [mode, setMode] = useState<'view' | 'deposit' | 'expense'>('view');
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<'savings' | 'operations' | 'investment' | 'unintended'>('operations');
  const [noteInput, setNoteInput] = useState<string>('');

  const breakdown = useWalletBreakdown(cashOnHand);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_uid', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setTransactions(data as Transaction[]);
      
      const balance = (data as Transaction[]).reduce((sum, t) => {
        return t.type === 'cash_in' ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);
      setCashOnHand(balance);
    };

    fetchTransactions();
  }, [user]);

  const unintendedTotal = transactions
      .filter(t => t.type === 'expense' && t.category === 'unintended')
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleTransaction = async (type: 'cash_in' | 'expense') => {
    if (!user) return;
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    const newTx = {
      user_uid: user.id,
      amount: val,
      type,
      category: categoryInput,
      note: noteInput.trim() || (type === 'cash_in' ? 'Cash In Hand' : 'Expenditure'),
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('wallet_transactions')
      .insert([newTx]);

    if (error) {
      console.error('Error adding transaction:', error);
      return;
    }

    // Refresh transactions
    const { data: updatedData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_uid', user.id)
      .order('timestamp', { ascending: false });

    if (updatedData) {
      setTransactions(updatedData as Transaction[]);
      const balance = (updatedData as Transaction[]).reduce((sum, t) => {
        return t.type === 'cash_in' ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);
      setCashOnHand(balance);
    }

    setAmountInput('');
    setNoteInput('');
    setMode('view');
  };

  return (
    <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Wallet size={18} className="text-emerald-400" /> Capital Control Matrix
        </h3>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase rounded-full">
          UGX Active
        </span>
      </div>

      <BalanceDisplay 
        cashOnHand={cashOnHand}
        currency={'UGX'}
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
          onSubmit={() => handleTransaction(mode === 'deposit' ? 'cash_in' : 'expense')}
          onCancel={() => setMode('view')}
          currency={'UGX'}
        />
      )}

      <AllocationPillars breakdown={breakdown} currency={'UGX'} />
      <TransactionHistory transactions={transactions} currency={'UGX'} />
    </div>
  );
}
