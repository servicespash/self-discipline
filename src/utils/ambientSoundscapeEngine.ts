/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ambient Soundscapes Engine for Cymatic Discipline OS
 * Pure Web Audio API high-fidelity offline synthesizer:
 * 1. White Noise, Pink Noise (Natural Rain), Brown Noise (Deep Cabin/Ocean)
 * 2. True Stereo Binaural Beats (Alpha 10Hz Flow, Theta 6Hz Meditation, Gamma 40Hz Focus)
 * 3. Zen Temple Sounds (Tibetan Singing Bowls, Bronze Bell Chimes, Harmonic Meditation Drone)
 */

export type AmbientSoundscapeCategory = 'white_noise' | 'binaural_beats' | 'zen_temple';

export type AmbientSoundscapePresetId =
  | 'white_crisp'
  | 'pink_rain'
  | 'brown_cabin'
  | 'binaural_alpha'
  | 'binaural_theta'
  | 'binaural_gamma'
  | 'zen_bowls'
  | 'zen_bell'
  | 'zen_stream';

export interface AmbientPreset {
  id: AmbientSoundscapePresetId;
  name: string;
  category: AmbientSoundscapeCategory;
  description: string;
  benefits: string;
  tagline: string;
  frequencyLabel?: string;
}

export const AMBIENT_PRESETS: Record<AmbientSoundscapePresetId, AmbientPreset> = {
  white_crisp: {
    id: 'white_crisp',
    name: 'Crisp White Noise',
    category: 'white_noise',
    description: 'Flat-spectrum acoustic blanket masking background voices, phone chimes, and sudden clicks.',
    benefits: 'Distraction shielding & office privacy',
    tagline: 'Equal energy across all audio spectrums'
  },
  pink_rain: {
    id: 'pink_rain',
    name: 'Pink Rain & Waterfall',
    category: 'white_noise',
    description: 'Natural 1/f spectral decay mimicking gentle rainfall, leaf rustle, and waterfall resonance.',
    benefits: 'Deep cognitive endurance & steady reading focus',
    tagline: 'Balanced natural acoustics'
  },
  brown_cabin: {
    id: 'brown_cabin',
    name: 'Deep Brown Noise',
    category: 'white_noise',
    description: 'Heavy low-frequency rumble reminiscent of an airplane cabin, distant thunder, or rolling ocean surf.',
    benefits: 'High anxiety relief & ADHD flow state induction',
    tagline: 'Deep low-end restorative hum'
  },
  binaural_alpha: {
    id: 'binaural_alpha',
    name: 'Alpha Waves (10 Hz)',
    category: 'binaural_beats',
    description: 'Stereo beat induction with 210 Hz left / 220 Hz right channels. Stimulates 10 Hz alpha brainwaves.',
    benefits: 'Relaxed alertness, writing flow & coding sprint',
    tagline: 'Flow State & Relaxed Concentration',
    frequencyLabel: '10 Hz Difference'
  },
  binaural_theta: {
    id: 'binaural_theta',
    name: 'Theta Waves (6 Hz)',
    category: 'binaural_beats',
    description: 'Stereo beat induction with 180 Hz left / 186 Hz right channels. Stimulates 6 Hz theta brainwaves.',
    benefits: 'Creative ideation, introspection & deep mental rest',
    tagline: 'Deep Meditation & Architecture Design',
    frequencyLabel: '6 Hz Difference'
  },
  binaural_gamma: {
    id: 'binaural_gamma',
    name: 'Gamma Waves (40 Hz)',
    category: 'binaural_beats',
    description: 'Stereo beat induction with 200 Hz left / 240 Hz right channels. Stimulates 40 Hz gamma brainwaves.',
    benefits: 'High-speed problem solving, logic analysis & recall',
    tagline: 'Peak Cognitive Synthesis & Intensity',
    frequencyLabel: '40 Hz Difference'
  },
  zen_bowls: {
    id: 'zen_bowls',
    name: 'Tibetan Singing Bowls',
    category: 'zen_temple',
    description: 'Multi-harmonic additive synthesis with non-harmonic overtones (432 Hz base, 1192 Hz, 2332 Hz) with natural decay.',
    benefits: 'Stress neutralization, centering & conscious breathing',
    tagline: '432 Hz Resonant Metal Harmonics'
  },
  zen_bell: {
    id: 'zen_bell',
    name: 'Temple Bronze Bell',
    category: 'zen_temple',
    description: 'Periodic bronze temple chime strikes with authentic long-tail exponential ringdown and warm sub-bass tanpura bed.',
    benefits: 'Session milestone pacing & mindful presence',
    tagline: 'Deep Temple Chime & Bronze Overtones'
  },
  zen_stream: {
    id: 'zen_stream',
    name: 'Zen Garden & Singing Bowl',
    category: 'zen_temple',
    description: 'Soft babbling brook acoustics blended with meditative singing bowl drones and gentle wind chimes.',
    benefits: 'Clarity of intention & uninterrupted deep work',
    tagline: 'Continuous Meditative Drone & Chimes'
  }
};

