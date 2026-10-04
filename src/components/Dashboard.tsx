/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Fully Dynamic Universal Discipline OS Command Center
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import { UniversalDisciplineState, FinancialEntry, UserCustomGoal } from '../types/discipline';

// Web Audio Focus Engine
const startFocusTone = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(432, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    (window as any).__focusOsc = osc;
  } catch (e) {
    console.warn('AudioContext unavailable');
  }
};

const stopFocusTone = () => {
  try {
    if ((window as any).__focusOsc) {
      (window as any).__focusOsc.stop();
      (window as any).__focusOsc = null;
    }
  } catch (e) {
    console.warn('Error stopping focus tone');
  }
};

// Internal Components
import TaskWidget from './TaskWidget';
import CalendarWidget from './CalendarWidget';

import { 
  LayoutGrid, 
  Wallet, 
  CalendarDays, 
  CheckSquare, 
  LogOut, 
  Shield, 
  Settings, 
  User,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  DollarSign,
  Target
} from 'lucide-react';

const STORAGE_KEY = 'sdc_universal_discipline_matrix_v2';

// Zero Hardcoded Defaults - All parameters dynamic and configurable by the user
const INITIAL_STATE: UniversalDisciplineState = {
  capital: {
    currencySymbol: '$',
    totalBudget: 0,
    entries: []
  },
  customGoals: [],
  dailyRoutines: [],
  lastUpdated: Date.now()
};

