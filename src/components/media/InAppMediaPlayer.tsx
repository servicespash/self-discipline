/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * InAppMediaPlayer - Universal Mainframe Audio & Ambient Soundscapes Player
 * Features:
 * - Ambient Soundscapes Engine: White Noise, True Stereo Binaural Beats (Alpha, Theta, Gamma), Zen Temple Singing Bowls & Bells
 * - Direct HTML5 Universal Audio Stream Player for Public MP3s, YouTube mirrors, Spotify, Deezer & Local Audio
 * - Deep Work Session Timers (15m, 25m Pomodoro, 45m Deep Sprint, 60m, Continuous)
 * - Real-time synthesized harmonic visualizer
 */

import React, { useState, useEffect, useRef } from 'react';
import { InAppMediaService, MediaTrack } from '../../utils/inAppMediaService';
import { 
  AmbientSoundscape, 
  AMBIENT_PRESETS, 
  AmbientSoundscapePresetId, 
  AmbientSoundscapeCategory, 
  AmbientSoundscapeState 
} from '../../utils/ambientSoundscapeEngine';
import { 
  Music, 
  Play, 
  Pause, 
  X, 
  Maximize2, 
  Minimize2, 
  FolderOpen,
  Radio,
  Sparkles,
  Waves,
  Bell,
  Volume2,
  VolumeX,
  Clock,
  Headphones
} from 'lucide-react';

