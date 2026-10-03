import { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera, Layers, ChevronRight, ChevronLeft } from 'lucide-react';

export default function RoomMakeover({ progress }: { progress?: number }) {
  const sliderValue = progress || 0;
  const [isUpdating, setIsUpdating] = useState(false);

  const setSliderValue = async (val: number) => {
    if (!auth.currentUser) return;
    const boundedVal = Math.max(0, Math.min(100, val));
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      roomProgress: boundedVal
    });
  };

  const adjustProgress = (amount: number) => {
    setSliderValue(sliderValue + amount);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <Camera size={20} /> Space Evolution
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsUpdating(!isUpdating)}
            className="text-[10px] font-black text-gray-500 hover:text-emerald-400 uppercase tracking-tighter transition-colors"
          >
            {isUpdating ? 'Close' : 'Update'}
          </button>
          <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-tighter border border-emerald-500/20">
            {sliderValue}% Evolution
          </div>
        </div>
      </div>
      
      <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-gray-700 group shadow-inner bg-gray-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585241936939-be4099591252?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center grayscale opacity-20">
          <div className="absolute inset-0 bg-gray-950/80 flex items-center justify-center text-gray-500 font-black uppercase tracking-widest text-[10px] italic">
            Initial Chaos Protocol
          </div>
        </div>
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center transition-all duration-700 ease-out flex items-center justify-center border-r-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
          style={{ width: `${sliderValue}%` }}
        >
          <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[2px]" />
          <div className="relative z-10 text-emerald-100 font-black uppercase tracking-widest text-[10px] whitespace-nowrap overflow-hidden">
            Disciplined Architecture
          </div>
        </div>

        {isUpdating && (
          <div className="absolute inset-x-4 bottom-4 z-30 flex items-center gap-4 bg-gray-900/90 backdrop-blur-md p-3 rounded-xl border border-gray-700 animate-in slide-in-from-bottom-2">
            <button onClick={() => adjustProgress(-5)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="flex-1 accent-emerald-500 bg-gray-800 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
            <button onClick={() => adjustProgress(5)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        
        {!isUpdating && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-10 transition-all duration-700"
            style={{ left: `${sliderValue}%` }}
          />
        )}
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button 
          onClick={() => setSliderValue(Math.min(100, sliderValue + 10))}
          className="flex items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-400 rounded-xl transition-all border border-gray-700 group"
        >
          <Layers size={14} className="group-hover:translate-y-[-2px] transition-transform" />
          <span className="font-black uppercase tracking-tighter text-[10px]">Evolve Space +10%</span>
        </button>
        <button 
          onClick={() => setSliderValue(0)}
          className="flex items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-red-900/20 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-gray-700 group"
        >
          <Camera size={14} className="group-hover:rotate-12 transition-transform" />
          <span className="font-black uppercase tracking-tighter text-[10px]">Reset Scan</span>
        </button>
      </div>
    </div>
  );
}