export default function Dashboard({ accessToken }: { accessToken: string | null }) {
  const { session, signOut } = useSession();
  const [currentView, setCurrentView] = useState<'dashboard' | 'wallet' | 'goals' | 'tasks' | 'calendar' | 'settings'>('dashboard');
  const [isFocusing, setIsFocusing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Core State Initialization
  const [state, setState] = useState<UniversalDisciplineState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      console.error('Storage Read Error:', e);
      return INITIAL_STATE;
    }
  });

  // Dynamic Finance Form Inputs
  const [entryLabel, setEntryLabel] = useState<string>('');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryCategory, setEntryCategory] = useState<'expense' | 'income' | 'savings'>('expense');

  // Dynamic Goal Form Inputs
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalUnit, setGoalUnit] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        lastUpdated: Date.now()
      }));
    } catch (e) {
      console.error('Storage Write Error:', e);
    }
  }, [state]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Finance Calculations
  const financialTotals = useMemo(() => {
    const spent = state.capital.entries
      .filter(e => e.category === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const income = state.capital.entries
      .filter(e => e.category === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const savings = state.capital.entries
      .filter(e => e.category === 'savings')
      .reduce((sum, e) => sum + e.amount, 0);

    const remaining = state.capital.totalBudget + income - spent - savings;

    return { spent, income, savings, remaining };
  }, [state.capital]);

  const toggleFocusLockdown = () => {
    if (!isFocusing) {
      setIsFocusing(true);
      if (audioEnabled) startFocusTone();
    } else {
      setIsFocusing(false);
      stopFocusTone();
    }
  };

  const setCurrencySymbol = (symbol: string) => {
    setState(prev => ({
      ...prev,
      capital: { ...prev.capital, currencySymbol: symbol }
    }));
  };

  const setTotalBudget = (amount: number) => {
    setState(prev => ({
      ...prev,
      capital: { ...prev.capital, totalBudget: Math.max(0, amount) }
    }));
  };

  const addFinancialEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(entryAmount);
    if (!entryLabel.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newEntry: FinancialEntry = {
      id: crypto.randomUUID(),
      label: entryLabel.trim(),
      amount: parsedAmount,
      category: entryCategory,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      capital: {
        ...prev.capital,
        entries: [newEntry, ...prev.capital.entries]
      }
    }));

    setEntryLabel('');
    setEntryAmount('');
  };

  const deleteFinancialEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      capital: {
        ...prev.capital,
        entries: prev.capital.entries.filter(e => e.id !== id)
      }
    }));
  };

  const addCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(parsedTarget) || parsedTarget <= 0) return;

    const newGoal: UserCustomGoal = {
      id: crypto.randomUUID(),
      title: goalTitle.trim(),
      targetMetric: parsedTarget,
      currentProgress: 0,
      unit: goalUnit.trim() || 'units',
      completed: false
    };

    setState(prev => ({
      ...prev,
      customGoals: [...prev.customGoals, newGoal]
    }));

    setGoalTitle('');
    setGoalTarget('');
    setGoalUnit('');
  };

  const updateGoalProgress = (id: string, delta: number) => {
    setState(prev => ({
      ...prev,
      customGoals: prev.customGoals.map(g => {
        if (g.id !== id) return g;
        const newProgress = Math.max(0, g.currentProgress + delta);
        return {
          ...g,
          currentProgress: newProgress,
          completed: newProgress >= g.targetMetric
        };
      })
    }));
  };

  const deleteCustomGoal = (id: string) => {
    setState(prev => ({
      ...prev,
      customGoals: prev.customGoals.filter(g => g.id !== id)
    }));
  };

  const ramaContextPayload = useMemo(() => {
    return JSON.stringify({
      architect: session?.moniker || 'Architect',
      systemStatus: isFocusing ? 'FOCUS LOCKDOWN ACTIVE' : 'SYSTEM OPERATIONAL',
      financials: {
        currency: state.capital.currencySymbol,
        budget: state.capital.totalBudget,
        remaining: financialTotals.remaining
      },
      goalsCount: state.customGoals.length,
      network: isOnline ? 'CONNECTED' : 'LOCAL OFFLINE'
    });
  }, [session?.moniker, isFocusing, state.capital, financialTotals, state.customGoals, isOnline]);

  const NavItem = ({ view, icon: Icon, label }: { view: typeof currentView; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border group relative ${
        currentView === view
          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 border-transparent'
      }`}
    >
      {currentView === view && <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-full" />}
      <Icon size={18} className={currentView === view ? 'text-emerald-400' : 'group-hover:text-emerald-400/70 transition-colors'} />
      <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
      <aside className="w-72 border-r border-gray-800/50 hidden md:flex flex-col bg-gray-950/80 backdrop-blur-3xl sticky top-0 h-screen z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 group cursor-default">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-gray-950 shadow-lg shadow-emerald-900/20 group-hover:rotate-6 transition-transform">
              SD
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase">Architecture</h1>
              <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Discipline OS v4.2</p>
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem view="dashboard" icon={LayoutGrid} label="Core Hub" />
            <NavItem view="wallet" icon={Wallet} label="Capital Tracker" />
            <NavItem view="goals" icon={Target} label="Custom Goals" />
            <NavItem view="tasks" icon={CheckSquare} label="Operations" />
            <NavItem view="calendar" icon={CalendarDays} label="Timeline" />
            <NavItem view="settings" icon={Settings} label="Protocols" />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Architect Identity</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                <User size={14} className="text-gray-500" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-black text-gray-200 truncate">{session?.moniker || 'Architect'}</p>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">{session?.email || 'Offline Session'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={toggleFocusLockdown}
            className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 border uppercase tracking-widest text-[10px] ${
              isFocusing
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400/20 shadow-red-950/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-gray-950 border-emerald-400/20 shadow-emerald-900/40'
            }`}
          >
            <Shield size={16} /> {isFocusing ? 'Release Lockdown' : 'Initiate Focus Tone'}
          </button>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-black uppercase tracking-widest text-[8px]"
          >
            <LogOut size={14} /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-gray-950 to-gray-950">
        <header className="sticky top-0 z-30 bg-gray-950/50 backdrop-blur-xl border-b border-gray-800/50 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-white tracking-[0.3em] uppercase">
              {currentView === 'dashboard' ? 'Neural Core Command' : currentView}
            </h2>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2 text-gray-500">
              {isOnline ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-amber-500" />}
              <span className="text-[8px] font-black uppercase tracking-widest">
                {isOnline ? 'Network Active' : 'Local Storage Isolation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-900 rounded-full border border-gray-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter shadow-xl shadow-black/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isFocusing ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              <span className={isFocusing ? 'text-red-400' : 'text-emerald-400'}>
                {isFocusing ? '432Hz Lockdown Active' : 'System Ready'}
              </span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {(currentView === 'dashboard' || currentView === 'wallet') && (
            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <DollarSign className="text-emerald-400" size={20} /> Dynamic Capital Engine
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Configure budget limits, symbols, and ledger entries</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
                    <span className="text-[10px] font-black uppercase text-gray-500">Currency:</span>
                    <input
                      type="text"
                      value={state.capital.currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="bg-transparent w-16 text-xs font-black text-emerald-400 focus:outline-none uppercase border-b border-emerald-500/30"
                      placeholder="Symbol"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
                    <span className="text-[10px] font-black uppercase text-gray-500">Target Budget:</span>
                    <input
                      type="number"
                      value={state.capital.totalBudget || ''}
                      onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                      className="bg-transparent w-28 text-xs font-black text-emerald-400 focus:outline-none border-b border-emerald-500/30"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Financial Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Configured Budget</span>
                  <p className="text-xl font-black text-white mt-1">
                    {state.capital.currencySymbol} {state.capital.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Total Expenses</span>
                  <p className="text-xl font-black text-red-400 mt-1">
                    {state.capital.currencySymbol} {financialTotals.spent.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Inflow / Income</span>
                  <p className="text-xl font-black text-emerald-400 mt-1">
                    {state.capital.currencySymbol} {financialTotals.income.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Calculated Balance</span>
                  <p className={`text-xl font-black mt-1 ${financialTotals.remaining >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                    {state.capital.currencySymbol} {financialTotals.remaining.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Form to add transaction dynamically */}
              <form onSubmit={addFinancialEntry} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4">
                <input
                  type="text"
                  placeholder="Entry Label (e.g., Equipment, Food, Client Deposit)"
                  value={entryLabel}
                  onChange={(e) => setEntryLabel(e.target.value)}
                  className="sm:col-span-5 p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="sm:col-span-3 p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value as any)}
                  className="sm:col-span-2 p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-300 focus:border-emerald-500/50 outline-none uppercase font-bold"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                </select>
                <button
                  type="submit"
                  className="sm:col-span-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                >
                  <Plus size={14} /> Add Entry
                </button>
              </form>

              {/* Dynamic Ledger List */}
              <div className="space-y-2 pt-4">
                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Ledger Logs</h4>
                {state.capital.entries.length === 0 ? (
                  <p className="text-xs text-gray-600 italic py-4">No financial entries logged yet.</p>
                ) : (
                  state.capital.entries.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-950 rounded-xl border border-gray-800/80 hover:border-gray-700 transition-all">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          item.category === 'expense' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          item.category === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-gray-200">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-white">
                          {state.capital.currencySymbol} {item.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => deleteFinancialEntry(item.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(currentView === 'dashboard' || currentView === 'goals') && (
            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Target className="text-emerald-400" size={20} /> User Defined Goals
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Import or create personal targets with custom metrics</p>
              </div>

              {/* Add Custom Goal Form */}
              <form onSubmit={addCustomGoal} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="Goal Description (e.g. Daily Reading, Miles Run, Code Commits)"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="sm:col-span-5 p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
                <input
                  type="number"
                  placeholder="Target Quantity"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="sm:col-span-3 p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. pages, km, hours)"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  className="sm:col-span-2 p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:border-emerald-500/50 outline-none"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                >
                  <Plus size={14} /> Add Goal
                </button>
              </form>

              {/* Goal Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {state.customGoals.length === 0 ? (
                  <p className="text-xs text-gray-600 italic py-4 col-span-2">No custom goals imported yet.</p>
                ) : (
                  state.customGoals.map((goal) => {
                    const progressPercent = Math.min(100, Math.round((goal.currentProgress / goal.targetMetric) * 100));
                    return (
                      <div key={goal.id} className="p-4 bg-gray-950 rounded-2xl border border-gray-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-white">{goal.title}</h4>
                            <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                              {goal.currentProgress} / {goal.targetMetric} {goal.unit} ({progressPercent}%)
                            </p>
                          </div>
                          <button
                            onClick={() => deleteCustomGoal(goal.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Increment Buttons */}
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => updateGoalProgress(goal.id, -1)}
                            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg text-xs font-black"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => updateGoalProgress(goal.id, 1)}
                            className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentView === 'tasks' && (
            <div className="max-w-4xl mx-auto">
              <TaskWidget accessToken={accessToken} />
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="max-w-4xl mx-auto">
              <CalendarWidget accessToken={accessToken} />
            </div>
          )}

          {currentView === 'settings' && (
            <div className="max-w-4xl mx-auto bg-gray-900 p-8 rounded-3xl border border-gray-800 space-y-6">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Settings size={24} className="text-emerald-400" /> Audio Protocols
              </h3>
              <div className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800">
                <div>
                  <p className="text-sm font-bold text-gray-200">Focus Tone (432Hz Audio Matrix)</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Play harmonized focus frequencies during lockdown</p>
                </div>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-3 rounded-xl border transition-colors ${
                    audioEnabled ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-600'
                  }`}
                >
                  {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
