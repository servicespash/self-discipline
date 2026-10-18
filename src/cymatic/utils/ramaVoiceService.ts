// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Decoupled Rama AI Voice & Wake-Word Service Engine
 * Debounces speech recognition lifecycle to prevent rapid mic flickering.
 */

export interface RamaVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  wakeWordDetected: boolean;
  micSensitivity: number; // 0.0 to 1.0 VAD threshold
}

class RamaVoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private isRestarting: boolean = false;
  private restartTimer: any = null;
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

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.isRestarting = false;
      this.notifyState();
    };

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
      this.transcript = fullText;
      this.notifyState();

      // Unified wake-word detection (final results only, to avoid double-firing on interim text)
      if (!finalTranscript) return;
      const match = detectWakeWord(finalTranscript);
      if (match) {
        this.notifyWakeWord(match.phrase, match.target);
        if (match.command.length > 2) this.notifyCommand(match.command);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Normal silence timeouts—do NOT destroy session immediately
        return;
      }
      console.warn('[RamaVoice] Speech recognition error:', event.error);
      this.handleAutoRestart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.notifyState();
      if (this.shouldBeListening) {
        this.handleAutoRestart();
      }
    };
  }

  private shouldBeListening: boolean = false;

  private handleAutoRestart() {
    if (this.isRestarting) return;
    this.isRestarting = true;
    this.notifyState();
    clearTimeout(this.restartTimer);

    // Debounce restart by 800ms to eliminate mic indicator flickering
    this.restartTimer = setTimeout(() => {
      if (this.shouldBeListening && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Safe catch if already started
        }
      }
      this.isRestarting = false;
      this.notifyState();
    }, 800);
  }

  public startListening() {
    this.shouldBeListening = true;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        // Safe catch
      }
    }
  }

  public startContinuousListening() {
    this.startListening();
  }

  public stopListening() {
    this.shouldBeListening = false;
    this.isListening = false;
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
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancel ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
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

    window.speechSynthesis.speak(utterance);
  }

  public getState(): RamaVoiceState {
    return {
      isListening: this.isListening || this.isRestarting,
      isSpeaking: this.isSpeaking,
      transcript: this.transcript,
      wakeWordDetected: false,
      micSensitivity: 0.8
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
}

export const RamaVoice = new RamaVoiceEngine();

// Compatibility alias for system callers
(RamaVoice as any).startContinuousListening = function() {
  this.startListening();
};
