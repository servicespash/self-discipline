// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Global Ambient Type Definitions for Capacitor, Native Plugins, W3C APIs & Speech Recognition
 */

export {};

export interface DisciplineNativePlugin {
  terminateLockdown: () => Promise<void>;
  suppressNotifications: (options: { suppress: boolean }) => Promise<void>;
  enforceIntentInterception: (options: { active: boolean; packages?: string[]; endTime?: number }) => Promise<void>;
  startVpnTunnel: () => Promise<void>;
  checkPermissions: () => Promise<any>;
  requestPermission: (options: { permission: "accessibility" | "notificationListener" | "vpn" | "overlay" }) => Promise<any>;
  bringToFront?: () => Promise<void>;
  fetchInstalledApps: () => Promise<string>;
}

declare global {
  interface Window {
    launchQueue?: {
      setConsumer: (consumer: (launchParams: { targetURL?: string }) => void) => void;
    };
    DisciplineNative?: DisciplineNativePlugin;
    Capacitor?: {
      isPluginAvailable: (name: string) => boolean;
      Plugins: {
        DisciplineNative: DisciplineNativePlugin;
        [key: string]: unknown;
      };
    };
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }

  interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  }

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
    message?: string;
  }
}
