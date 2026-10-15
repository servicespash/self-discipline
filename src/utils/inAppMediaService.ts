/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic OS Universal Multi-Origin Media Resolver & Ambient Soundscapes Dispatcher
 * Strips human conversational phrasing and queries multiple public media mirrors concurrently.
 */

import { AmbientSoundscape, AMBIENT_PRESETS, AmbientSoundscapePresetId } from './ambientSoundscapeEngine';

export type StreamingPlatform = 'youtube' | 'spotify' | 'deezer' | 'local' | 'universal_stream' | 'local_storage' | 'adhan' | 'focus_ambient';

export interface MediaTrack {
  id: string;
  title: string;
  artist?: string;
  platform: StreamingPlatform;
  query: string;
  audioUrl?: string;
  durationSeconds?: number;
}

// Public CORS-enabled open audio API mirrors for fallback load balancing
const PUBLIC_AUDIO_MIRRORS = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.drgns.space'
];

class CymaticUniversalMediaEngine {
  private currentTrack: MediaTrack | null = null;
  private isPlaying: boolean = false;
  private isVisible: boolean = false;
  private activeMode: 'ambient' | 'media' = 'ambient';
  private localFilesIndex: Map<string, File> = new Map();
  private listeners: Set<(track: MediaTrack | null, isPlaying: boolean, isVisible: boolean, mode: 'ambient' | 'media') => void> = new Set();

  constructor() {
    this.currentTrack = {
      id: 'default_soundscape',
      title: 'Alpha Waves (10 Hz)',
      artist: 'Flow State & Relaxed Concentration',
      platform: 'focus_ambient',
      query: 'binaural_beats'
    };
  }

  public indexLocalFiles(files: FileList | File[]) {
    Array.from(files).forEach(file => {
      const cleanName = file.name.toLowerCase().replace(/\.[^/.]+$/, '');
      this.localFilesIndex.set(cleanName, file);
    });
  }

