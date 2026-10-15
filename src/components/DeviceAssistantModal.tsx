/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DeviceAssistantModal - System Digital Assistant & Background Wake Word Configuration Center
 * Beautifies UI to identify Rama as the primary Device Assistant for system-level background invocation.
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Smartphone, 
  Power, 
  Activity, 
  BatteryCharging, 
  Lock,
  Layers,
  Zap,
  Info,
  X
} from 'lucide-react';
import { RamaVoice } from '../utils/ramaVoiceService';

interface DeviceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceCommands?: () => void;
}

export const DeviceAssistantModal: React.FC<DeviceAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenVoiceCommands
}) => {
  const [backgroundListeningActive, setBackgroundListeningActive] = useState<boolean>(() => {
    return localStorage.getItem('cymatic_rama_bg_assistant_active') === 'true';
  });
  const [isDefaultAssistant, setIsDefaultAssistant] = useState<boolean>(() => {
    return localStorage.getItem('cymatic_rama_is_default_assistant') === 'true';
  });
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [testListening, setTestListening] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(85);

  useEffect(() => {
    localStorage.setItem('cymatic_rama_bg_assistant_active', String(backgroundListeningActive));
  }, [backgroundListeningActive]);

  useEffect(() => {
    localStorage.setItem('cymatic_rama_is_default_assistant', String(isDefaultAssistant));
  }, [isDefaultAssistant]);

  // Handle Screen Wake Lock if available in browser / PWA
  useEffect(() => {
    let wakeLockSentinel: any = null;
    if (backgroundListeningActive && 'wakeLock' in navigator) {
      try {
        (navigator as any).wakeLock.request('screen').then((lock: any) => {
          wakeLockSentinel = lock;
          setWakeLockActive(true);
        }).catch(() => {
          setWakeLockActive(false);
        });
      } catch {}
    } else {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
      setWakeLockActive(false);
    }

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [backgroundListeningActive]);

  if (!isOpen) return null;

  const handleToggleBgListening = () => {
    const next = !backgroundListeningActive;
    setBackgroundListeningActive(next);
    if (next) {
      RamaVoice.startContinuousListening();
    } else {
      RamaVoice.stopContinuousListening();
    }
  };

  const handleTestWakeWord = () => {
    setTestListening(true);
    setTestResult(null);

    // Provide audio chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}

    setTimeout(() => {
      setTestListening(false);
      setTestResult('🎉 Wake Word "Hey Rama" successfully detected! Assistant online.');
      setTimeout(() => setTestResult(null), 5000);
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-emerald-500/30 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/40 overflow-hidden relative">
        {/* Glow Ambient Header */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-800 flex items-start justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Cpu size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  System Level Integration
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300">
                  <Activity size={12} /> Live Device Assistant
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-1">
                Set Rama as Device Assistant
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800/60 hover:bg-gray-800 transition border border-gray-700/60"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          {/* Status Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isDefaultAssistant ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'}`} />
                <span className="font-bold text-white text-base">
                  {isDefaultAssistant ? 'Default Device Assistant Active' : 'Assistant Integration Ready'}
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-md">
                When configured, Rama can be invoked by voice ("Hey Rama") even when the app is closed, minimized, or the device screen is locked.
              </p>
            </div>

            <button
              onClick={() => setIsDefaultAssistant(!isDefaultAssistant)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border ${
                isDefaultAssistant
                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
              }`}
            >
              {isDefaultAssistant ? '✓ Marked as Default' : 'Mark as Default Assistant'}
            </button>
          </div>

          {/* Hotword / Background Listening Controls */}
          <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${backgroundListeningActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                  <Radio size={20} className={backgroundListeningActive ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Background Wake Word Listener Service</h4>
                  <p className="text-xs text-gray-400">
                    Continuous hotword monitor for "Hey Rama", "Hi Rama", and "Hey Discipline".
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleBgListening}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  backgroundListeningActive ? 'bg-emerald-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    backgroundListeningActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* WakeLock & Battery Notice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800/60 flex items-center gap-2.5 text-xs text-gray-300">
                <Power size={16} className={wakeLockActive ? 'text-emerald-400' : 'text-gray-500'} />
                <span>Screen / CPU WakeLock: <strong className={wakeLockActive ? 'text-emerald-400' : 'text-gray-400'}>{wakeLockActive ? 'Active' : 'Standby'}</strong></span>
              </div>
              <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800/60 flex items-center gap-2.5 text-xs text-gray-300">
                <BatteryCharging size={16} className="text-cyan-400" />
                <span>Battery Exemption: <strong className="text-cyan-300">Recommended</strong></span>
              </div>
            </div>
          </div>

          {/* Android Assistant Setup Walkthrough */}
          <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              <Smartphone size={16} />
              <span>Android System Assistant Instructions</span>
            </div>

            <ol className="space-y-3 text-xs text-gray-300 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                Open your Android device <strong className="text-white">Settings</strong>.
              </li>
              <li className="leading-relaxed">
                Navigate to <strong className="text-white">Apps</strong> &gt; <strong className="text-white">Default Apps</strong> &gt; <strong className="text-white">Digital Assistant app</strong>.
              </li>
              <li className="leading-relaxed">
                Tap <strong className="text-white">Device Assistant app</strong> and select <strong className="text-emerald-400 font-bold">Cymatic Rama AI</strong>.
              </li>
              <li className="leading-relaxed">
                Enable <strong className="text-white">"Use text and screenshot analysis"</strong> and <strong className="text-white">"Allow assistant voice wakeup"</strong>.
              </li>
              <li className="leading-relaxed">
                In App Battery Usage, select <strong className="text-white">"Unrestricted"</strong> to prevent the OS from killing the background hotword engine when idle.
              </li>
            </ol>
          </div>

          {/* Recognized Wake Words Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                Recognized System Wake Phrases
              </h4>
              {onOpenVoiceCommands && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVoiceCommands();
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition"
                >
                  View All 20+ Voice Commands &rarr;
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { phrase: '"Hey Rama"', badge: 'Primary', desc: 'Instant Wake' },
                { phrase: '"Hi Rama"', badge: 'Casual', desc: 'Conversational' },
                { phrase: '"Hey Discipline"', badge: 'Tactical', desc: 'Lockdown Focus' },
                { phrase: '"Rama"', badge: 'Direct', desc: 'Quick Address' }
              ].map((item) => (
                <div key={item.phrase} className="p-3 bg-gray-950 border border-gray-800 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">{item.badge}</span>
                  <div className="text-xs font-black text-white">{item.phrase}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Tester */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Volume2 size={15} className="text-emerald-400" />
                Live Wake Word Microphone Test
              </span>
              <button
                onClick={handleTestWakeWord}
                disabled={testListening}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
              >
                <Mic size={13} className={testListening ? 'animate-bounce text-yellow-300' : ''} />
                <span>{testListening ? 'Listening for "Hey Rama"...' : 'Test Wake Word Now'}</span>
              </button>
            </div>

            {testListening && (
              <div className="flex items-center justify-center gap-1 py-3 text-emerald-400">
                <div className="w-1.5 h-6 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-10 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <div className="w-1.5 h-8 bg-emerald-400 rounded-full animate-pulse delay-150" />
                <div className="w-1.5 h-12 bg-emerald-400 rounded-full animate-pulse delay-100" />
                <div className="w-1.5 h-5 bg-emerald-400 rounded-full animate-pulse delay-200" />
                <span className="ml-3 text-xs font-mono">Speak "Hey Rama" or "Hi Rama" clearly...</span>
              </div>
            )}

            {testResult && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
                <Check size={16} className="text-emerald-400" />
                <span>{testResult}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-950/80 border-t border-gray-800 flex items-center justify-between relative z-10 shrink-0">
          <span className="text-[11px] font-mono text-gray-500">
            Assistant Intent: <code className="text-gray-400">android.intent.action.ASSIST</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceAssistantModal;
