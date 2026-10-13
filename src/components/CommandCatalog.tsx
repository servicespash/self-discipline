/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CommandCatalog - Interactive directory of voice-triggered system actions available in Rama AI
 */

import React, { useState } from 'react';
import {
  Terminal,
  PhoneCall,
  MessageSquare,
  Music,
  Camera,
  Compass,
  Lock,
  Search,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CommandCatalogProps {
  onExecuteCommand?: (commandText: string) => void;
}

interface CommandCategory {
  title: string;
  icon: any;
  color: string;
  commands: {
    command: string;
    description: string;
    example: string;
  }[];
}

const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    title: 'Telephony & Voice Calling',
    icon: PhoneCall,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
    commands: [
      {
        command: 'Call [Name or Number]',
        description: 'Initiates a secure device telephone call with network carrier selection (SIM 1 / SIM 2 / VoIP).',
        example: 'Call Mom or Call +1234567890'
      },
      {
        command: 'Dial [Number]',
        description: 'Directly opens the device dialer with the specified recipient number.',
        example: 'Dial 0700123456'
      }
    ]
  },
  {
    title: 'Messaging & Executive Dispatch',
    icon: MessageSquare,
    color: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
    commands: [
      {
        command: 'Write a message to [Recipient]',
        description: 'Opens the interactive Message & Email Designer pre-drafted with a warm, personalized greeting.',
        example: 'Write a message to my mom saying I will call her tonight'
      },
      {
        command: 'Send email to [Address]',
        description: 'Drafts and launches an executive email dispatch with custom subject and body.',
        example: 'Send email to boss@company.com about the project status'
      }
    ]
  },
  {
    title: 'Embedded Music Streaming',
    icon: Music,
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
    commands: [
      {
        command: 'Play [Song or Artist] on [Platform]',
        description: 'Streams music inside the embedded in-app player via YouTube Music, Spotify, Deezer, or local device storage.',
        example: 'Play Bohemian Rhapsody on Spotify'
      },
      {
        command: 'Play local audio file',
        description: 'Loads and plays audio files directly from your local device storage.',
        example: 'Play local discipline soundtrack'
      }
    ]
  },
  {
    title: 'Vision & Optical AI HUD',
    icon: Camera,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
    commands: [
      {
        command: 'Open camera preview / Start vision',
        description: 'Activates the live optical posture and environment vision scanner.',
        example: 'Open camera preview'
      },
      {
        command: 'Screen recording preview',
        description: 'Initiates screen capture and visual feedback analysis.',
        example: 'Open screen preview'
      }
    ]
  },
  {
    title: 'Discipline & System Control',
    icon: Lock,
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
    commands: [
      {
        command: 'Locate Qibla',
        description: 'Calculates exact geodesic bearing and distance to the Kaaba from your GPS location.',
        example: 'Locate Qibla'
      },
      {
        command: 'Engage lockdown / Deep work lock',
        description: 'Blocks distraction packages and enforces uninterrupted focus intervals.',
        example: 'Engage lockdown for 45 minutes'
      },
      {
        command: 'Add task / Create task',
        description: 'Logs new executive priorities into your Cymatic OS operation vault.',
        example: 'Add task review quarterly architecture'
      }
    ]
  }
];

export default function CommandCatalog({ onExecuteCommand }: CommandCatalogProps) {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredCategories = COMMAND_CATEGORIES.map(cat => ({
    ...cat,
    commands: cat.commands.filter(
      c =>
        c.command.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.example.toLowerCase().includes(searchFilter.toLowerCase())
    )
  })).filter(cat => cat.commands.length > 0);

  return (
    <div className="w-full bg-gray-950 border border-gray-800 rounded-3xl p-4 sm:p-5 text-white shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <Terminal size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-white">Rama System Command Catalog</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                Voice & Intent Ready
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              Available system commands and voice triggers for Rama AI. Tap any example to execute instantly.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Filter commands (e.g. call, message)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-mono text-xs">
            No matching voice commands found for "{searchFilter}".
          </div>
        ) : (
          filteredCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl border ${cat.color}`}>
                    <Icon size={15} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-200">{cat.title}</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {cat.commands.map((cmd, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={() => onExecuteCommand && onExecuteCommand(cmd.example)}
                      className="group bg-gray-950/80 hover:bg-emerald-950/20 border border-gray-800 hover:border-emerald-500/40 rounded-xl p-3 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 font-mono group-hover:text-emerald-300">
                            {cmd.command}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                          {cmd.description}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                          <span className="text-gray-400 font-bold">Voice Trigger:</span> "{cmd.example}"
                        </div>
                      </div>

                      <div className="p-2 bg-gray-900 group-hover:bg-emerald-600 group-hover:text-gray-950 text-gray-400 rounded-xl transition-all shrink-0">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-400" />
          Protected by Cymatic OS Permission Architecture
        </span>
        <span className="text-emerald-400 font-bold">Say "Hi Rama" anytime</span>
      </div>
    </div>
  );
}
