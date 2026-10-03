import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import RoomMakeover from './RoomMakeover';
import WalletDiscipline from './WalletDiscipline';
import RamaFloatingHub from './RamaFloatingHub';
import GoalSetting from './GoalSetting';
import LockdownOverlay from './LockdownOverlay';
import TaskWidget from './TaskWidget';
import CalendarWidget from './CalendarWidget';
import { LayoutGrid, Wallet, CalendarDays, CheckSquare, LogOut, Shield, Activity, Settings, User } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function Dashboard({ accessToken }: { accessToken: string | null }) {
  const [userData, setUserData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'wallet' | 'tasks' | 'calendar' | 'settings'>('dashboard');
  const [isFocusing, setIsFocusing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });
    return unsub;
  }, []);

  // Simulate periodic sync
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1500);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const ramaContext = JSON.stringify({
    goals: userData?.goals || [],
    rules: userData?.rules || {},
    wallet: userData?.wallet || { budget: 5000, spent: 3200 },
    roomProgress: userData?.roomProgress || 0,
    systemStatus: isFocusing ? 'LOCKDOWN ACTIVE' : 'MONITORING'
  });

  const NavItem = ({ view, icon: Icon, label }: { view: typeof currentView, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border group relative ${
        currentView === view 
          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 border-transparent'
      }`}
    >
      {currentView === view && (
        <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-full" />
      )}
      <Icon size={18} className={currentView === view ? 'text-emerald-400' : 'group-hover:text-emerald-400/70 transition-colors'} /> 
      <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-gray-800/50 hidden md:flex flex-col bg-gray-950/80 backdrop-blur-3xl sticky top-0 h-screen z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 group cursor-default">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-gray-950 shadow-lg shadow-emerald-900/20 group-hover:rotate-6 transition-transform">
              SD
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase">Architecture</h1>
              <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Discipline OS v4.1</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <NavItem view="dashboard" icon={LayoutGrid} label="Core Hub" />
            <NavItem view="wallet" icon={Wallet} label="Capital" />
            <NavItem view="tasks" icon={CheckSquare} label="Operations" />
            <NavItem view="calendar" icon={CalendarDays} label="Timeline" />
            <NavItem view="settings" icon={Settings} label="Protocols" />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">User Profile</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                <User size={14} className="text-gray-500" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-black text-gray-200 truncate">{auth.currentUser?.email?.split('@')[0]}</p>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Status: Active</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsFocusing(true)}
            className="w-full py-4 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-500 text-gray-950 transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 border border-emerald-400/20 uppercase tracking-widest text-[10px]"
          >
            <Shield size={16} /> Initiate Lockdown
          </button>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-black uppercase tracking-widest text-[8px]"
          >
            <LogOut size={14} /> Termination Sequence
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-gray-950 to-gray-950">
        <header className="sticky top-0 z-30 bg-gray-950/50 backdrop-blur-xl border-b border-gray-800/50 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-white tracking-[0.3em] uppercase">
              {currentView === 'dashboard' ? 'Neural Core' : currentView}
            </h2>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2 text-gray-500">
              <Activity size={12} className={isSyncing ? 'text-emerald-500 animate-spin' : ''} />
              <span className="text-[8px] font-black uppercase tracking-widest">
                {isSyncing ? 'Syncing...' : 'Data Stream Verified'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-gray-900/40 rounded-full border border-gray-800/50">
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-gray-500 font-black uppercase tracking-tighter">Goals</span>
                <span className="text-xs font-black text-emerald-400 leading-none">{userData?.goals?.length || 0}</span>
              </div>
              <div className="w-px h-4 bg-gray-800" />
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-gray-500 font-black uppercase tracking-tighter">Health</span>
                <span className="text-xs font-black text-emerald-400 leading-none">{userData?.roomProgress || 0}%</span>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-gray-900 rounded-full border border-gray-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter shadow-xl shadow-black/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isFocusing ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className={isFocusing ? 'text-red-400' : 'text-emerald-400'}>
                {isFocusing ? 'Lockdown active' : 'Monitor Active'}
              </span>
            </div>
          </div>
        </header>
        
        <div className="p-8 max-w-[1600px] mx-auto">
          {currentView === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 space-y-8">
                <GoalSetting />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TaskWidget accessToken={accessToken} />
                  <CalendarWidget accessToken={accessToken} />
                </div>
              </div>
              <div className="xl:col-span-4 space-y-8">
                <WalletDiscipline data={userData?.wallet} />
                <RoomMakeover progress={userData?.roomProgress} />
              </div>
            </div>
          )}

          {currentView === 'wallet' && (
            <div className="max-w-4xl mx-auto">
              <WalletDiscipline data={userData?.wallet} />
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
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800">
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                  <Settings size={24} className="text-emerald-400" /> Protocol Configuration
                </h3>
                <div className="space-y-8">
                  {/* System Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 bg-gray-950 rounded-2xl border border-gray-800">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Wallet Allocation</label>
                        <input 
                          type="number"
                          value={userData?.wallet?.budget || 0}
                          onChange={async (e) => {
                            if (!auth.currentUser) return;
                            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                              'wallet.budget': Number(e.target.value)
                            });
                          }}
                          className="bg-transparent border-b border-gray-800 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-500 text-right w-20"
                        />
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100000"
                        step="100"
                        value={userData?.wallet?.budget || 0}
                        onChange={async (e) => {
                          if (!auth.currentUser) return;
                          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                            'wallet.budget': Number(e.target.value)
                          });
                        }}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[8px] text-gray-600 font-bold uppercase">Define total discretionary capital for the current cycle.</p>
                    </div>

                    <div className="space-y-4 p-6 bg-gray-950 rounded-2xl border border-gray-800">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Expenditures</label>
                        <input 
                          type="number"
                          value={userData?.wallet?.spent || 0}
                          onChange={async (e) => {
                            if (!auth.currentUser) return;
                            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                              'wallet.spent': Number(e.target.value)
                            });
                          }}
                          className="bg-transparent border-b border-gray-800 text-xs font-black text-red-400 focus:outline-none focus:border-red-500 text-right w-20"
                        />
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={userData?.wallet?.budget || 100000}
                        step="10"
                        value={userData?.wallet?.spent || 0}
                        onChange={async (e) => {
                          if (!auth.currentUser) return;
                          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                            'wallet.spent': Number(e.target.value)
                          });
                        }}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                      <p className="text-[8px] text-gray-600 font-bold uppercase">Calibrate current spending records against your allocation.</p>
                    </div>

                    <div className="space-y-4 p-6 bg-gray-950 rounded-2xl border border-gray-800 md:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Space Evolution</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={userData?.roomProgress || 0}
                          onChange={async (e) => {
                            if (!auth.currentUser) return;
                            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                              roomProgress: Number(e.target.value)
                            });
                          }}
                          className="bg-transparent border-b border-gray-800 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-500 text-right w-12"
                        />
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={userData?.roomProgress || 0}
                        onChange={async (e) => {
                          if (!auth.currentUser) return;
                          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                            roomProgress: Number(e.target.value)
                          });
                        }}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[8px] text-gray-600 font-bold uppercase">Calibrate the structural integrity of your physical environment.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all group">
                    <div>
                      <p className="text-sm font-bold text-gray-200">Neural Feedback (Audio)</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Enable audio cues during lockdown sessions</p>
                    </div>
                    <div className="w-12 h-6 bg-emerald-600 rounded-full relative p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all group">
                    <div>
                      <p className="text-sm font-bold text-gray-200">Strict Sync Protocol</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Force real-time cloud validation for all operations</p>
                    </div>
                    <div className="w-12 h-6 bg-gray-800 rounded-full relative p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-gray-600 rounded-full absolute left-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Overlays & AI Interface */}
      {isFocusing && (
        <LockdownOverlay 
          goals={userData?.goals?.map((g: any) => g.text) || []} 
          onTerminate={() => setIsFocusing(false)} 
        />
      )}

      <RamaFloatingHub context={ramaContext} />
    </div>
  );
}
