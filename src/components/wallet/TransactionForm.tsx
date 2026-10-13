import React from 'react';

interface TransactionFormProps {
  mode: 'deposit' | 'expense';
  amountInput: string;
  setAmountInput: (val: string) => void;
  categoryInput: 'savings' | 'operations' | 'investment' | 'unintended';
  setCategoryInput: (val: 'savings' | 'operations' | 'investment' | 'unintended') => void;
  noteInput: string;
  setNoteInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  currency: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  mode, amountInput, setAmountInput, categoryInput, setCategoryInput, noteInput, setNoteInput, onSubmit, onCancel, currency 
}) => (
  <form onSubmit={onSubmit} className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-4">
    <div className="flex justify-between items-center">
      <h4 className="text-xs font-black uppercase text-gray-300">
        {mode === 'deposit' ? 'Report Cash In Hand' : 'Log Expenditure / Debt'}
      </h4>
      <button type="button" onClick={onCancel} className="text-[10px] text-gray-500 font-bold uppercase hover:text-white">Cancel</button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Amount ({currency})</label>
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
);
