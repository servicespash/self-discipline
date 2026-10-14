/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * InAppMediaPlayer - Mainframe Direct Media Component
 * Pure HTML5 Direct Audio Stream Player for Local Files & Public MP3 Audio Assets.
 */

import React, { useState, useEffect, useRef } from 'react';
import { InAppMediaService, MediaTrack } from '../../utils/inAppMediaService';
import { 
  Music, 
  Play, 
  Pause, 
  X, 
  Maximize2, 
  Minimize2, 
  FolderOpen,
  Radio,
  Sparkles
} from 'lucide-react';

export const InAppMediaPlayer: React.FC = () => {
  const [track, setTrack] = useState<MediaTrack | null>(() => InAppMediaService.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [volume] = useState<number>(0.85);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = InAppMediaService.subscribe((currentTrack, playing, visible) => {
      setTrack(currentTrack);
      setIsPlaying(playing);
      setIsVisible(visible);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    InAppMediaService.setPlaying(nextState);

    if (audioRef.current) {
      if (nextState) {
        audioRef.current.play().catch(e => console.warn('[CymaticAudio] Play error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleDeviceStorageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      InAppMediaService.indexLocalFiles(files);
      InAppMediaService.playLocalAudioFile(files[0]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    InAppMediaService.dispatchMedia(customSearchQuery.trim());
    setCustomSearchQuery('');
  };

  if (!isVisible || !track) return null;

  return (
    <div className={`fixed z-[140] transition-all duration-300 ease-in-out ${
      isExpanded 
        ? 'inset-x-4 bottom-4 top-24 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-96 sm:h-[420px]' 
        : 'bottom-4 inset-x-4 max-w-xl mx-auto'
    }`}>
      {/* Pure Direct HTML5 Audio Stream Node */}
      {track.audioUrl && (
        <audio 
          ref={audioRef} 
          src={track.audioUrl} 
          autoPlay={isPlaying} 
          onEnded={() => {
            setIsPlaying(false);
            InAppMediaService.setPlaying(false);
          }}
        />
      )}

      {/* Local File Picker (Multiple files indexed) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleDeviceStorageFileSelect} 
        accept="audio/*" 
        multiple
        className="hidden" 
      />

      <div className="bg-gray-950/95 border border-emerald-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl ring-1 ring-emerald-500/20 overflow-hidden flex flex-col">
        {/* Header Control Strip */}
        <div className="p-3.5 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Music size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate max-w-[200px] sm:max-w-xs">
                {track.title}
              </div>
              <div className="text-[10px] text-gray-400 font-mono truncate flex items-center gap-1.5">
                <span className="uppercase text-emerald-400 font-bold">{track.platform}</span>
                <span>• Mainframe Universal Audio</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-xl font-bold transition-all cursor-pointer shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl border border-gray-800 transition-all cursor-pointer"
              title="Index / Load Audio Tracks from Phone Storage"
            >
              <FolderOpen size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              type="button"
              onClick={() => InAppMediaService.close()}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
            <div className="p-6 bg-gray-900/80 rounded-2xl border border-gray-800 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <Radio size={28} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase">{track.title}</h4>
                <p className="text-[11px] text-gray-400 max-w-xs mt-1 font-mono">
                  Playing direct audio MP3 stream cleanly inside Cymatic OS without external iframe blocks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase rounded-xl cursor-pointer flex items-center gap-2"
              >
                <FolderOpen size={14} /> Index Phone Music Files
              </button>
            </div>

            {/* Universal AI Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask Rama to dispatch any song (e.g. Latty Adams, Watendawili)..."
                value={customSearchQuery}
                onChange={e => setCustomSearchQuery(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!customSearchQuery.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-black text-xs uppercase rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Sparkles size={13} /> Dispatch
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
