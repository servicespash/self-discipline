// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama AI System Permissions & Device Authority Registry
 * Robust device authority layer with system overlays, media searching, and background listening.
 */

export type RamaPermissionId = 
  | 'telephony'
  | 'messaging'
  | 'email'
  | 'voice_assistant'
  | 'background_wake_word'
  | 'system_overlay'
  | 'media_storage'
  | 'media_library_search'
  | 'universal_media_search'
  | 'camera_vision'
  | 'screen_capture_recording'
  | 'social_sharing'
  | 'lockdown_control'
  | 'exact_alarms'
  | 'contacts'
  | 'in_app_streaming';

export interface RamaPermissionDefinition {
  id: RamaPermissionId;
  title: string;
  category: 'Communication' | 'Media & Audio Engine' | 'Hardware & Voice' | 'System Security & Overlay';
  icon: string;
  shortDesc: string;
  detailedDesc: string;
  disciplinaryPurpose: string;
  isGranted: boolean;
  requiresHardwarePrompt?: boolean;
}

const STORAGE_KEY = 'cymatic_rama_permissions_v3';

export const PERMISSION_DEFINITIONS: Record<RamaPermissionId, Omit<RamaPermissionDefinition, 'isGranted'>> = {
  telephony: {
    id: 'telephony',
    title: 'Phone Calls & Carrier Telephony',
    category: 'Communication',
    icon: 'PhoneCall',
    shortDesc: 'Place calls via native dialer.',
    detailedDesc: 'Allows Rama AI to place phone calls via carrier or SIM selector.',
    disciplinaryPurpose: 'Hands-free emergency or executive calling without search friction.'
  },
  messaging: {
    id: 'messaging',
    title: 'Message Dispatch & WhatsApp Engine',
    category: 'Communication',
    icon: 'MessageSquare',
    shortDesc: 'Draft and send SMS or WhatsApp messages.',
    detailedDesc: 'Drafts structured messages and forwards them via SMS or WhatsApp intent.',
    disciplinaryPurpose: 'Prevents distraction by dispatching concise, pre-structured messages.'
  },
  email: {
    id: 'email',
    title: 'Executive Email Composition',
    category: 'Communication',
    icon: 'Mail',
    shortDesc: 'Draft concise email communications.',
    detailedDesc: 'Allows Rama AI to compose and send emails via system mail clients.',
    disciplinaryPurpose: 'Reduces inbox scrolling with AI-assisted drafting.'
  },
  voice_assistant: {
    id: 'voice_assistant',
    title: 'Voice Engine & Speech Synthesis (TTS)',
    category: 'Hardware & Voice',
    icon: 'Mic',
    shortDesc: 'Real-time text-to-speech voice response.',
    detailedDesc: 'Unlocks browser/system audio context for smooth, uninhibited voice feedback.',
    disciplinaryPurpose: 'Delivers vocal discipline feedback without requiring screen interaction.',
    requiresHardwarePrompt: true
  },
  background_wake_word: {
    id: 'background_wake_word',
    title: 'Background Wake-Word ("Hey Rama")',
    category: 'Hardware & Voice',
    icon: 'Radio',
    shortDesc: 'Listen for wake-word when app is minimized or screen off.',
    detailedDesc: 'Runs background audio service to detect "Hey Rama" or "Hi Rama" and wake up the assistant.',
    disciplinaryPurpose: 'Provides continuous voice assistance without manually unlocking the device.',
    requiresHardwarePrompt: true
  },
  system_overlay: {
    id: 'system_overlay',
    title: 'System Overlay Window (SYSTEM_ALERT_WINDOW)',
    category: 'System Security & Overlay',
    icon: 'Maximize',
    shortDesc: 'Draw floating Rama UI over other apps.',
    detailedDesc: 'Grants permission to pop up as a system floating window over any running app when invoked.',
    disciplinaryPurpose: 'Enforces discipline interventions and floating assistant access across the entire Android OS.'
  },
  media_storage: {
    id: 'media_storage',
    title: 'Local Phone Storage Access',
    category: 'Media & Audio Engine',
    icon: 'FolderOpen',
    shortDesc: 'Read audio files directly from phone storage.',
    detailedDesc: 'Grants access to read local audio tracks (.mp3, .wav, .m4a) stored in internal device memory.',
    disciplinaryPurpose: 'Enables offline music and educational playback directly from device storage.'
  },
  media_library_search: {
    id: 'media_library_search',
    title: 'Local Storage Track Querying',
    category: 'Media & Audio Engine',
    icon: 'Search',
    shortDesc: 'Search device storage for specific tracks by title/artist.',
    detailedDesc: 'Indexes local device music so you can request songs like "Latty Adams - Behind the Dark" from local storage.',
    disciplinaryPurpose: 'Finds your exact stored media instantly without opening music player apps.'
  },
  universal_media_search: {
    id: 'universal_media_search',
    title: 'Fallback Free Streaming Engine',
    category: 'Media & Audio Engine',
    icon: 'Music',
    shortDesc: 'Fallback search across online sources if not found locally.',
    detailedDesc: 'Searches local device files first; if missing, queries open streaming sources (YouTube, Audiomack, local sanctuary assets).',
    disciplinaryPurpose: 'Guarantees requested songs (e.g. Alec Benjamin, Watendawili, Latty Adams) play smoothly without app bouncing.'
  },
  camera_vision: {
    id: 'camera_vision',
    title: 'Camera & Vision Feedback',
    category: 'Hardware & Voice',
    icon: 'Camera',
    shortDesc: 'Camera access for workspace & posture checks.',
    detailedDesc: 'Enables camera preview for posture alignment and physical workspace checks.',
    disciplinaryPurpose: 'Real-time visual accountability with local processing.'
  },
  screen_capture_recording: {
    id: 'screen_capture_recording',
    title: 'Screen Recording & Capture Authority',
    category: 'Hardware & Voice',
    icon: 'Video',
    shortDesc: 'Capture screen state for focus auditing.',
    detailedDesc: 'Grants permission to record or snapshot screen content during active focus sessions.',
    disciplinaryPurpose: 'Detects doom-scrolling or off-task app usage during discipline blocks.'
  },
  social_sharing: {
    id: 'social_sharing',
    title: 'Native OS Web Share',
    category: 'Communication',
    icon: 'Share2',
    shortDesc: 'Share generated content via system dialog.',
    detailedDesc: 'Invokes native share sheet to send quotes or updates directly to target apps.',
    disciplinaryPurpose: 'One-click outbound sharing without feed browsing.'
  },
  lockdown_control: {
    id: 'lockdown_control',
    title: 'App Suppression & Lockdown Interception',
    category: 'System Security & Overlay',
    icon: 'Lock',
    shortDesc: 'Block distracting apps during focus sessions.',
    detailedDesc: 'Intercepts launched app intents and forces lockouts for distracting packages.',
    disciplinaryPurpose: 'Enforces hard digital boundaries during study or prayer blocks.'
  },
  exact_alarms: {
    id: 'exact_alarms',
    title: 'Android Exact Alarms (SCHEDULE_EXACT_ALARM)',
    category: 'System Security & Overlay',
    icon: 'Clock',
    shortDesc: 'Unthrottled exact alarm execution for Adhan.',
    detailedDesc: 'Prevents Android battery saver from delaying background Adhan prayer calls and alarms.',
    disciplinaryPurpose: 'Guarantees exact-minute spiritual calls and schedule notifications.'
  },
  contacts: {
    id: 'contacts',
    title: 'Device Contacts Access',
    category: 'Communication',
    icon: 'Users',
    shortDesc: 'Match contacts for mutual consent agreements.',
    detailedDesc: 'Reads device contacts to verify bilateral governance partners.',
    disciplinaryPurpose: 'Seamless institutional register and accountability syncing.'
  },
  in_app_streaming: {
    id: 'in_app_streaming',
    title: 'In-App Media Streaming',
    category: 'Media & Audio Engine',
    icon: 'Music',
    shortDesc: 'Stream music and audio directly within Cymatic OS.',
    detailedDesc: 'Grants permission to stream open media and music tracks inside the application interface.',
    disciplinaryPurpose: 'Enables focused audio playback without context switching to external apps.'
  }
};

