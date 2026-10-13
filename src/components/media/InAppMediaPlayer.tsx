/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * InAppMediaPlayer - Embedded UI Music & Media Player
 * Plays YouTube Music, Spotify, Deezer, and Local Device Audio files directly
 * inside the Cymatic OS interface without navigating to external apps.
 */

import React, { useState, useEffect, useRef } from 'react';
import { InAppMediaService, MediaTrack, StreamingPlatform } from '../../utils/inAppMediaService';
import { 
  Music, 
  Play, 
  Pause, 
  X, 
  Maximize2, 
  Minimize2, 
  FolderOpen, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const InAppMediaPlayer: React.FC = () => {
  const [track, setTrack] = useState<MediaTrack | null>(() => InAppMediaService.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform>('youtube');
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = InAppMediaService.subscribe((currentTrack, playing, visible) => {
      setTrack(currentTrack);
      setIsPlaying(playing);
      setIsVisible(visible);
      if (currentTrack) {
        setSelectedPlatform(currentTrack.platform);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    InAppMediaService.setPlaying(nextState);

    if (track?.platform === 'local' && audioRef.current) {
      if (nextState) {
        audioRef.current.play().catch(e => console.warn('[Player] Audio play error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleDeviceStorageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      InAppMediaService.playLocalAudioFile(file);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    InAppMediaService.playTrack(customSearchQuery.trim(), selectedPlatform);
    setCustomSearchQuery('');
  };

  if (!isVisible || !track) return null;

  return (
    <div className={`fixed z-[140] transition-all duration-300 ease-in-out ${
      isExpanded 
        ? 'inset-x-4 bottom-4 top-24 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-96 sm:h-[480px]' 
        : 'bottom-4 inset-x-4 max-w-xl mx-auto'
    }`}>
      {/* Hidden local audio element */}
      {track.platform === 'local' && track.audioBlobUrl && (
        <audio 
          ref={audioRef} 
          src={track.audioBlobUrl} 
          autoPlay={isPlaying} 
          loop 
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Hidden file input for device storage audio */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleDeviceStorageFileSelect} 
        accept="audio/*" 
        className="hidden" 
      />

      <div className="bg-gray-950/95 border border-emerald-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl ring-1 ring-emerald-500/20 overflow-hidden flex flex-col">
        {/* Top Header / Player Controls */}
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
                <span>• In-App Disciplinary Stream</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 rounded-xl font-bold transition-all cursor-pointer shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {/* Load from storage */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl border border-gray-800 transition-all cursor-pointer"
              title="Load Audio File from Device Storage (.mp3, .wav)"
            >
              <FolderOpen size={14} />
            </button>

            {/* Expand / Minimize */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse Player' : 'Expand Player'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => InAppMediaService.close()}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
              title="Close Player"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Expanded View: Embed Iframe & Platform Switcher */}
        {isExpanded && (
          <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
            {/* Platform Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
              {[
                { id: 'youtube', label: 'YouTube Music' },
                { id: 'spotify', label: 'Spotify' },
                { id: 'deezer', label: 'Deezer' },
                { id: 'local', label: 'Device Storage' },
              ].map(plat => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(plat.id as StreamingPlatform);
                    if (plat.id === 'local') {
                      fileInputRef.current?.click();
                    } else {
                      InAppMediaService.playTrack(track.query, plat.id as StreamingPlatform);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    selectedPlatform === plat.id
                      ? 'bg-emerald-600 text-gray-950 shadow-md'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {plat.label}
                </button>
              ))}
            </div>

            {/* In-App Embedded Frame View */}
            {track.platform !== 'local' && track.embedUrl ? (
              <div className="w-full flex-1 min-h-[220px] rounded-2xl overflow-hidden border border-gray-800 bg-black">
                <iframe
                  src={track.embedUrl}
                  title="In-App Disciplinary Music Player"
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                />
              </div>
            ) : (
              <div className="p-6 bg-gray-900/60 rounded-2xl border border-gray-800 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase">Device Storage Audio</h4>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                    Playing directly from your local phone/PC storage without streaming bandwidth.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                >
                  Pick Audio Track (.mp3, .wav, .m4a)
                </button>
              </div>
            )}

            {/* Quick In-App Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Search track on ${selectedPlatform}...`}
                value={customSearchQuery}
                onChange={e => setCustomSearchQuery(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!customSearchQuery.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-black text-xs uppercase rounded-xl cursor-pointer shrink-0"
              >
                Play
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