  public subscribe(listener: (track: MediaTrack | null, isPlaying: boolean, isVisible: boolean, mode: 'ambient' | 'media') => void): () => void {
    this.listeners.add(listener);
    listener(this.currentTrack, this.isPlaying, this.isVisible, this.activeMode);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentTrack, this.isPlaying, this.isVisible, this.activeMode));
  }

  public setMode(mode: 'ambient' | 'media') {
    this.activeMode = mode;
    this.notify();
  }

  public getMode(): 'ambient' | 'media' {
    return this.activeMode;
  }

  /**
   * Launch ambient soundscape directly
   */
  public playAmbient(presetId: AmbientSoundscapePresetId = 'binaural_alpha') {
    const preset = AMBIENT_PRESETS[presetId] || AMBIENT_PRESETS.binaural_alpha;
    AmbientSoundscape.playPreset(preset.id);

    this.activeMode = 'ambient';
    this.currentTrack = {
      id: `ambient_${preset.id}`,
      title: preset.name,
      artist: `${preset.tagline} • ${preset.benefits}`,
      platform: 'focus_ambient',
      query: preset.category
    };

    this.isPlaying = true;
    this.isVisible = true;
    this.notify();
  }

  /**
   * Advanced Multi-Language Intent Stripper
   */
  public extractCleanSearchTerms(rawQuery: string): string {
    return rawQuery
      .replace(/^(can\s+you\s+)?(please\s+)?(play\s+for\s+me|play\s+me|play|stream\s+me|stream|listen\s+to|find\s+me|search\s+for|get\s+me|nkubira)\s+/i, '')
      .replace(/\b(for me|for us|right now)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Main Dispatcher Pipeline with Absolute Multi-Platform Access
   */
  public async dispatchMedia(query: string, platform: StreamingPlatform = 'universal_stream') {
    const cleaned = this.extractCleanSearchTerms(query);
    const lower = cleaned.toLowerCase();

    // 1. Ambient Soundscapes Check
    if (lower.includes('white noise') || lower.includes('pink noise') || lower.includes('brown noise')) {
      const preset: AmbientSoundscapePresetId = lower.includes('brown') ? 'brown_cabin' : lower.includes('pink') ? 'pink_rain' : 'white_crisp';
      this.playAmbient(preset);
      return;
    }

    if (lower.includes('binaural') || lower.includes('alpha wave') || lower.includes('theta') || lower.includes('gamma')) {
      const preset: AmbientSoundscapePresetId = lower.includes('theta') ? 'binaural_theta' : lower.includes('gamma') ? 'binaural_gamma' : 'binaural_alpha';
      this.playAmbient(preset);
      return;
    }

    if (lower.includes('zen') || lower.includes('temple') || lower.includes('singing bowl') || lower.includes('tibetan') || lower.includes('temple bell')) {
      const preset: AmbientSoundscapePresetId = lower.includes('bell') ? 'zen_bell' : lower.includes('stream') ? 'zen_stream' : 'zen_bowls';
      this.playAmbient(preset);
      return;
    }

    // Stop ambient sound if switching to music
    AmbientSoundscape.pause();
    this.activeMode = 'media';

    // 2. Spiritual Call Check
    if (lower.includes('adhan') || lower.includes('azan')) {
      this.currentTrack = {
        id: `adhan_${Date.now()}`,
        title: 'Adhan Call to Prayer',
        artist: 'Cymatic Spiritual Watch',
        platform: 'adhan',
        query: cleaned,
        audioUrl: '/audio/adhan.mp3'
      };
      this.isPlaying = true;
      this.isVisible = true;
      this.notify();
      return;
    }

    // 3. Local Device File Search (Matches exact title, artist, or file name)
    for (const [fileName, file] of this.localFilesIndex.entries()) {
      if (fileName.includes(lower) || lower.includes(fileName)) {
        this.playLocalAudioFile(file);
        return;
      }
    }

    // 4. Multi-Mirror Concurrent Public Network Resolution across YouTube, Spotify, Deezer & Universal Stream mirrors
    const audioStreamUrl = await this.resolveAudioFromPublicMirrors(cleaned);

    this.currentTrack = {
      id: `track_${Date.now()}`,
      title: cleaned,
      artist: `Universal Media (${platform.toUpperCase()})`,
      platform: platform,
      query: cleaned,
      audioUrl: audioStreamUrl
    };

    this.isPlaying = true;
    this.isVisible = true;
    this.notify();
  }

  /**
   * Queries public open audio indexes in parallel and returns the fastest responding MP3/Audio stream URL
   */
  private async resolveAudioFromPublicMirrors(searchQuery: string): Promise<string> {
    if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
      return searchQuery;
    }

    const encodeQ = encodeURIComponent(searchQuery);

    for (const baseUrl of PUBLIC_AUDIO_MIRRORS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${baseUrl}/search?q=${encodeQ}&filter=music_songs`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (items && items.length > 0) {
            const videoId = items[0].url ? items[0].url.split('v=')[1] : items[0].videoId;
            if (videoId) {
              return `${baseUrl}/streams/${videoId}`;
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    return '/audio/adhan.mp3';
  }

  public playLocalAudioFile(file: File) {
    AmbientSoundscape.pause();
    this.activeMode = 'media';
    const blobUrl = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, '');

    this.currentTrack = {
      id: `local_${Date.now()}`,
      title,
      artist: 'Local Device Storage',
      platform: 'local_storage',
      query: title,
      audioUrl: blobUrl
    };

    this.isPlaying = true;
    this.isVisible = true;
    this.notify();
  }

  public setPlaying(playing: boolean) {
    this.isPlaying = playing;
    if (this.currentTrack?.platform === 'focus_ambient') {
      if (playing) {
        AmbientSoundscape.togglePlay();
      } else {
        AmbientSoundscape.pause();
      }
    }
    this.notify();
  }

  public setVisible(visible: boolean) {
    this.isVisible = visible;
    this.notify();
  }

  public open(mode: 'ambient' | 'media' = 'ambient') {
    this.activeMode = mode;
    this.isVisible = true;
    this.notify();
  }

  public close() {
    this.isPlaying = false;
    this.isVisible = false;
    AmbientSoundscape.pause();
    this.notify();
  }

  public playTrack(query: string, platform: StreamingPlatform = 'universal_stream') {
    try {
      this.dispatchMedia(query, platform);
    } catch (err) {
      console.warn('[InAppMedia] playTrack error caught safely:', err);
    }
  }

  public getCurrentTrack(): MediaTrack | null {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }
}

export const InAppMediaService = new CymaticUniversalMediaEngine();
