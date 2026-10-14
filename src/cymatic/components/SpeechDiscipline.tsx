/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Speech & Verbal Discipline Module (Islamic & Christian Wisdom Anchors)
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, ShieldAlert, Sparkles, BookOpen, Check } from 'lucide-react';

interface SpeechState {
  noSwearing: boolean;
  noBackbiting: boolean;
  truthfulness: boolean;
  controlledAnger: boolean;
  dailyReflections: string[];
}

const SPEECH_STORAGE_KEY = 'sdc_speech_discipline_v1';

const SCRIPTURES = {
  islamic: [
    { text: "Not a word does he utter but there is a watcher by him, ready to record it.", ref: "Surah Qaf (50:18)" },
    { text: "Whoever believes in Allah and the Last Day should say something good or keep silent.", ref: "Prophetic Hadith (Bukhari)" }
  ],
  christian: [
    { text: "Let everyone be quick to listen, slow to speak, slow to anger.", ref: "James 1:19" },
    { text: "Set a guard, O Lord, over my mouth; keep watch over the door of my lips.", ref: "Psalm 141:3" }
  ]
};

export default function SpeechDiscipline() {
  const [tradition, setTradition] = useState<'islamic' | 'christian' | 'both'>('both');
  const [speechState, setSpeechState] = useState<SpeechState>(() => {
    try {
      const saved = localStorage.getItem(SPEECH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        noSwearing: true,
        noBackbiting: true,
        truthfulness: true,
        controlledAnger: true,
        dailyReflections: []
      };
    } catch {
      return {
        noSwearing: true,
        noBackbiting: true,
        truthfulness: true,
        controlledAnger: true,
        dailyReflections: []
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SPEECH_STORAGE_KEY, JSON.stringify(speechState));
    } catch (e) {
      console.error('Speech Storage Error:', e);
    }
  }, [speechState]);

  const toggleCheck = (key: keyof Omit<SpeechState, 'dailyReflections'>) => {
    setSpeechState((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-xl space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-widest">Speech & Verbal Discipline</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Guard of the Tongue & Execution Clarity</p>
          </div>
        </div>

        {/* Tradition Selector */}
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setTradition('islamic')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
              tradition === 'islamic' ? 'bg-emerald-600 text-gray-950' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Islamic
          </button>
          <button
            onClick={() => setTradition('christian')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
              tradition === 'christian' ? 'bg-emerald-600 text-gray-950' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Christian
          </button>
          <button
            onClick={() => setTradition('both')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
              tradition === 'both' ? 'bg-emerald-600 text-gray-950' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      {/* Wisdom & Scripture Anchors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(tradition === 'islamic' || tradition === 'both') && (
          <div className="p-4 bg-gray-950 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <BookOpen size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Islamic Anchor</span>
            </div>
            <p className="text-xs text-gray-300 italic">"{SCRIPTURES.islamic[0].text}"</p>
            <p className="text-[9px] text-emerald-500 font-bold mt-2 uppercase tracking-tighter">— {SCRIPTURES.islamic[0].ref}</p>
          </div>
        )}

        {(tradition === 'christian' || tradition === 'both') && (
          <div className="p-4 bg-gray-950 rounded-2xl border border-blue-500/20 relative overflow-hidden">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <BookOpen size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Christian Anchor</span>
            </div>
            <p className="text-xs text-gray-300 italic">"{SCRIPTURES.christian[0].text}"</p>
            <p className="text-[9px] text-blue-400 font-bold mt-2 uppercase tracking-tighter">— {SCRIPTURES.christian[0].ref}</p>
          </div>
        )}
      </div>

      {/* Speech Guard Daily Protocol */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Daily Speech Guard Checklist</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'noSwearing', label: 'Zero Vulgarity / Swearing' },
            { key: 'noBackbiting', label: 'Zero Backbiting or Gossip' },
            { key: 'truthfulness', label: 'Absolute Truthfulness' },
            { key: 'controlledAnger', label: 'Controlled Tone & Composure' }
          ].map((item) => {
            const isActive = speechState[item.key as keyof Omit<SpeechState, 'dailyReflections'>];
            return (
              <button
                key={item.key}
                onClick={() => toggleCheck(item.key as any)}
                className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-gray-950 border-gray-800/80 text-gray-500 hover:border-gray-700'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all ${
                  isActive ? 'bg-emerald-500 border-emerald-400 text-gray-950' : 'border-gray-700 bg-gray-900'
                }`}>
                  {isActive && <Check size={14} className="stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
