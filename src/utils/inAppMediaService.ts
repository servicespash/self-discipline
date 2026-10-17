/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic OS Universal Multi-Origin Media Resolver & Ambient Soundscapes Dispatcher
 * Strips human conversational phrasing and queries multiple public media mirrors concurrently with MediaSession API integration.
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
    this.setupMediaSessionHandlers();
  }

  private setupMediaSessionHandlers() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          this.setPlaying(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.setPlaying(false);
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          this.close();
        });
      } catch (e) {
        console.warn('[InAppMediaService] MediaSession action handler setup error:', e);
      }
    }
  }

  private updateMediaSessionMetadata() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && this.currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.currentTrack.title,
          artist: this.currentTrack.artist || 'Cymatic Discipline OS',
          album: 'Deep Work & Spiritual Focus'
        });
      } catch (e) {
        console.warn('[InAppMediaService] MediaSession metadata update error:', e);
      }
    }
  }

  public indexLocalFiles(files: FileList | File[]) {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file && file.name) {
        const cleanName = file.name.toLowerCase().replace(/\.[^/.]+$/, '');
        this.localFilesIndex.set(cleanName, file);
      }
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
    this.updateMediaSessionMetadata();
    this.listeners.forEach(cb => {
      try {
        cb(this.currentTrack, this.isPlaying, this.isVisible, this.activeMode);
      } catch (e) {
        console.error('[InAppMediaService] Listener callback error:', e);
      }
    });
  }

  public setMode(mode: 'ambient' | 'media') {
    if (this.activeMode !== mode) {
      this.activeMode = mode;
      this.notify();
    }
  }

  public getMode(): 'ambient' | 'media' {
    return this.activeMode;
  }

  public playAmbient(presetId: AmbientSoundscapePresetId = 'binaural_alpha') {
    const preset = AMBIENT_PRESETS[presetId] || AMBIENT_PRESETS.binaural_alpha;
    try {
      AmbientSoundscape.playPreset(preset.id);
    } catch (e) {
      console.warn('[InAppMediaService] AmbientSoundscape playPreset error:', e);
    }

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

  public extractCleanSearchTerms(rawQuery: string): string {
    if (!rawQuery || typeof rawQuery !== 'string') return '';
    return rawQuery
      .replace(/^(can\s+you\s+)?(please\s+)?(play\s+for\s+me|play\s+me|play|stream\s+me|stream|listen\s+to|find\s+me|search\s+for|get\s+me|nkubira)\s+/i, '')
      .replace(/\b(for me|for us|right now)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public async dispatchMedia(query: string, platform: StreamingPlatform = 'universal_stream') {
    const cleaned = this.extractCleanSearchTerms(query);
    if (!cleaned) return;
    const lower = cleaned.toLowerCase();

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

    try {
      AmbientSoundscape.pause();
    } catch {}
    this.activeMode = 'media';

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

    for (const [fileName, file] of this.localFilesIndex.entries()) {
      if (fileName.includes(lower) || lower.includes(fileName)) {
        this.playLocalAudioFile(file);
        return;
      }
    }

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

  private async resolveAudioFromPublicMirrors(searchQuery: string): Promise<string> {
    if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
      return searchQuery;
    }

    const encodeQ = encodeURIComponent(searchQuery);

    const mirrorPromises = PUBLIC_AUDIO_MIRRORS.map(async (baseUrl) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(`${baseUrl}/search?q=${encodeQ}&filter=music_songs`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (Array.isArray(items) && items.length > 0) {
            const videoId = items[0].url ? items[0].url.split('v=')[1] : items[0].videoId;
            if (videoId) {
              return `${baseUrl}/streams/${videoId}`;
            }
          }
        }
      } catch {
        // Fallback to next mirror
      }
      return null;
    });

    try {
      const results = await Promise.allSettled(mirrorPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }
    } catch (e) {
      console.warn('[InAppMediaService] Mirror resolution error:', e);
    }

    return '/audio/adhan.mp3';
  }

  public playLocalAudioFile(file: File) {
    try {
      AmbientSoundscape.pause();
    } catch {}
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
    if (this.isPlaying !== playing) {
      this.isPlaying = playing;
      if (this.currentTrack?.platform === 'focus_ambient') {
        try {
          if (playing) {
            AmbientSoundscape.togglePlay();
          } else {
            AmbientSoundscape.pause();
          }
        } catch {}
      }
      this.notify();
    }
  }

  public setVisible(visible: boolean) {
    if (this.isVisible !== visible) {
      this.isVisible = visible;
      this.notify();
    }
  }

  public open(mode: 'ambient' | 'media' = 'ambient') {
    this.activeMode = mode;
    this.isVisible = true;
    this.notify();
  }

  public close() {
    this.isPlaying = false;
    this.isVisible = false;
    try {
      AmbientSoundscape.pause();
    } catch {}
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
