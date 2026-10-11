/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama Voice Listening & Continuous Wake Word Engine
 * Explicitly supports continuous background listening for 'Hi Rama', 'Hello Rama', 'Open display',
 * and seamlessly activates UI hubs without requiring manual triggers.
 */

export interface RamaVoiceState {
  isListening: boolean;
  isSupported: boolean;
  wakeWordDetected: boolean;
  lastWakeWord: string | null;
  transcript: string;
  isSpeaking: boolean;
  continuousMode: boolean;
}

class RamaVoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSupported: boolean = false;
  private continuousMode: boolean = true;
  private autoRestart: boolean = true;
  private transcript: string = '';
  private isSpeaking: boolean = false;
  private lastWakeWord: string | null = null;
  private lastWakeWordTime: number = 0;
  private restartTimer: any = null;
  private listeners: Set<(state: RamaVoiceState) => void> = new Set();
  private wakeWordCallbacks: Set<(wakeWord: string) => void> = new Set();
  private commandCallbacks: Set<(command: string) => void> = new Set();
  private isProcessingCommand: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.isListening = true;
        this.notify();
      };

      rec.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        const candidateText = (finalText || interimText).trim();
        this.transcript = candidateText;

        // Check for defined wake words in real-time (both interim and final for zero delay)
        const matchedWakeWord = this.detectWakeWord(candidateText);
        if (matchedWakeWord) {
          this.activateUIHub(matchedWakeWord, candidateText);
        } else if (finalText && this.isProcessingCommand) {
          this.handleFinalCommand(finalText.trim());
        }

        this.notify();
      };

      rec.onerror = (event: any) => {
        const error = event.error;
        // Non-fatal errors in continuous mode (silence, normal pause, etc.)
        if (error === 'no-speech' || error === 'audio-capture') {
          return;
        }

        if (error === 'not-allowed') {
          console.warn('[RamaVoice] Microphone permission not allowed.');
          this.autoRestart = false;
          this.isListening = false;
          this.notify();
          return;
        }

        console.warn('[RamaVoice] Recognition event warning:', error);
      };

      rec.onend = () => {
        this.isListening = false;
        this.notify();

        // Continuous listening auto-restart mechanism
        if (this.autoRestart && this.continuousMode) {
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.autoRestart && !this.isListening) {
              try {
                rec.start();
              } catch (e) {
                // Secondary retry if audio hardware was temporarily busy
                setTimeout(() => {
                  if (this.autoRestart && !this.isListening) {
                    try { rec.start(); } catch (_) {}
                  }
                }, 300);
              }
            }
          }, 150);
        }
      };

      this.recognition = rec;
    } catch (e) {
      this.isSupported = false;
      console.warn('[RamaVoice] Speech recognition init failed:', e);
    }
  }

  /**
   * Detects the defined wake words: 'Hi Rama', 'Hello Rama', 'Open display'
   */
  private detectWakeWord(text: string): string | null {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Debounce to prevent multiple activations within 2.5 seconds
    const now = Date.now();
    if (now - this.lastWakeWordTime < 2500) {
      return null;
    }

    if (lower.includes('hi rama')) return 'Hi Rama';
    if (lower.includes('hello rama')) return 'Hello Rama';
    if (lower.includes('open display')) return 'Open display';
    if (lower.includes('hey rama')) return 'Hey Rama';
    if (lower.includes('open rama')) return 'Open Rama';
    if (lower.startsWith('rama ')) return 'Rama';

    return null;
  }

  /**
   * Activates UI hubs correctly without requiring manual triggers
   */
  public activateUIHub(wakeWord: string, fullTranscript: string = '') {
    this.lastWakeWordTime = Date.now();
    this.lastWakeWord = wakeWord;
    this.isProcessingCommand = true;

    console.log(`[RamaVoice] 🎙️ Wake word detected: "${wakeWord}". Activating UI hubs.`);

    // 1. Dispatch custom DOM events for universal app-wide activation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rama-activate-hub', {
          detail: { wakeWord, fullTranscript }
        })
      );
      window.dispatchEvent(
        new CustomEvent('rama-wake-word', {
          detail: { wakeWord, fullTranscript }
        })
      );
    }

    // 2. Fire registered callbacks
    this.wakeWordCallbacks.forEach((cb) => {
      try {
        cb(wakeWord);
      } catch (e) {
        console.error('[RamaVoice] Callback error:', e);
      }
    });

    // 3. Handle 'Open display' specific navigation intent
    const lower = fullTranscript.toLowerCase();
    if (wakeWord === 'Open display' || lower.includes('open display')) {
      if (lower.includes('prayer') || lower.includes('salah')) {
        window.location.hash = '#/prayer';
      } else if (lower.includes('calendar')) {
        window.location.hash = '#/calendar';
      } else if (lower.includes('task')) {
        window.location.hash = '#/tasks';
      } else if (lower.includes('makeover')) {
        window.location.hash = '#/makeover';
      } else {
        window.location.hash = '#/dashboard';
      }
    }

    // 4. Auditory voice acknowledgment
    this.speak('Rama online. Listening, Architect.');

    // 5. Extract trailing command if user said "Hi Rama, locate qibla" in one breath
    const stripped = lower
      .replace(/hi rama/g, '')
      .replace(/hello rama/g, '')
      .replace(/hey rama/g, '')
      .replace(/open display/g, '')
      .replace(/open rama/g, '')
      .replace(/^rama\s+/g, '')
      .trim();

    if (stripped.length > 2) {
      setTimeout(() => {
        this.commandCallbacks.forEach((cb) => cb(stripped));
        this.isProcessingCommand = false;
      }, 500);
    }

    this.notify();
  }

  private handleFinalCommand(text: string) {
    if (!text || text.length < 2) return;
    this.isProcessingCommand = false;
    this.commandCallbacks.forEach((cb) => cb(text));
  }

  /**
   * Start continuous background listening for wake words ('Hi Rama', 'Hello Rama', 'Open display')
   */
  public startContinuousListening() {
    if (!this.recognition || !this.isSupported) return;
    this.continuousMode = true;
    this.autoRestart = true;

    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.notify();
      } catch (e) {
        // Recognition might already be running
        this.isListening = true;
        this.notify();
      }
    }
  }

  public stopListening() {
    this.autoRestart = false;
    this.continuousMode = false;
    clearTimeout(this.restartTimer);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.transcript = '';
    this.notify();
  }

  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      this.startContinuousListening();
      return true;
    }
  }

  public onWakeWord(callback: (wakeWord: string) => void): () => void {
    this.wakeWordCallbacks.add(callback);
    return () => {
      this.wakeWordCallbacks.delete(callback);
    };
  }

  public onCommand(callback: (command: string) => void): () => void {
    this.commandCallbacks.add(callback);
    return () => {
      this.commandCallbacks.delete(callback);
    };
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.98;
        utterance.volume = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Daniel') ||
              v.name.includes('Alex'))
        );
        if (preferred) utterance.voice = preferred;

        this.isSpeaking = true;
        this.notify();

        utterance.onend = () => {
          this.isSpeaking = false;
          this.notify();
          resolve();
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          this.notify();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        this.isSpeaking = false;
        this.notify();
        resolve();
      }
    });
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.notify();
  }

  public getState(): RamaVoiceState {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported,
      wakeWordDetected: false,
      lastWakeWord: this.lastWakeWord,
      transcript: this.transcript,
      isSpeaking: this.isSpeaking,
      continuousMode: this.continuousMode
    };
  }

  public subscribe(listener: (state: RamaVoiceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((cb) => cb(s));
  }
}

export const RamaVoice = new RamaVoiceEngine();
