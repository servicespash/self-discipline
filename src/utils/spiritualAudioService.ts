/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Spiritual Audio & Authentic Adhan Synthesizer Engine
 * High-fidelity Web Audio API sound generator & audio stream engine for Adhan, Church Bells, and Chimes.
 */

export type SpiritualAudioType = 
  | 'adhan_makkah' 
  | 'adhan_short' 
  | 'adhan_full_session'
  | 'church_bell' 
  | 'contemplative_bowl' 
  | 'sacred_harp' 
  | 'digital_alarm';

export interface RingtoneOption {
  id: SpiritualAudioType;
  label: string;
  category: 'islamic' | 'christian' | 'neutral';
  description: string;
}

export const RINGTONE_OPTIONS: RingtoneOption[] = [
  {
    id: 'adhan_makkah',
    label: 'Real Adhan Session (Makkah Haram)',
    category: 'islamic',
    description: 'Authentic melodic call to prayer echoing the Holy Mosque of Makkah.'
  },
  {
    id: 'adhan_full_session',
    label: 'Complete Adhan Recitation (Full Session)',
    category: 'islamic',
    description: 'Full canonical Adhan session with all phrases in Maqam Bayati.'
  },
  {
    id: 'adhan_short',
    label: 'Adhan Takbir Call (Opening Motif)',
    category: 'islamic',
    description: 'Opening double Takbir (Allahu Akbar) with sacred sanctuary reverberation.'
  },
  {
    id: 'church_bell',
    label: 'Cathedral Bell (Canonical Watch)',
    category: 'christian',
    description: 'Deep resonant bronze church bell with authentic overtone ring-out.'
  },
  {
    id: 'sacred_harp',
    label: 'Sacred Harp & Divine Arpeggio',
    category: 'christian',
    description: 'Peaceful celestial chord sequence for prayer watches.'
  },
  {
    id: 'contemplative_bowl',
    label: 'Singing Bowl & Serenity Chime',
    category: 'neutral',
    description: 'Harmonic 432Hz meditative bell for contemplative stillness.'
  },
  {
    id: 'digital_alarm',
    label: 'High-Alert Modern Chime',
    category: 'neutral',
    description: 'Precise acoustic discipline alert tone.'
  }
];

export interface AdhanPhrase {
  arabic: string;
  transliteration: string;
  meaning: string;
  startSec: number;
  durationSec: number;
}

export const ADHAN_FULL_PHRASES: AdhanPhrase[] = [
  {
    arabic: 'الله أكبر الله أكبر',
    transliteration: 'Allahu Akbar, Allahu Akbar',
    meaning: 'God is the Greatest (x2)',
    startSec: 0,
    durationSec: 6.5
  },
  {
    arabic: 'الله أكبر الله أكبر',
    transliteration: 'Allahu Akbar, Allahu Akbar',
    meaning: 'God is the Greatest (x2)',
    startSec: 6.5,
    durationSec: 6.5
  },
  {
    arabic: 'أشهد أن لا إله إلا الله',
    transliteration: 'Ashhadu an la ilaha illa Allah',
    meaning: 'I bear witness that there is no deity worthy of worship except God',
    startSec: 13,
    durationSec: 7.0
  },
  {
    arabic: 'أشهد أن لا إله إلا الله',
    transliteration: 'Ashhadu an la ilaha illa Allah',
    meaning: 'I bear witness that there is no deity worthy of worship except God',
    startSec: 20,
    durationSec: 7.0
  },
  {
    arabic: 'أشهد أن محمدا رسول الله',
    transliteration: 'Ashhadu anna Muhammadan Rasulullah',
    meaning: 'I bear witness that Muhammad is the Messenger of God',
    startSec: 27,
    durationSec: 7.5
  },
  {
    arabic: 'أشهد أن محمدا رسول الله',
    transliteration: 'Ashhadu anna Muhammadan Rasulullah',
    meaning: 'I bear witness that Muhammad is the Messenger of God',
    startSec: 34.5,
    durationSec: 7.5
  },
  {
    arabic: 'حي على الصلاة',
    transliteration: "Hayya 'ala-s-Salah",
    meaning: 'Hasten to Prayer',
    startSec: 42,
    durationSec: 7.0
  },
  {
    arabic: 'حي على الصلاة',
    transliteration: "Hayya 'ala-s-Salah",
    meaning: 'Hasten to Prayer',
    startSec: 49,
    durationSec: 7.0
  },
  {
    arabic: 'حي على الفلاح',
    transliteration: "Hayya 'ala-l-Falah",
    meaning: 'Hasten to Success and Salvation',
    startSec: 56,
    durationSec: 7.0
  },
  {
    arabic: 'حي على الفلاح',
    transliteration: "Hayya 'ala-l-Falah",
    meaning: 'Hasten to Success and Salvation',
    startSec: 63,
    durationSec: 7.0
  },
  {
    arabic: 'الله أكبر الله أكبر',
    transliteration: 'Allahu Akbar, Allahu Akbar',
    meaning: 'God is the Greatest (x2)',
    startSec: 70,
    durationSec: 6.5
  },
  {
    arabic: 'لا إله إلا الله',
    transliteration: 'La ilaha illa Allah',
    meaning: 'There is no deity worthy of worship except God',
    startSec: 76.5,
    durationSec: 8.5
  }
];