export interface AmbientSoundscapeState {
  isPlaying: boolean;
  activePresetId: AmbientSoundscapePresetId | null;
  category: AmbientSoundscapeCategory | null;
  volume: number; // 0.0 to 1.0
  timerMinutes: number | null; // null = continuous
  timeRemainingSeconds: number;
}

class AmbientSoundscapeEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSources: { stop: () => void }[] = [];
  private bellIntervalId: any = null;
  private sessionTimerId: any = null;

  private state: AmbientSoundscapeState = {
    isPlaying: false,
    activePresetId: 'binaural_alpha',
    category: 'binaural_beats',
    volume: 0.75,
    timerMinutes: 25, // default 25 min Pomodoro
    timeRemainingSeconds: 25 * 60
  };

  private listeners: Set<(state: AmbientSoundscapeState) => void> = new Set();

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(e => console.warn('[AmbientSoundscape] AudioContext resume error:', e));
    }

    if (!this.masterGain) {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.state.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }

    return this.audioCtx;
  }

  public subscribe(listener: (state: AmbientSoundscapeState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.state }));
  }

  public getState(): AmbientSoundscapeState {
    return { ...this.state };
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.state.volume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.05);
    }
    this.notify();
  }

  public setTimer(minutes: number | null) {
    this.state.timerMinutes = minutes;
    this.state.timeRemainingSeconds = minutes ? minutes * 60 : 0;
    this.notify();
  }

  /**
   * Start or switch soundscape
   */
  public async playPreset(presetId: AmbientSoundscapePresetId) {
    const preset = AMBIENT_PRESETS[presetId];
    if (!preset) return;

    this.stopActiveAudio();
    const ctx = this.initAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.state.activePresetId = presetId;
    this.state.category = preset.category;
    this.state.isPlaying = true;

    // Reset remaining time if fresh start
    if (this.state.timerMinutes && this.state.timeRemainingSeconds <= 0) {
      this.state.timeRemainingSeconds = this.state.timerMinutes * 60;
    }

    try {
      if (preset.category === 'white_noise') {
        this.synthesizeNoise(presetId, ctx);
      } else if (preset.category === 'binaural_beats') {
        this.synthesizeBinauralBeats(presetId, ctx);
      } else if (preset.category === 'zen_temple') {
        this.synthesizeZenTemple(presetId, ctx);
      }
    } catch (err) {
      console.warn('[AmbientSoundscape] Synthesizer error:', err);
    }

    this.startSessionTimer();
    this.notify();
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      if (this.state.activePresetId) {
        this.playPreset(this.state.activePresetId);
      } else {
        this.playPreset('binaural_alpha');
      }
    }
  }

  public pause() {
    this.stopActiveAudio();
    this.stopSessionTimer();
    this.state.isPlaying = false;
    this.notify();
  }

  public stop() {
    this.stopActiveAudio();
    this.stopSessionTimer();
    this.state.isPlaying = false;
    if (this.state.timerMinutes) {
      this.state.timeRemainingSeconds = this.state.timerMinutes * 60;
    }
    this.notify();
  }

  private stopActiveAudio() {
    if (this.bellIntervalId) {
      clearInterval(this.bellIntervalId);
      this.bellIntervalId = null;
    }
    this.currentSources.forEach(s => {
      try {
        s.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    this.currentSources = [];
  }

  private startSessionTimer() {
    this.stopSessionTimer();
    if (!this.state.timerMinutes) return;

    this.sessionTimerId = setInterval(() => {
      if (this.state.timeRemainingSeconds > 0) {
        this.state.timeRemainingSeconds -= 1;
        this.notify();
      } else {
        // Timer completed - gentle fade out
        this.stop();
      }
    }, 1000);
  }

  private stopSessionTimer() {
    if (this.sessionTimerId) {
      clearInterval(this.sessionTimerId);
      this.sessionTimerId = null;
    }
  }

  /**
   * 1. Noise Synthesizer (White, Pink, Brown)
   */
  private synthesizeNoise(presetId: AmbientSoundscapePresetId, ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 5; // 5 second seamless stereo buffer
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.getChannelData(1);

    if (presetId === 'white_crisp') {
      for (let i = 0; i < bufferSize; i++) {
        leftData[i] = (Math.random() * 2 - 1) * 0.35;
        rightData[i] = (Math.random() * 2 - 1) * 0.35;
      }
    } else if (presetId === 'pink_rain') {
      // Pink noise using Paul Kellet's filtered white noise algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let rb0 = 0, rb1 = 0, rb2 = 0, rb3 = 0, rb4 = 0, rb5 = 0, rb6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + whiteL * 0.0555179;
        b1 = 0.99332 * b1 + whiteL * 0.0750759;
        b2 = 0.96900 * b2 + whiteL * 0.1538520;
        b3 = 0.86650 * b3 + whiteL * 0.3104856;
        b4 = 0.55000 * b4 + whiteL * 0.5329522;
        b5 = -0.7616 * b5 - whiteL * 0.0168980;
        leftData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteL * 0.5362) * 0.08;
        b6 = whiteL * 0.115926;

        const whiteR = Math.random() * 2 - 1;
        rb0 = 0.99886 * rb0 + whiteR * 0.0555179;
        rb1 = 0.99332 * rb1 + whiteR * 0.0750759;
        rb2 = 0.96900 * rb2 + whiteR * 0.1538520;
        rb3 = 0.86650 * rb3 + whiteR * 0.3104856;
        rb4 = 0.55000 * rb4 + whiteR * 0.5329522;
        rb5 = -0.7616 * rb5 - whiteR * 0.0168980;
        rightData[i] = (rb0 + rb1 + rb2 + rb3 + rb4 + rb5 + rb6 + whiteR * 0.5362) * 0.08;
        rb6 = whiteR * 0.115926;
      }
    } else {
      // Brown noise (integrated random walk)
      let lastL = 0.0;
      let lastR = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        lastL = (lastL + (0.02 * whiteL)) / 1.02;
        leftData[i] = lastL * 1.5;

        const whiteR = Math.random() * 2 - 1;
        lastR = (lastR + (0.02 * whiteR)) / 1.02;
        rightData[i] = lastR * 1.5;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Optional subtle lowpass filter to prevent digital harshness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = presetId === 'brown_cabin' ? 1200 : presetId === 'pink_rain' ? 6000 : 9500;

    noiseSource.connect(filter);
    filter.connect(this.masterGain!);
    noiseSource.start();

    this.currentSources.push({
      stop: () => {
        try {
          noiseSource.stop();
          noiseSource.disconnect();
          filter.disconnect();
        } catch (e) {}
      }
    });
  }

  /**
   * 2. Binaural Beats Synthesizer (True Stereo Separation)
   */
  private synthesizeBinauralBeats(presetId: AmbientSoundscapePresetId, ctx: AudioContext) {
    let baseFreq = 210;
    let beatDelta = 10; // Alpha 10 Hz

    if (presetId === 'binaural_theta') {
      baseFreq = 180;
      beatDelta = 6; // Theta 6 Hz
    } else if (presetId === 'binaural_gamma') {
      baseFreq = 200;
      beatDelta = 40; // Gamma 40 Hz
    }

    const freqLeft = baseFreq;
    const freqRight = baseFreq + beatDelta;

    // Stereo Channel Merger Node (Input 0 = Left, Input 1 = Right)
    const merger = ctx.createChannelMerger(2);

    // Left Ear Oscillator
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(freqLeft, ctx.currentTime);

    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.35, ctx.currentTime);
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0); // connect to Left channel

    // Right Ear Oscillator
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(freqRight, ctx.currentTime);

    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.35, ctx.currentTime);
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1); // connect to Right channel

    // Soft pink noise bed for comfort and natural ear acoustics
    const pinkBed = this.createSoftPinkNoiseNode(ctx, 0.04);

    merger.connect(this.masterGain!);

    oscLeft.start();
    oscRight.start();

    this.currentSources.push({
      stop: () => {
        try {
          oscLeft.stop();
          oscRight.stop();
          oscLeft.disconnect();
          oscRight.disconnect();
          gainLeft.disconnect();
          gainRight.disconnect();
          merger.disconnect();
          pinkBed.stop();
        } catch (e) {}
      }
    });
  }

  /**
   * 3. Zen Temple Sounds (Tibetan Singing Bowl, Bronze Bells & Garden Drone)
   */
  private synthesizeZenTemple(presetId: AmbientSoundscapePresetId, ctx: AudioContext) {
    // A. Warm sub-bass tanpura/drone foundation (432 Hz / 216 Hz / 108 Hz)
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(108, ctx.currentTime); // low warm root

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.18, ctx.currentTime);

    // Subtle LFO modulation for breathing sensation
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 second breath cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.06, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);

    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain!);
    droneOsc.start();
    lfo.start();

    // B. Initial Bell / Singing Bowl Strike immediately on play
    this.triggerBellStrike(presetId === 'zen_bowls' ? 432 : 360);

    // C. Periodic gentle temple chime strikes every 18 seconds
    this.bellIntervalId = setInterval(() => {
      if (this.state.isPlaying) {
        const pitch = presetId === 'zen_bell' ? (Math.random() > 0.5 ? 360 : 480) : 432;
        this.triggerBellStrike(pitch);
      }
    }, 18000);

    // D. Soft stream water whisper for zen_stream
    let streamNode: { stop: () => void } | null = null;
    if (presetId === 'zen_stream') {
      streamNode = this.createSoftPinkNoiseNode(ctx, 0.08);
    }

    this.currentSources.push({
      stop: () => {
        try {
          droneOsc.stop();
          lfo.stop();
          droneOsc.disconnect();
          droneGain.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
          if (streamNode) streamNode.stop();
        } catch (e) {}
      }
    });
  }

  /**
   * Triggers an authentic resonant singing bowl or temple bell chime strike
   */
  public triggerBellStrike(fundamental: number = 432) {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Bronze Bell Partial Ratios & relative amplitudes
    const partials = [
      { ratio: 1.0, gain: 0.45, decay: 9.0 },
      { ratio: 2.76, gain: 0.28, decay: 6.5 },
      { ratio: 5.40, gain: 0.16, decay: 4.0 },
      { ratio: 8.92, gain: 0.08, decay: 2.2 }
    ];

    partials.forEach(p => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);

      // Fast 3ms attack, followed by exponential ringdown
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(p.gain * this.state.volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    });
  }

  private createSoftPinkNoiseNode(ctx: AudioContext, gainAmount: number): { stop: () => void } {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.getChannelData(1);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * gainAmount;
      b6 = white * 0.115926;
      leftData[i] = pink;
      rightData[i] = pink;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, ctx.currentTime);

    src.connect(filter);
    filter.connect(this.masterGain!);
    src.start();

    return {
      stop: () => {
        try {
          src.stop();
          src.disconnect();
          filter.disconnect();
        } catch (e) {}
      }
    };
  }
}

export const AmbientSoundscape = new AmbientSoundscapeEngine();
