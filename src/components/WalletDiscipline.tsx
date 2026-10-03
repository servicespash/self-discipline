import { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Wallet, Plus, Minus, Edit3 } from 'lucide-react';

export default function WalletDiscipline({ data }: { data?: { budget: number, spent: number } }) {
  const budget = data?.budget || 5000;
  const spent = data?.spent || 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<'budget' | 'spent' | null>(null);
  const [tempValue, setTempValue] = useState(0);

  const healthPercentage = Math.max(0, Math.min(100, ((budget - spent) / budget) * 100));

  const handleSave = async () => {
    if (!auth.currentUser || !editType) return;
    const field = editType === 'budget' ? 'wallet.budget' : 'wallet.spent';
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      [field]: tempValue
    });
    setEditType(null);
    setIsEditing(false);
  };

  const startEdit = (type: 'budget' | 'spent') => {
    setEditType(type);
    setTempValue(type === 'budget' ? budget : spent);
    setIsEditing(true);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <Wallet size={20} /> Capital Control
        </h3>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-gray-500 hover:text-emerald-400 font-black uppercase tracking-tighter transition-colors"
        >
          {isEditing ? 'Cancel' : 'Configure'}
        </button>
      </div>

      {isEditing && editType ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
              Set {editType === 'budget' ? 'Total Allocation' : 'Total Expenditures'}
            </label>
            <input 
              type="number"
              value={tempValue}
              onChange={e => setTempValue(Number(e.target.value))}
              className="w-full bg-gray-800 p-4 rounded-2xl text-white font-black text-2xl border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner"
            />
          </div>
          <button 
            onClick={handleSave} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/40 transition-all"
          >
            Update Ledger
          </button>
        </div>
      ) : isEditing ? (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
          <button 
            onClick={() => startEdit('budget')}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-2xl text-left hover:border-emerald-500/50 transition-all group"
          >
            <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Set Allocation</p>
            <p className="text-xl font-black text-white">${budget}</p>
          </button>
          <button 
            onClick={() => startEdit('spent')}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-2xl text-left hover:border-red-500/50 transition-all group"
          >
            <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Set Spent</p>
            <p className="text-xl font-black text-white">${spent}</p>
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Discretionary Capital</p>
              <p className="text-4xl font-black text-white tracking-tighter">${budget - spent}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Utilization</p>
              <p className="text-xl font-bold text-gray-400 font-mono tracking-tighter">${spent} / ${budget}</p>
            </div>
          </div>

          <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden mb-8 border border-gray-700/50 relative">
            <div 
              className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] ${
                healthPercentage < 20 ? 'bg-red-500' : healthPercentage < 50 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${healthPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => startEdit('spent')}
              className="flex items-center justify-center gap-2 p-3.5 bg-gray-800 hover:bg-red-900/20 text-gray-400 hover:text-red-400 rounded-2xl transition-all border border-gray-700 group"
            >
              <Edit3 size={16} className="group-hover:scale-110 transition-transform" /> 
              <span className="font-black uppercase tracking-tighter text-xs">Log Expense</span>
            </button>
            <button 
              onClick={() => startEdit('budget')}
              className="flex items-center justify-center gap-2 p-3.5 bg-gray-800 hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-400 rounded-2xl transition-all border border-gray-700 group"
            >
              <Edit3 size={16} className="group-hover:scale-110 transition-transform" /> 
              <span className="font-black uppercase tracking-tighter text-xs">Adjust Budget</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
