/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Decoupled Rama AI Voice & Wake-Word Service Engine
 * Anti-Flicker Architecture: Eliminates rapid mic indicator toggling and silence restart loops.
 * Respects user activation, handles ambient noise cleanly, and prevents unprompted background mic restarts.
 */

import { DisciplineBridge } from '../DisciplineBridge';

export interface RamaVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  wakeWordDetected: boolean;
  micSensitivity: number; // 0.0 to 1.0 VAD threshold
  statusText?: string;
}

class RamaVoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private isRestarting: boolean = false;
  private shouldBeListening: boolean = false;
  private restartTimer: any = null;
  private consecutiveErrors: number = 0;
  private transcript: string = '';
  private stateListeners: Set<(state: RamaVoiceState) => void> = new Set();
  private commandListeners: Set<(command: string) => void> = new Set();
  private wakeWordListeners: Set<(wakeWord: string) => void> = new Set();

  private wakeWords: string[] = ['hey rama', 'hi rama', 'hey discipline', 'rama'];

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[RamaVoice] Speech Recognition API not supported in browser environment.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.isRestarting = false;
        this.consecutiveErrors = 0;
        this.notifyState();
      };
      
      // Removed automatic recognition.start() here if it existed, 
      // ensuring control is only via startListening()


      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const fullText = (finalTranscript || interimTranscript).trim();
        if (fullText) {
          this.transcript = fullText;
          this.notifyState();

          // Check Wake Word Detection
          const lower = fullText.toLowerCase();
          for (const kw of this.wakeWords) {
            if (lower.includes(kw)) {
              this.notifyWakeWord(kw);
              const cleanCommand = lower.replace(kw, '').trim();
              if (cleanCommand.length > 2) {
                this.notifyCommand(cleanCommand);
              }
              break;
            }
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        const err = event.error;
        if (err === 'no-speech') {
          // Normal environmental silence - do not treat as fatal or force aggressive restart
          return;
        }

        if (err === 'aborted') {
          // Deliberate abort / user action
          return;
        }

        console.warn('[RamaVoice] Speech recognition notice:', err);
        this.consecutiveErrors++;

        // Back off if multiple errors occur (e.g. mic permission denied, audio capture issue)
        if (this.consecutiveErrors > 3) {
          console.warn('[RamaVoice] Pausing voice restart due to repeated capture errors.');
          this.shouldBeListening = false;
          this.isListening = false;
          this.isRestarting = false;
          this.notifyState();
        }
      };

      this.recognition.onend = () => {
        // If user intentionally stopped listening, turn off cleanly
        if (!this.shouldBeListening) {
          this.isListening = false;
          this.isRestarting = false;
          clearTimeout(this.restartTimer);
          this.notifyState();
          return;
        }

        // If continuous mode is enabled, keep listening state active in UI to prevent flickering
        // and restart with a calm, debounced backoff
        this.scheduleCalmRestart();
      };
    } catch (err) {
      console.warn('[RamaVoice] Speech recognition initialization notice:', err);
    }
  }

  private scheduleCalmRestart() {
    if (!this.shouldBeListening) return;
    if (this.isRestarting) return;

    this.isRestarting = true;
    clearTimeout(this.restartTimer);

    // Calm 3000ms debounce: eliminates rapid mic on/off flickering caused by browser silence timeouts
    const delay = Math.min(3000 + this.consecutiveErrors * 500, 5000);

    this.restartTimer = setTimeout(() => {
      // Robust check: ensure we really should be listening AND the recognition isn't already active
      if (this.shouldBeListening && this.recognition && !this.isListening) {
        try {
          this.recognition.start();
        } catch (e: any) {
          // If already started or browser in transition, safe catch
          if (e.name !== 'InvalidStateError') {
            this.consecutiveErrors++;
          }
        }
      }
      this.isRestarting = false;
    }, delay);
  }

  public async startListening() {
    // Check with bridge middleware if mic is allowed
    if (!DisciplineBridge.isMicrophoneAllowed()) {
      console.warn('[RamaVoice] Microphone access blocked by DisciplineBridge');
      return;
    }

    // Audit: Check hardware permission status before activating audio context
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        DisciplineBridge.setMicrophoneActive(true);
      } catch (e) {
        console.warn('[RamaVoice] Hardware microphone access denied:', e);
        return;
      }
    }

    this.shouldBeListening = true;
    this.consecutiveErrors = 0;
    clearTimeout(this.restartTimer);

    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e: any) {
        if (e.name !== 'InvalidStateError') {
          console.warn('[RamaVoice] Start listening notice:', e.message);
        }
      }
    } else {
      this.isListening = true;
      this.notifyState();
    }
  }

  public startContinuousListening() {
    this.startListening();
  }

  public stopContinuousListening() {
    this.stopListening();
  }

  public stopListening() {
    this.shouldBeListening = false;
    this.isListening = false;
    this.isRestarting = false;
    this.consecutiveErrors = 0;
    clearTimeout(this.restartTimer);
    DisciplineBridge.setMicrophoneActive(false);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Safe catch
      }
    }
    this.notifyState();
  }

  public toggleListening() {
    if (this.isListening || this.shouldBeListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const cleanText = text.replace(/[*_#`[\]()]/g, '').trim();
    window.speechSynthesis.cancel(); // Cancel ongoing speech
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notifyState();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notifyState();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.notifyState();
    };

    window.speechSynthesis.speak(utterance);
  }

  public getState(): RamaVoiceState {
    return {
      // Correctly reflect both intentional and automatic listening status
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      transcript: this.transcript,
      wakeWordDetected: false,
      micSensitivity: 0.8,
      statusText: this.isListening ? 'Listening' : (this.shouldBeListening ? 'Monitoring (Standby)' : 'Standby')
    };
  }

  public subscribe(listener: (state: RamaVoiceState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onCommand(listener: (command: string) => void): () => void {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  public onWakeWord(listener: (wakeWord: string) => void): () => void {
    this.wakeWordListeners.add(listener);
    return () => {
      this.wakeWordListeners.delete(listener);
    };
  }

  private notifyState() {
    const st = this.getState();
    this.stateListeners.forEach(fn => fn(st));
  }

  private notifyCommand(cmd: string) {
    this.commandListeners.forEach(fn => fn(cmd));
  }

  private notifyWakeWord(kw: string) {
    this.wakeWordListeners.forEach(fn => fn(kw));
  }

  public triggerCommand(cmd: string) {
    this.notifyCommand(cmd);
  }
}

export const RamaVoice = new RamaVoiceEngine();
