/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Available Voice Commands Modal & Slide-Over for Rama AI
 * Comprehensive directory of recognized wake words, system actions, ambient soundscapes,
 * and conversational triggers to improve discoverability.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Search,
  X,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Music,
  Camera,
  Compass,
  Lock,
  Waves,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Volume2,
  Check,
  Maximize2,
  PanelRightClose,
  PanelRight,
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import { RamaVoice } from '../utils/ramaVoiceService';

export interface VoiceCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (commandText: string) => void;
  initialMode?: 'slideover' | 'modal';
}

interface CommandItem {
  trigger: string;
  command: string;
  description: string;
  category: 'ambient' | 'media' | 'lockdown' | 'calling' | 'messaging' | 'vision' | 'navigation' | 'inquiries';
  badge?: string;
}

const WAKE_WORDS = [
  { word: 'Hey Rama', note: 'Primary high-accuracy wake phrase' },
  { word: 'Hi Rama', note: 'Casual conversational trigger' },
  { word: 'Hey Discipline', note: 'Tactical system trigger' },
  { word: 'Rama', note: 'Direct single-word address' }
];

const COMMANDS_DATABASE: CommandItem[] = [
  // 1. Ambient Soundscapes & Deep Work
  {
    trigger: 'Play white noise',
    command: 'Play crisp white noise',
    description: 'Generates flat-spectrum acoustic shielding to mask office chatter and distractions.',
    category: 'ambient',
    badge: 'Offline Synth'
  },
  {
    trigger: 'Play binaural beats',
    command: 'Play 10 Hz alpha binaural beats',
    description: 'Synthesizes stereophonic 10 Hz alpha brainwaves to induce flow state and sustained focus.',
    category: 'ambient',
    badge: 'Stereo Flow'
  },
  {
    trigger: 'Play zen temple sounds',
    command: 'Play Tibetan singing bowls and temple bells',
    description: 'Launches authentic 432 Hz bronze singing bowls, harmonic drones, and periodic bell chimes.',
    category: 'ambient',
    badge: 'Meditation'
  },
  {
    trigger: 'Start deep work soundscape for 25 minutes',
    command: 'Play brown noise for 25 minutes',
    description: 'Engages restorative low-rumble brown noise with an automatic 25-minute Pomodoro timer.',
    category: 'ambient',
    badge: 'Pomodoro'
  },

  // 2. Music Streaming & Universal Media
  {
    trigger: 'Play Bohemian Rhapsody on Spotify',
    command: 'Play Bohemian Rhapsody via Spotify',
    description: 'Streams the track directly inside the in-app player without switching to external apps.',
    category: 'media'
  },
  {
    trigger: 'Play local audio file',
    command: 'Play local audio file',
    description: 'Indexes and streams MP3/WAV files stored locally on your device storage.',
    category: 'media'
  },
  {
    trigger: 'Play adhan',
    command: 'Play Adhan call to prayer',
    description: 'Streams the spiritual Adhan call to prayer audio asset.',
    category: 'media'
  },
  {
    trigger: 'Pause media',
    command: 'Pause in-app audio stream',
    description: 'Halts currently active ambient or streaming media playback.',
    category: 'media'
  },

  // 3. Discipline & System Lockdown
  {
    trigger: 'Engage lockdown for 45 minutes',
    command: 'Engage lockdown for 45 minutes',
    description: 'Quarantines distracting apps and imposes uninterrupted deep focus intervals.',
    category: 'lockdown',
    badge: 'Discipline'
  },
  {
    trigger: 'Break lockdown',
    command: 'Break lockdown',
    description: 'Initiates emergency release protocol to exit current lockdown session.',
    category: 'lockdown'
  },
  {
    trigger: 'Locate Qibla',
    command: 'Locate Qibla',
    description: 'Calculates exact geodesic bearing and azimuth to the Kaaba using device GPS.',
    category: 'lockdown',
    badge: 'Geodesic GPS'
  },
  {
    trigger: 'Add task Review Quarterly Architecture',
    command: 'Add task [task title]',
    description: 'Logs high-priority execution item directly into the Cymatic task vault.',
    category: 'lockdown'
  },
  {
    trigger: 'Sync Google Calendar',
    command: 'Sync Google Calendar',
    description: 'Pulls the latest scheduling data from your connected Google Calendar.',
    category: 'lockdown'
  },

  // 4. Telephony & Carrier Calls
  {
    trigger: 'Call Mom',
    command: 'Call [Contact Name or Number]',
    description: 'Initiates device cellular call with SIM 1 / SIM 2 or native dialer selection.',
    category: 'calling'
  },
  {
    trigger: 'Dial 0700123456',
    command: 'Dial [Phone Number]',
    description: 'Launches native phone dialer pre-populated with the recipient number.',
    category: 'calling'
  },

  // 5. Messaging & Executive Dispatch
  {
    trigger: 'Write a message to John',
    command: 'Write a message to [Recipient]',
    description: 'Opens interactive Message & Email Designer pre-drafted with a tailored greeting.',
    category: 'messaging'
  },
  {
    trigger: 'Send email to boss@company.com: Project sprint complete',
    command: 'Send email to [Address]: [Content]',
    description: 'Pre-drafts executive tactical email with subject and formatted body.',
    category: 'messaging'
  },

  // 6. Vision & Optical HUD
  {
    trigger: 'Open camera preview',
    command: 'Start vision / Open camera preview',
    description: 'Activates live optical posture, alignment, and physical environment scanner.',
    category: 'vision'
  },
  {
    trigger: 'Screen recording preview',
    command: 'Open screen preview',
    description: 'Captures and analyzes active screen view for visual context understanding.',
    category: 'vision'
  },

  // 7. Core Views Navigation
  {
    trigger: 'Open tasks',
    command: 'Go to tasks',
    description: 'Navigates directly to the Task Operations center.',
    category: 'navigation'
  },
  {
    trigger: 'Open calendar',
    command: 'Go to calendar grid',
    description: 'Navigates to the real-time calendar and scheduling interface.',
    category: 'navigation'
  },
  {
    trigger: 'Open prayer discipline',
    command: 'Go to prayer discipline',
    description: 'Displays astronomical prayer calculation countdowns and sun positions.',
    category: 'navigation'
  },

  // 8. Architectural & Productivity Inquiries
  {
    trigger: 'How do I structure my deep work day?',
    command: 'Ask Rama: Daily architectural planning',
    description: 'Consults Rama AI for tactical morning and evening productivity optimization.',
    category: 'inquiries'
  },
  {
    trigger: 'Summarize my active governance contracts',
    command: 'Summarize governance contracts',
    description: 'Reviews active institutional consent contracts, rules, and mutual bounds.',
    category: 'inquiries'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Commands' },
  { id: 'ambient', label: 'Soundscapes & Focus', icon: Waves },
  { id: 'media', label: 'Music & Audio', icon: Music },
  { id: 'lockdown', label: 'Lockdown & Tasks', icon: Lock },
  { id: 'calling', label: 'Calls & Dialer', icon: PhoneCall },
  { id: 'messaging', label: 'Messages & Email', icon: MessageSquare },
  { id: 'vision', label: 'Vision HUD', icon: Camera },
  { id: 'navigation', label: 'Navigation', icon: Layers }
];

export const VoiceCommandsModal: React.FC<VoiceCommandsModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  initialMode = 'slideover'
}) => {
  const [viewMode, setViewMode] = useState<'slideover' | 'modal'>(initialMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testedWord, setTestedWord] = useState<string | null>(null);
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Audio test voice greeting
  const handleTestWakeWord = (word: string) => {
    setTestedWord(word);
    setTimeout(() => setTestedWord(null), 2500);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Rama standing by. Awaiting command.`);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExecute = (cmdText: string) => {
    if (onExecuteCommand) {
      onExecuteCommand(cmdText);
      onClose();
    }
  };

  const handleCopyTrigger = (trigger: string) => {
    navigator.clipboard?.writeText(trigger).catch(() => {});
    setCopiedTrigger(trigger);
    setTimeout(() => setCopiedTrigger(null), 2000);
  };

  const filteredCommands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return COMMANDS_DATABASE.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = !q ||
        item.trigger.toLowerCase().includes(q) ||
        item.command.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const isSlideover = viewMode === 'slideover';

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-950/80 backdrop-blur-md transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container (Slide-over or Centered Modal) */}
      <div className={`relative z-10 flex flex-col bg-gray-950 border-gray-800 text-white shadow-2xl transition-all duration-300 ease-out ${
        isSlideover 
          ? 'w-full sm:w-[540px] md:w-[600px] h-full border-l' 
          : 'm-auto w-full max-w-2xl max-h-[90vh] rounded-3xl border my-auto mx-4 overflow-hidden'
      }`}>
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-gray-900/90 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Mic size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                  Available Voice Commands
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold shrink-0">
                  Rama AI Voice
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans truncate">
                Recognized wake words & hands-free system commands
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: Slide-over vs Modal */}
            <button
              type="button"
              onClick={() => setViewMode(isSlideover ? 'modal' : 'slideover')}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
              title={isSlideover ? 'Switch to Centered Modal' : 'Switch to Slide-over Drawer'}
            >
              {isSlideover ? <Maximize2 size={16} /> : <PanelRight size={16} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
              title="Close Guide"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* SECTION 1: Wake Words Banner */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-gray-900/90 to-gray-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Recognized Wake Words
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                Continuous Listener Active
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Say any of these wake phrases within microphone range, followed immediately by your command:
            </p>

            {/* Wake Word Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WAKE_WORDS.map((w) => (
                <div
                  key={w.word}
                  onClick={() => handleTestWakeWord(w.word)}
                  className="bg-gray-900/80 hover:bg-emerald-950/40 border border-gray-800 hover:border-emerald-500/50 rounded-xl p-2.5 transition-all cursor-pointer group text-center space-y-1"
                  title="Click to test voice synthesis response"
                >
                  <div className="text-xs font-bold font-mono text-emerald-400 group-hover:text-emerald-300">
                    "{w.word}"
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-1">
                    {w.note}
                  </div>
                </div>
              ))}
            </div>

            {/* Wake Word Diagnostic Note */}
            <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20 text-[10px] text-gray-400 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-400" />
                Speech Recognition: Web Speech API Ready
              </span>
              {testedWord && (
                <span className="text-emerald-400 font-bold animate-pulse">
                  Testing "{testedWord}"...
                </span>
              )}
            </div>
          </div>

          {/* Prominent Device Assistant Banner */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-gray-900 to-emerald-950/40 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Zap size={16} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">Set Rama as Device Assistant</div>
                <div className="text-[10px] text-gray-400 truncate">Enable background wake-up when app or system is closed</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('cymatic-open-device-assistant'));
                onClose();
              }}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 shadow-sm"
            >
              Configure &rarr;
            </button>
          </div>

          {/* SECTION 2: Search & Filter Controls */}
          <div className="space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search recognized commands (e.g. white noise, call, lockdown, email)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Segmented Scroll */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-gray-950 font-bold border-emerald-500 shadow-sm'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Commands List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>{filteredCommands.length} Commands Available</span>
              <span>Tap any command to run</span>
            </div>

            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center bg-gray-900/40 border border-gray-800 rounded-2xl space-y-2">
                <Info size={24} className="mx-auto text-gray-500" />
                <p className="text-xs text-gray-400 font-mono">
                  No matching voice commands found for "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="text-xs text-emerald-400 hover:underline font-bold"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCommands.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gray-900/60 hover:bg-gray-900 border border-gray-800/80 hover:border-emerald-500/40 rounded-2xl transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          "{item.trigger}"
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold text-gray-400 px-1.5 py-0.5 rounded bg-gray-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {item.description}
                      </p>
                      
                      <div className="text-[10px] text-gray-500 font-mono truncate">
                        Action Syntax: <span className="text-gray-400">{item.command}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleCopyTrigger(item.trigger)}
                        className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800/70 hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Copy voice trigger"
                      >
                        {copiedTrigger === item.trigger ? <Check size={13} className="text-emerald-400" /> : <Zap size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecute(item.trigger)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1 whitespace-nowrap shrink-0"
                        title="Execute command immediately in Rama AI"
                      >
                        <span>Try</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: Micro Tips */}
          <div className="p-3.5 bg-gray-900/40 border border-gray-800/60 rounded-2xl space-y-1.5 text-[11px] text-gray-400">
            <div className="font-bold text-gray-300 flex items-center gap-1.5">
              <Info size={13} className="text-emerald-400" />
              Speech Best Practices
            </div>
            <ul className="space-y-1 list-disc list-inside text-[10px] font-sans leading-relaxed text-gray-400">
              <li>Speak clearly within 1 meter of your device microphone.</li>
              <li>Pause briefly after speaking the wake word before giving your instruction.</li>
              <li>Ambient soundscapes (white noise, binaural beats, zen bowls) can be started or stopped anytime hands-free.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between text-xs text-gray-400 font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <Mic size={13} className="text-emerald-400" />
            Always Listening for "Hey Rama"
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default VoiceCommandsModal;