// Open-source Adhan audio URLs for genuine recording playback with fallback
const AUTHENTIC_ADHAN_STREAMS = [
  'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/athan1.mp3',
  'https://archive.org/download/AsrAzanFromMakkah/Asr_Azan_from_Makkah.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/8/87/Beautiful_adhan.ogg'
];

class SpiritualAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private isPlaying: boolean = false;
  private audioElement: HTMLAudioElement | null = null;
  private currentPhraseIndex: number = 0;
  private phraseTimer: any = null;
  private stateChangeListeners: Set<(isPlaying: boolean, currentPhrase?: AdhanPhrase | null) => void> = new Set();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public async unlock(): Promise<boolean> {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      return true;
    } catch {
      return false;
    }
  }

  public subscribe(listener: (isPlaying: boolean, currentPhrase?: AdhanPhrase | null) => void) {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  private notify(currentPhrase: AdhanPhrase | null = null) {
    this.stateChangeListeners.forEach(fn => fn(this.isPlaying, currentPhrase));
  }

  public stopAll() {
    this.isPlaying = false;
    this.currentPhraseIndex = 0;
    if (this.phraseTimer) {
      clearInterval(this.phraseTimer);
      this.phraseTimer = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        // Safe catch
      }
      this.audioElement = null;
    }

    this.activeNodes.forEach(node => {
      try {
        if (typeof node === 'number') {
          clearTimeout(node);
        } else if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        } else if ('disconnect' in node && typeof (node as any).disconnect === 'function') {
          (node as any).disconnect();
        }
      } catch (e) {
        // Safe cleanup
      }
    });
    this.activeNodes = [];
    this.notify(null);
  }

  // Play specified spiritual tone
  public async play(type: SpiritualAudioType, volume: number = 0.85): Promise<void> {
    this.stopAll();
    this.isPlaying = true;

    if (type === 'adhan_makkah' || type === 'adhan_full_session') {
      // Attempt authentic recording stream first; fallback to high-fidelity synthesizer
      const streamSuccess = await this.playAuthenticAdhanStream(volume, type === 'adhan_full_session');
      if (!streamSuccess) {
        const ctx = this.getContext();
        this.synthesizeFullAdhan(ctx, volume);
      }
      return;
    }

    const ctx = this.getContext();

    switch (type) {
      case 'adhan_short':
        this.synthesizeTakbirMotif(ctx, volume);
        break;
      case 'church_bell':
        this.synthesizeChurchBell(ctx, volume);
        break;
      case 'contemplative_bowl':
        this.synthesizeSingingBowl(ctx, volume);
        break;
      case 'sacred_harp':
        this.synthesizeSacredHarp(ctx, volume);
        break;
      case 'digital_alarm':
        this.synthesizeDigitalAlarm(ctx, volume);
        break;
      default:
        this.synthesizeFullAdhan(ctx, volume);
    }
  }

  // Plays authentic recorded Adhan audio stream with progressive fallback
  private playAuthenticAdhanStream(volume: number, isFullSession: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      let streamIdx = 0;

      const tryStream = () => {
        if (streamIdx >= AUTHENTIC_ADHAN_STREAMS.length) {
          resolve(false);
          return;
        }

        const url = AUTHENTIC_ADHAN_STREAMS[streamIdx];
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.src = url;

        this.audioElement = audio;

        let resolved = false;

        audio.onplay = () => {
          if (!resolved) {
            resolved = true;
            this.startPhraseTracker();
            resolve(true);
          }
        };

        audio.onended = () => {
          this.stopAll();
        };

        audio.onerror = () => {
          if (!resolved) {
            streamIdx++;
            tryStream();
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (!resolved) {
              streamIdx++;
              tryStream();
            }
          });
        }

        // Safety timeout: if stream takes more than 3 seconds to buffer, switch to synthesis
        const timeoutId = window.setTimeout(() => {
          if (!resolved && !audio.currentTime) {
            resolved = true;
            try { audio.pause(); } catch (e) {}
            this.audioElement = null;
            resolve(false);
          }
        }, 3000);
        this.activeNodes.push(timeoutId);
      };

      tryStream();
    });
  }

  private startPhraseTracker() {
    let currentIdx = 0;
    this.notify(ADHAN_FULL_PHRASES[0]);

    this.phraseTimer = setInterval(() => {
      if (!this.isPlaying) return;

      const timePassed = this.audioElement ? this.audioElement.currentTime : currentIdx * 7;
      const foundIdx = ADHAN_FULL_PHRASES.findIndex(p => timePassed >= p.startSec && timePassed < (p.startSec + p.durationSec));

      if (foundIdx !== -1 && foundIdx !== currentIdx) {
        currentIdx = foundIdx;
        this.notify(ADHAN_FULL_PHRASES[foundIdx]);
      }
    }, 500);
  }

  // Synthesize Melodic Adhan Motif (Allahu Akbar, Allahu Akbar...)
  private synthesizeFullAdhan(ctx: AudioContext, masterVol: number) {
    this.notify(ADHAN_FULL_PHRASES[0]);

    // Allahu Akbar motif notes
    const notes = [
      { freq: 293.66, dur: 1.4 }, // Al-
      { freq: 392.00, dur: 2.2 }, // la--
      { freq: 349.23, dur: 1.2 }, // hu
      { freq: 311.13, dur: 1.8 }, // Ak-
      { freq: 293.66, dur: 2.8 }, // baaar
      { freq: 0, dur: 0.6 },
      { freq: 293.66, dur: 1.4 }, // Al-
      { freq: 392.00, dur: 2.2 }, // la--
      { freq: 349.23, dur: 1.2 }, // hu
      { freq: 311.13, dur: 1.8 }, // Ak-
      { freq: 293.66, dur: 3.5 }, // baaar
      { freq: 0, dur: 0.8 },
      // Ashhadu an la ilaha illa Allah
      { freq: 349.23, dur: 1.8 },
      { freq: 392.00, dur: 2.5 },
      { freq: 349.23, dur: 1.6 },
      { freq: 293.66, dur: 3.8 }
    ];

    let startTime = ctx.currentTime + 0.05;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol * 0.9, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach((item) => {
      if (item.freq > 0) {
        this.playVocalFormantNote(ctx, item.freq, startTime, item.dur, masterGain);
      }
      startTime += item.dur;
    });

    const finishTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.notify(null);
    }, (startTime - ctx.currentTime) * 1000);
    this.activeNodes.push(finishTimeout);
  }

  // Synthesize Opening Takbir Motif (Allahu Akbar!)
  private synthesizeTakbirMotif(ctx: AudioContext, masterVol: number) {
    this.notify(ADHAN_FULL_PHRASES[0]);

    const notes = [
      { freq: 293.66, dur: 1.2 }, // Al-
      { freq: 392.00, dur: 1.8 }, // la--
      { freq: 349.23, dur: 1.0 }, // hu
      { freq: 311.13, dur: 1.4 }, // Ak-
      { freq: 293.66, dur: 2.6 }  // baaar
    ];

    let startTime = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach((item) => {
      this.playVocalFormantNote(ctx, item.freq, startTime, item.dur, masterGain);
      startTime += item.dur;
    });

    const finishTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.notify(null);
    }, (startTime - ctx.currentTime) * 1000);
    this.activeNodes.push(finishTimeout);
  }

  // Formant filter synthesis that models human vocal chanting harmonics
  private playVocalFormantNote(
    ctx: AudioContext,
    fundamental: number,
    startTime: number,
    duration: number,
    destination: AudioNode
  ) {
    const harmonics = [1, 2, 3, 4, 5];
    const harmonicWeights = [0.6, 0.45, 0.3, 0.15, 0.08];

    const formantFilter1 = ctx.createBiquadFilter();
    formantFilter1.type = 'bandpass';
    formantFilter1.frequency.setValueAtTime(750, startTime);
    formantFilter1.Q.setValueAtTime(4.5, startTime);

    const formantFilter2 = ctx.createBiquadFilter();
    formantFilter2.type = 'bandpass';
    formantFilter2.frequency.setValueAtTime(1220, startTime);
    formantFilter2.Q.setValueAtTime(4.0, startTime);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.35, startTime + 0.35);
    noteGain.gain.setValueAtTime(0.32, startTime + duration - 0.4);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    formantFilter1.connect(noteGain);
    formantFilter2.connect(noteGain);
    noteGain.connect(destination);

    const vibrato = ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.2, startTime);
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(3.5, startTime);
    vibrato.connect(vibratoGain);

    harmonics.forEach((h, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(fundamental * h, startTime);
      vibratoGain.connect(osc.frequency);

      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime(harmonicWeights[index], startTime);

      osc.connect(hGain);
      hGain.connect(formantFilter1);
      hGain.connect(formantFilter2);

      osc.start(startTime);
      osc.stop(startTime + duration);
      this.activeNodes.push(osc);
    });

    vibrato.start(startTime);
    vibrato.stop(startTime + duration);
    this.activeNodes.push(vibrato);
  }

  // Synthesize Cathedral Bronze Church Bell
  private synthesizeChurchBell(ctx: AudioContext, masterVol: number) {
    const strikeTime = ctx.currentTime + 0.05;
    const partials = [
      { ratio: 0.5, amp: 0.8, decay: 7.0 },  // Hum
      { ratio: 1.0, amp: 1.0, decay: 6.0 },  // Prime
      { ratio: 1.18, amp: 0.6, decay: 5.0 }, // Tierce (minor 3rd)
      { ratio: 1.5, amp: 0.7, decay: 4.5 },  // Quint (5th)
      { ratio: 2.0, amp: 0.5, decay: 3.5 },  // Nominal
      { ratio: 2.74, amp: 0.3, decay: 2.5 }, // Supernominal
      { ratio: 3.0, amp: 0.2, decay: 1.8 }
    ];

    const fundamental = 220; // A3 deep bronze bell

    const bellMaster = ctx.createGain();
    bellMaster.gain.setValueAtTime(masterVol * 0.9, strikeTime);
    bellMaster.connect(ctx.destination);

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.ratio, strikeTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(p.amp * 0.3, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + p.decay);

      osc.connect(gain);
      gain.connect(bellMaster);

      osc.start(strikeTime);
      osc.stop(strikeTime + p.decay + 0.1);
      this.activeNodes.push(osc);
    });

    // Repeating secondary chime
    const secondStrike = window.setTimeout(() => {
      if (this.isPlaying) {
        this.playSingleBellStrike(ctx, fundamental, masterVol * 0.7);
      }
    }, 2800);
    this.activeNodes.push(secondStrike);

    const finishTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.notify(null);
    }, 7500);
    this.activeNodes.push(finishTimeout);
  }

  private playSingleBellStrike(ctx: AudioContext, fundamental: number, vol: number) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(fundamental, t);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 4.6);
    this.activeNodes.push(osc);
  }

  // Synthesize 432Hz Tibetan Singing Bowl
  private synthesizeSingingBowl(ctx: AudioContext, masterVol: number) {
    const now = ctx.currentTime + 0.05;
    const freqs = [432, 864, 1296, 2160];
    const weights = [0.6, 0.3, 0.15, 0.05];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(weights[idx] * 0.5, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 6.2);
      this.activeNodes.push(osc);
    });

    const finishTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.notify(null);
    }, 6500);
    this.activeNodes.push(finishTimeout);
  }

  // Synthesize Sacred Harp Chords
  private synthesizeSacredHarp(ctx: AudioContext, masterVol: number) {
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25];
    let time = ctx.currentTime + 0.05;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.0);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 3.1);
      this.activeNodes.push(osc);

      time += 0.25;
    });

    const finishTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.notify(null);
    }, 4500);
    this.activeNodes.push(finishTimeout);
  }

  // Synthesize Digital Discipline Alarm
  private synthesizeDigitalAlarm(ctx: AudioContext, masterVol: number) {
    let time = ctx.currentTime + 0.05;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.setValueAtTime(0, time + 0.12);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.15);
      this.activeNodes.push(osc);

      time += 0.22;
    }

    const finishTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.notify(null);
    }, 1200);
    this.activeNodes.push(finishTimeout);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const SpiritualAudio = new SpiritualAudioEngine();
