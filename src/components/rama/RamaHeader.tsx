/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RamaHeader - Window Controls, Mode Toggle & System Overlay Status
 */

import React from 'react';
import { BotMessageSquare, Minus, Maximize2, X, Radio, Volume2, VolumeX, Menu } from 'lucide-react';

interface RamaHeaderProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  displayMode: 'window' | 'assistant';
  onToggleDisplayMode: () => void;
  enableTts: boolean;
  onToggleTts: () => void;
  onToggleSidebar: () => void;
  statusText?: string;
}

export const RamaHeader: React.FC<RamaHeaderProps> = ({
  isMinimized,
  onToggleMinimize,
  onClose,
  displayMode,
  onToggleDisplayMode,
  enableTts,
  onToggleTts,
  onToggleSidebar,
  statusText = 'Online & Aware'
}) => {
  return (
    <div className="px-4 py-3 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between select-none shrink-0 backdrop-blur-md text-white">
      <div className="flex items-center space-x-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 rounded-xl text-emerald-400 cursor-pointer transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu size={16} />
        </button>
        <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
          <BotMessageSquare size={17} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-black text-xs uppercase tracking-wider truncate">RAMA AI ASSISTANT</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {statusText}
            </span>
          </div>
          <p className="text-[10px] font-mono text-gray-400 truncate">Content-Aware Voice & Intent Execution</p>
        </div>
      </div>

      <div className="flex items-center space-x-1 shrink-0">
        <button
          type="button"
          onClick={onToggleDisplayMode}
          className="p-1.5 text-gray-400 hover:text-emerald-400 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          title={displayMode === 'window' ? 'Switch to Gemini Mini Assistant HUD' : 'Expand to Full Hub'}
        >
          <Radio size={15} />
        </button>
        <button
          type="button"
          onClick={onToggleTts}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            enableTts ? 'text-emerald-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-800'
          }`}
          title={enableTts ? 'Voice Audio Output Active' : 'Voice Audio Output Muted'}
        >
          {enableTts ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button
          type="button"
          onClick={onToggleMinimize}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          title={isMinimized ? 'Expand Hub' : 'Minimize Hub'}
        >
          {isMinimized ? <Maximize2 size={15} /> : <Minus size={15} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer"
          title="Close Hub"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