export const InAppMediaPlayer: React.FC = () => {
  const [track, setTrack] = useState<MediaTrack | null>(() => InAppMediaService.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [playerMode, setPlayerMode] = useState<'ambient' | 'media'>('ambient');
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  
  // Ambient Soundscape State
  const [ambientState, setAmbientState] = useState<AmbientSoundscapeState>(() => AmbientSoundscape.getState());
  const [selectedCategory, setSelectedCategory] = useState<AmbientSoundscapeCategory>('binaural_beats');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = InAppMediaService.subscribe((currentTrack, playing, visible, mode) => {
      setTrack(currentTrack);
      setIsPlaying(playing);
      setIsVisible(visible);
      if (mode) setPlayerMode(mode);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubAmbient = AmbientSoundscape.subscribe(state => {
      setAmbientState(state);
      if (state.category) {
        setSelectedCategory(state.category);
      }
    });
    return () => unsubAmbient();
  }, []);

  // Visualizer Canvas Animation Loop with High-DPI Scaling & Robust Cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isExpanded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const renderWave = () => {
      step += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isSoundPlaying = playerMode === 'ambient' ? ambientState.isPlaying : isPlaying;

      if (!isSoundPlaying) {
        // Idle flat line
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      // Dynamic harmonic wave based on category
      const color = selectedCategory === 'binaural_beats' 
        ? '#38bdf8' 
        : selectedCategory === 'zen_temple' 
        ? '#f59e0b' 
        : '#10b981';

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const freqMultiplier = selectedCategory === 'binaural_beats' ? 2.5 : selectedCategory === 'zen_temple' ? 1.2 : 3.8;
      const amp = selectedCategory === 'white_noise' ? 12 : 22;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + 
          Math.sin(x * 0.03 * freqMultiplier + step) * amp * (ambientState.volume || 0.7) +
          Math.sin(x * 0.01 + step * 1.5) * (amp * 0.4);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Second harmonic overtone line
      ctx.lineWidth = 1;
      ctx.strokeStyle = `${color}44`;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.cos(x * 0.02 * freqMultiplier - step * 0.8) * (amp * 0.7) * (ambientState.volume || 0.7);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(renderWave);
    };

    animFrameRef.current = requestAnimationFrame(renderWave);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isExpanded, ambientState.isPlaying, isPlaying, selectedCategory, playerMode, ambientState.volume]);

  const handleTogglePlay = () => {
    if (playerMode === 'ambient') {
      AmbientSoundscape.togglePlay();
      const next = !ambientState.isPlaying;
      setIsPlaying(next);
      InAppMediaService.setPlaying(next);
    } else {
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
    }
  };

  const handleSelectPreset = (presetId: AmbientSoundscapePresetId) => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    AmbientSoundscape.playPreset(presetId);
    InAppMediaService.playAmbient(presetId);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    AmbientSoundscape.setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      AmbientSoundscape.setVolume(0.75);
      if (audioRef.current) audioRef.current.volume = 0.75;
      setIsMuted(false);
    } else {
      AmbientSoundscape.setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDeviceStorageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      AmbientSoundscape.pause();
      InAppMediaService.indexLocalFiles(files);
      InAppMediaService.playLocalAudioFile(files[0]);
      setPlayerMode('media');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    AmbientSoundscape.pause();
    InAppMediaService.dispatchMedia(customSearchQuery.trim());
    setCustomSearchQuery('');
    setPlayerMode('media');
  };

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  const currentPreset = ambientState.activePresetId ? AMBIENT_PRESETS[ambientState.activePresetId] : AMBIENT_PRESETS.binaural_alpha;
  const filteredPresets = Object.values(AMBIENT_PRESETS).filter(p => p.category === selectedCategory);

  return (
    <div className={`fixed z-[140] transition-all duration-300 ease-in-out ${
      isExpanded 
        ? 'inset-x-3 bottom-3 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[480px] sm:max-h-[660px]' 
        : 'bottom-4 inset-x-4 max-w-xl mx-auto'
    }`}>
      {/* HTML5 Audio Node for Streaming MP3s / Local Files */}
      {track?.audioUrl && (
        <audio 
          ref={audioRef} 
          src={track.audioUrl} 
          autoPlay={isPlaying && playerMode === 'media'} 
          onEnded={() => {
            setIsPlaying(false);
            InAppMediaService.setPlaying(false);
          }}
        />
      )}

      {/* Hidden Phone File Picker */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleDeviceStorageFileSelect} 
        accept="audio/*" 
        multiple
        className="hidden" 
      />

      <div className="bg-gray-950/95 border border-emerald-500/30 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col ring-1 ring-emerald-500/10">
        
        {/* Header Control Strip */}
        <div className="p-3 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              playerMode === 'ambient' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
            }`}>
              {playerMode === 'ambient' ? <Waves size={16} /> : <Music size={16} />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate max-w-[190px] sm:max-w-xs">
                {playerMode === 'ambient' ? currentPreset.name : (track?.title || 'Universal Media')}
              </div>
              <div className="text-[10px] text-gray-400 font-mono truncate flex items-center gap-1.5">
                <span className="uppercase text-emerald-400 font-bold">
                  {playerMode === 'ambient' ? 'Ambient Soundscape' : (track?.platform || 'Direct Audio')}
                </span>
                <span>·</span>
                {playerMode === 'ambient' && ambientState.timerMinutes ? (
                  <span className="text-white font-mono tabular-nums flex items-center gap-1">
                    <Clock size={10} className="text-emerald-400" />
                    {formatTimer(ambientState.timeRemainingSeconds)}
                  </span>
                ) : (
                  <span>Deep Work Engine</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`p-2 rounded-xl font-bold transition-all cursor-pointer shadow-md ${
                (playerMode === 'ambient' ? ambientState.isPlaying : isPlaying)
                  ? 'bg-emerald-500 text-gray-950 hover:bg-emerald-400'
                  : 'bg-emerald-600 text-gray-950 hover:bg-emerald-500'
              }`}
              title={(playerMode === 'ambient' ? ambientState.isPlaying : isPlaying) ? 'Pause' : 'Play'}
            >
              {(playerMode === 'ambient' ? ambientState.isPlaying : isPlaying) ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {/* Quick Mode Toggle Icon Button */}
            <button
              type="button"
              onClick={() => {
                const nextMode = playerMode === 'ambient' ? 'media' : 'ambient';
                setPlayerMode(nextMode);
                InAppMediaService.setMode(nextMode);
              }}
              className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl border border-gray-800 transition-all cursor-pointer"
              title={playerMode === 'ambient' ? 'Switch to Streaming & Local Media' : 'Switch to Ambient Soundscapes'}
            >
              {playerMode === 'ambient' ? <Music size={14} /> : <Waves size={14} />}
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

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

        {/* Expanded Body */}
        {isExpanded && (
          <div className="p-4 space-y-3.5 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar max-h-[580px]">
            
            {/* Top Mode Segmented Bar */}
            <div className="flex items-center gap-1 p-1 bg-gray-900 border border-gray-800 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPlayerMode('ambient');
                  InAppMediaService.setMode('ambient');
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  playerMode === 'ambient'
                    ? 'bg-emerald-600 text-gray-950 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Waves size={13} />
                Ambient Soundscapes
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlayerMode('media');
                  InAppMediaService.setMode('media');
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  playerMode === 'media'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Music size={13} />
                Universal Stream & Files
              </button>
            </div>

            {/* Visualizer Display & Audio Wave Canvas */}
            <div className="relative h-20 bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden flex flex-col justify-between p-3 shrink-0">
              <canvas 
                ref={canvasRef} 
                width={440} 
                height={80} 
                className="absolute inset-0 w-full h-full pointer-events-none opacity-80" 
              />
              
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Headphones size={12} className="text-emerald-400" />
                  {playerMode === 'ambient' ? currentPreset.frequencyLabel || currentPreset.name : 'Direct Stream'}
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {ambientState.isPlaying || isPlaying ? 'RESONATING' : 'PAUSED'}
                </span>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] text-gray-400">
                <span className="truncate max-w-[280px]">
                  {playerMode === 'ambient' ? currentPreset.benefits : (track?.artist || 'Cymatic Media Engine')}
                </span>
                {selectedCategory === 'zen_temple' && playerMode === 'ambient' && (
                  <button
                    type="button"
                    onClick={() => AmbientSoundscape.triggerBellStrike(432)}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Strike Singing Bowl"
                  >
                    <Bell size={10} /> Strike Bowl
                  </button>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: Ambient Soundscapes */}
            {playerMode === 'ambient' ? (
              <div className="space-y-3.5">
                {/* Soundscape Categories (White Noise, Binaural Beats, Zen Temple) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                    <span>Select Acoustic Environment</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Offline Web Audio Synth</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'binaural_beats' as AmbientSoundscapeCategory, label: 'Binaural Beats', sub: 'Alpha / Theta / Gamma' },
                      { id: 'white_noise' as AmbientSoundscapeCategory, label: 'White Noise', sub: 'White / Pink / Brown' },
                      { id: 'zen_temple' as AmbientSoundscapeCategory, label: 'Zen Temple', sub: 'Singing Bowls & Bells' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-sm'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{cat.label}</div>
                        <div className="text-[9px] text-gray-500 font-mono truncate mt-0.5">{cat.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset List for Selected Category */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Acoustic Frequencies
                  </div>
                  <div className="space-y-1.5">
                    {filteredPresets.map(p => {
                      const isActive = ambientState.activePresetId === p.id && ambientState.isPlaying;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPreset(p.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            ambientState.activePresetId === p.id
                              ? 'bg-gray-900 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                              : 'bg-gray-900/40 border-gray-800/80 hover:bg-gray-900 hover:border-gray-700'
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${ambientState.activePresetId === p.id ? 'text-emerald-400' : 'text-white'}`}>
                                {p.name}
                              </span>
                              {p.frequencyLabel && (
                                <span className="text-[9px] font-mono text-cyan-400">
                                  {p.frequencyLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 leading-tight">
                              {p.description}
                            </p>
                            <div className="text-[10px] text-gray-500 font-mono">
                              Benefit: {p.benefits}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ambientState.activePresetId === p.id && ambientState.isPlaying) {
                                AmbientSoundscape.pause();
                              } else {
                                handleSelectPreset(p.id);
                              }
                            }}
                            className={`p-2 rounded-xl text-gray-950 font-bold transition-all shrink-0 ${
                              isActive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-gray-800 text-gray-300 hover:bg-emerald-600 hover:text-gray-950'
                            }`}
                          >
                            {isActive ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Session Timers & Volume Row */}
                <div className="pt-2 border-t border-gray-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-400" />
                      Session Duration:
                    </span>
                    <span className="text-white font-bold tabular-nums">
                      {ambientState.timerMinutes ? `${ambientState.timerMinutes} min session` : 'Continuous Flow'}
                    </span>
                  </div>

                  {/* Preset Timers */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: '15m', val: 15 },
                      { label: '25m (Pomodoro)', val: 25 },
                      { label: '45m (Sprint)', val: 45 },
                      { label: '60m', val: 60 },
                      { label: 'Infinite', val: null }
                    ].map(t => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => AmbientSoundscape.setTimer(t.val)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                          ambientState.timerMinutes === t.val
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 shadow-sm'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || ambientState.volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={ambientState.volume}
                      onChange={handleVolumeChange}
                      className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-gray-400 tabular-nums w-8 text-right">
                      {Math.round(ambientState.volume * 100)}%
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              /* TAB CONTENT 2: Universal Streaming & Local Files */
              <div className="space-y-3.5">
                <div className="p-4 bg-gray-900/60 rounded-2xl border border-gray-800 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                    <Radio size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">{track?.title || 'Universal Audio Stream'}</h4>
                    <p className="text-[11px] text-gray-400 font-mono mt-1">
                      Direct streaming audio for Spotify, YouTube, Deezer mirrors & Local phone files.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-bold text-xs uppercase rounded-xl cursor-pointer inline-flex items-center gap-2"
                  >
                    <FolderOpen size={14} /> Index Local Audio Files
                  </button>
                </div>

                {/* Universal AI Search Form */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Ask Rama to dispatch any song or stream..."
                    value={customSearchQuery}
                    onChange={e => setCustomSearchQuery(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!customSearchQuery.trim()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-bold text-xs uppercase rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles size={13} /> Dispatch
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
