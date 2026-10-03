import { ShieldAlert, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function LockdownOverlay({ goals, onTerminate }: { goals: string[], onTerminate: () => void }) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed top-6 right-6 z-[110] animate-in slide-in-from-right duration-500">
        <button 
          onClick={() => setIsMinimized(false)}
          className="bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:bg-emerald-500 transition-all group"
        >
          <div className="bg-white/20 p-2 rounded-lg">
            <ShieldAlert size={20} className="text-white animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Lockdown Active</p>
            <p className="text-xs text-white font-bold">Focusing on {goals.length} Goals</p>
          </div>
          <ChevronUp size={20} className="text-emerald-200 group-hover:translate-y-[-2px] transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="max-w-md w-full relative">
        {/* Minimize Button */}
        <button 
          onClick={() => setIsMinimized(true)}
          className="absolute -top-12 right-0 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800"
        >
          <ChevronDown size={16} /> Minimize to Sidebar
        </button>

        <div className="p-8 rounded-3xl border border-emerald-500/20 bg-gray-900/50 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
          <ShieldAlert className="mx-auto text-emerald-400 mb-6 animate-bounce" size={64} />
          <h2 className="text-4xl font-black text-emerald-400 mb-2 uppercase tracking-widest leading-none">System Lockdown</h2>
          <p className="text-gray-400 mb-8 font-medium">Distractions suppressed. High-priority focus:</p>
          
          <div className="space-y-3 mb-10">
            {goals.length > 0 ? goals.map((g, i) => (
              <div key={i} className="text-xl font-bold text-white py-4 px-6 bg-gray-950/80 rounded-2xl border border-gray-800 shadow-inner">
                {g}
              </div>
            )) : (
              <div className="text-xl font-bold text-white py-4 px-6 bg-gray-950/80 rounded-2xl border border-gray-800">
                Architectural Discipline
              </div>
            )}
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mb-8">
            <p className="text-[10px] text-red-500 font-black uppercase mb-1 tracking-widest">Warning: Protocol 74</p>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Communication links and leisure applications are currently under algorithmic suppression.
            </p>
          </div>

          <button 
            onClick={onTerminate}
            className="w-full py-4 rounded-2xl font-black bg-gray-800 text-gray-500 hover:bg-red-600 hover:text-white transition-all duration-300 border border-gray-700 shadow-xl uppercase tracking-widest text-sm"
          >
            Terminate Protocol
          </button>
        </div>
      </div>
    </div>
  );
}
