/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * In-App Media & Music Streaming Engine
 * Plays music within the UI (YouTube Music, Spotify, Deezer, Local Device Storage)
 * without launching external third-party apps.
 */

export type StreamingPlatform = 'youtube' | 'spotify' | 'deezer' | 'local' | 'focus_ambient';

export interface MediaTrack {
  id: string;
  title: string;
  artist?: string;
  platform: StreamingPlatform;
  query: string;
  embedUrl?: string;
  audioBlobUrl?: string;
  durationSeconds?: number;
}

class InAppMediaEngine {
  private currentTrack: MediaTrack | null = null;
  private isPlaying: boolean = false;
  private isVisible: boolean = false;
  private listeners: Set<(track: MediaTrack | null, isPlaying: boolean, isVisible: boolean) => void> = new Set();

  constructor() {
    // Initial default track (Ambient 432Hz Discipline Flow)
    this.currentTrack = {
      id: 'default_focus',
      title: 'Cymatic Deep Focus Alpha Wave (432Hz)',
      artist: 'Cymatic Sound Sanctuary',
      platform: 'focus_ambient',
      query: '432Hz binaural focus'
    };
  }

  public subscribe(listener: (track: MediaTrack | null, isPlaying: boolean, isVisible: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentTrack, this.isPlaying, this.isVisible);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentTrack, this.isPlaying, this.isVisible));
  }

  public playTrack(query: string, platform: StreamingPlatform = 'youtube', customTitle?: string) {
    const cleanQuery = query.trim();
    let embedUrl = '';

    if (platform === 'youtube') {
      // Embedded YouTube search embed that plays directly inside iframe without external app
      embedUrl = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(cleanQuery)}&autoplay=1`;
    } else if (platform === 'spotify') {
      // Embedded Spotify search widget
      embedUrl = `https://open.spotify.com/embed/search/${encodeURIComponent(cleanQuery)}`;
    } else if (platform === 'deezer') {
      // Embedded Deezer widget
      embedUrl = `https://widget.deezer.com/widget/auto/search/${encodeURIComponent(cleanQuery)}`;
    }

    this.currentTrack = {
      id: `track_${Date.now()}`,
      title: customTitle || cleanQuery,
      artist: platform.toUpperCase(),
      platform,
      query: cleanQuery,
      embedUrl
    };

    this.isPlaying = true;
    this.isVisible = true;
    this.notify();
  }

  public playLocalAudioFile(file: File) {
    const blobUrl = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, '');

    this.currentTrack = {
      id: `local_${Date.now()}`,
      title,
      artist: 'Device Storage',
      platform: 'local',
      query: title,
      audioBlobUrl: blobUrl
    };

    this.isPlaying = true;
    this.isVisible = true;
    this.notify();
  }

  public setPlaying(playing: boolean) {
    this.isPlaying = playing;
    this.notify();
  }

  public setVisible(visible: boolean) {
    this.isVisible = visible;
    this.notify();
  }

  public close() {
    this.isPlaying = false;
    this.isVisible = false;
    this.notify();
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

export const InAppMediaService = new InAppMediaEngine();