export class RamaPermissionsManager {
  public static getGrantedMap(): Record<RamaPermissionId, boolean> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[RamaPermissions] Failed to load permissions:', e);
    }

    const defaults: Record<RamaPermissionId, boolean> = {
      telephony: true,
      messaging: true,
      email: true,
      voice_assistant: true,
      background_wake_word: true,
      system_overlay: true,
      media_storage: true,
      media_library_search: true,
      universal_media_search: true,
      camera_vision: true,
      screen_capture_recording: true,
      social_sharing: true,
      lockdown_control: true,
      exact_alarms: true,
      contacts: true,
      in_app_streaming: true
    };
    this.saveGrantedMap(defaults);
    return defaults;
  }

  public static saveGrantedMap(map: Record<RamaPermissionId, boolean>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rama-permissions-updated', { detail: map }));
      }
    } catch (e) {
      console.error('[RamaPermissions] Failed to save permissions:', e);
    }
  }

  public static isGranted(id: RamaPermissionId): boolean {
    const map = this.getGrantedMap();
    return Boolean(map[id]);
  }

  public static setPermission(id: RamaPermissionId, granted: boolean): void {
    const map = this.getGrantedMap();
    map[id] = granted;
    this.saveGrantedMap(map);
  }

  public static togglePermission(id: RamaPermissionId): boolean {
    const current = this.isGranted(id);
    this.setPermission(id, !current);
    return !current;
  }

  public static getAllDefinitions(): RamaPermissionDefinition[] {
    const map = this.getGrantedMap();
    return Object.keys(PERMISSION_DEFINITIONS).map((key) => {
      const id = key as RamaPermissionId;
      return {
        ...PERMISSION_DEFINITIONS[id],
        isGranted: Boolean(map[id])
      };
    });
  }

  public static resetToAllGranted(): void {
    const allTrue: Record<RamaPermissionId, boolean> = {
      telephony: true,
      messaging: true,
      email: true,
      voice_assistant: true,
      background_wake_word: true,
      system_overlay: true,
      media_storage: true,
      media_library_search: true,
      universal_media_search: true,
      camera_vision: true,
      screen_capture_recording: true,
      social_sharing: true,
      lockdown_control: true,
      exact_alarms: true,
      contacts: true,
      in_app_streaming: true
    };
    this.saveGrantedMap(allTrue);
  }
}
