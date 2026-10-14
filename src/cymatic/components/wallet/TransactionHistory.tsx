// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { History } from 'lucide-react';
import { Transaction } from '../WalletDiscipline';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currency: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, currency }) => (
  <div className="space-y-2">
    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      <History size={12} /> Financial Audit Log
    </h4>
    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
      {transactions.length === 0 && (
        <p className="text-[10px] text-gray-600 font-bold uppercase text-center py-4">No transactions recorded.</p>
      )}
      {transactions.map((tx) => (
        <div key={tx.id} className="p-2.5 bg-gray-950/80 rounded-xl border border-gray-800/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-gray-300 truncate">{tx.note}</p>
            <span className="text-[8px] font-black uppercase tracking-wider text-gray-500">
              {tx.category} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className={`text-xs font-black ${tx.type === 'cash_in' ? 'text-emerald-400' : 'text-red-400'}`}>
            {tx.type === 'cash_in' ? '+' : '-'}{tx.amount.toLocaleString()} {currency}
          </div>
        </div>
      ))}
    </div>
  </div>
);
