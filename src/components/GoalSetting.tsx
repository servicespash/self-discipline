import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Target, Trash2, ShieldAlert, Plus, Calendar, Clock } from 'lucide-react';

interface Goal {
  text: string;
  startDate?: string;
  endDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function GoalSetting() {
  const [goalText, setGoalText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rules, setRules] = useState({ sleep: '', restrictedApps: '', dailyRoutine: '' });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGoals(data.goals || []);
        setRules(data.rules || { sleep: '', restrictedApps: '', dailyRoutine: '' });
      }
    });
    return unsub;
  }, []);

  const saveRules = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        rules: rules
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addGoal = async () => {
    if (!auth.currentUser || !goalText) return;
    const newGoal: Goal = {
      text: goalText,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate,
      priority: priority
    };
    const newGoals = [...goals, newGoal];
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        goals: newGoals
      });
      setGoalText('');
      setStartDate('');
      setEndDate('');
    } catch (e) {
      console.error(e);
    }
  };

  const removeGoal = async (index: number) => {
    if (!auth.currentUser) return;
    const newGoals = goals.filter((_, i) => i !== index);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      goals: newGoals
    });
  };

  return (
    <div className="space-y-6">
      {/* Goals Section */}
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Target size={20} /> Goal Architecture
          </h3>
          <div className="flex gap-2">
            {['high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p as any)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border transition-all ${
                  priority === p 
                    ? 'bg-emerald-500 text-gray-950 border-emerald-400' 
                    : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4 mb-8">
          <input 
            value={goalText} 
            onChange={e => setGoalText(e.target.value)}
            placeholder="What is the high-priority objective?"
            className="w-full bg-gray-800 p-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-gray-700 transition-all"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-800 py-2.5 pl-9 pr-3 rounded-xl text-xs text-white border border-gray-700 focus:outline-none"
              />
              <span className="absolute -top-2 left-3 bg-gray-900 px-1 text-[8px] text-gray-500 uppercase font-black">Start Date</span>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-gray-800 py-2.5 pl-9 pr-3 rounded-xl text-xs text-white border border-gray-700 focus:outline-none"
              />
              <span className="absolute -top-2 left-3 bg-gray-900 px-1 text-[8px] text-gray-500 uppercase font-black">End Date</span>
            </div>
          </div>

          <button 
            onClick={addGoal} 
            disabled={!goalText}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Deploy Objective
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {goals.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-sm italic">No active objectives in orbit.</p>
            </div>
          )}
          {goals.map((g, i) => (
            <div key={i} className="p-4 bg-gray-800/40 hover:bg-gray-800/60 rounded-2xl group transition-all border border-gray-700/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${g.priority === 'high' ? 'bg-red-500' : g.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                  <span className="text-sm text-gray-100 font-bold">{g.text}</span>
                </div>
                <button 
                  onClick={() => removeGoal(i)} 
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase">
                <span className="flex items-center gap-1"><Calendar size={12} /> {g.startDate} {g.endDate ? `→ ${g.endDate}` : '(No Deadline)'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strict Rules Section */}
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <ShieldAlert size={20} /> System Enforcement
          </h3>
          <Clock size={16} className="text-gray-600" />
        </div>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Biometric Schedule (Sleep/Workout)</label>
            <input 
              value={rules.sleep}
              onChange={e => setRules({...rules, sleep: e.target.value})}
              onBlur={saveRules}
              placeholder="e.g. Sleep 23:00, Awake 05:00"
              className="w-full bg-gray-800 p-3 rounded-xl text-sm text-white border border-gray-700 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Algorithmic Suppression (Apps/Sites)</label>
            <input 
              value={rules.restrictedApps}
              onChange={e => setRules({...rules, restrictedApps: e.target.value})}
              onBlur={saveRules}
              placeholder="e.g. Socials, Streaming, News"
              className="w-full bg-gray-800 p-3 rounded-xl text-sm text-white border border-gray-700 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Daily Routine Protocol</label>
            <textarea 
              value={rules.dailyRoutine}
              onChange={e => setRules({...rules, dailyRoutine: e.target.value})}
              onBlur={saveRules}
              rows={3}
              placeholder="Step-by-step daily operations..."
              className="w-full bg-gray-800 p-3 rounded-xl text-sm text-white border border-gray-700 focus:border-emerald-500/50 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
