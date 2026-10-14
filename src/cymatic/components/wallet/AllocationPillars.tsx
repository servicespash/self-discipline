// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import React from 'react';
import { PiggyBank, Zap, TrendingUp, ShieldAlert } from 'lucide-react';

interface AllocationPillarsProps {
  breakdown: { savings: number, operations: number, investment: number, unintended: number };
  currency: string;
}

export const AllocationPillars: React.FC<AllocationPillarsProps> = ({ breakdown, currency }) => (
  <div className="space-y-3">
    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disciplined Capital Pillars</h4>
    <div className="grid grid-cols-2 gap-2.5">
      <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase mb-1">
          <PiggyBank size={12} /> Savings (30%)
        </div>
        <p className="text-sm font-black text-white">{breakdown.savings.toLocaleString()} <span className="text-[9px] text-gray-500">{currency}</span></p>
      </div>

      <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
        <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase mb-1">
          <Zap size={12} /> Operations (40%)
        </div>
        <p className="text-sm font-black text-white">{breakdown.operations.toLocaleString()} <span className="text-[9px] text-gray-500">{currency}</span></p>
      </div>

      <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
        <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-black uppercase mb-1">
          <TrendingUp size={12} /> R&D / Build (20%)
        </div>
        <p className="text-sm font-black text-white">{breakdown.investment.toLocaleString()} <span className="text-[9px] text-gray-500">{currency}</span></p>
      </div>

      <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
        <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase mb-1">
          <ShieldAlert size={12} /> Unintended (10%)
        </div>
        <p className="text-sm font-black text-white">{breakdown.unintended.toLocaleString()} <span className="text-[9px] text-gray-500">{currency}</span></p>
      </div>
    </div>
  </div>
);
