/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama AI System Permissions & Device Authority Registry
 * Defines full granular system permissions with detailed user-facing descriptions,
 * prompting logic, and transparent sovereignty controls.
 */

export type RamaPermissionId = 
  | 'telephony'
  | 'messaging'
  | 'email'
  | 'voice_assistant'
  | 'media_storage'
  | 'in_app_streaming'
  | 'camera_vision'
  | 'social_sharing'
  | 'lockdown_control';

export interface RamaPermissionDefinition {
  id: RamaPermissionId;
  title: string;
  category: 'Communication' | 'Media & Storage' | 'Hardware & Voice' | 'System Security';
  icon: string;
  shortDesc: string;
  detailedDesc: string;
  disciplinaryPurpose: string;
  isGranted: boolean;
  requiresHardwarePrompt?: boolean;
}

const STORAGE_KEY = 'cymatic_rama_permissions_v1';

export const PERMISSION_DEFINITIONS: Record<RamaPermissionId, Omit<RamaPermissionDefinition, 'isGranted'>> = {
  telephony: {
    id: 'telephony',
    title: 'Phone Calls & Carrier Telephony',
    category: 'Communication',
    icon: 'PhoneCall',
    shortDesc: 'Place calls with network carrier & SIM selection prompt.',
    detailedDesc: 'Allows Rama AI to dial phone numbers using your device telephone dialer. Rama prompts you to confirm the recipient number and select your preferred network carrier or SIM card before connecting.',
    disciplinaryPurpose: 'Enables voice communications without needing to search for contacts while maintaining disciplined focus.'
  },
  messaging: {
    id: 'messaging',
    title: 'Message Designing & WhatsApp Dispatch',
    category: 'Communication',
    icon: 'MessageSquare',
    shortDesc: 'Design disciplined messages and dispatch via WhatsApp or SMS.',
    detailedDesc: 'Allows Rama AI to craft high-clarity messages, format them for export, and route them to WhatsApp or default SMS with user confirmation.',
    disciplinaryPurpose: 'Prevents aimless texting by having Rama structure clear, goal-oriented communications.'
  },
  email: {
    id: 'email',
    title: 'Email Composition & Mailto Intent',
    category: 'Communication',
    icon: 'Mail',
    shortDesc: 'Compose and dispatch structured emails.',
    detailedDesc: 'Allows Rama AI to compose emails with clear subjects and formatted bodies, sending them via system mail intents.',
    disciplinaryPurpose: 'Eliminates inbox distraction by drafting concise executive correspondence.'
  },
  voice_assistant: {
    id: 'voice_assistant',
    title: 'Voice Engine & "Hi Rama" Wake Word',
    category: 'Hardware & Voice',
    icon: 'Mic',
    shortDesc: 'Function as default device audio assistant with wake word.',
    detailedDesc: 'Enables continuous audio responsiveness for "Hi Rama" or "Hey Rama" to summon the assistant hands-free, functioning just like device voice assistants with real-time Speech Synthesis (TTS).',
    disciplinaryPurpose: 'Provides instant hands-free discipline coaching without touching the screen.',
    requiresHardwarePrompt: true
  },
  media_storage: {
    id: 'media_storage',
    title: 'Device Storage & Local Media Files',
    category: 'Media & Storage',
    icon: 'FolderOpen',
    shortDesc: 'Access device audio tracks (.mp3, .wav) and stored images.',
    detailedDesc: 'Allows Rama AI to access local audio files from your phone or computer storage to play them directly inside the system, or pick images from storage for sharing.',
    disciplinaryPurpose: 'Allows listening to your personal offline audio lectures, audiobooks, or ambient tracks without browsing distractors.'
  },
  in_app_streaming: {
    id: 'in_app_streaming',
    title: 'In-App Embedded Music Streaming',
    category: 'Media & Storage',
    icon: 'Music',
    shortDesc: 'Play Spotify, YouTube Music, Deezer & local audio in the UI.',
    detailedDesc: 'Allows Rama AI to stream songs from YouTube Music, Spotify, Deezer, and local storage directly within the Cymatic OS interface without launching third-party external apps.',
    disciplinaryPurpose: 'Preserves focus by keeping music playback strictly embedded inside the OS so you never get lured into third-party social feeds.'
  },
  camera_vision: {
    id: 'camera_vision',
    title: 'Camera & Vision Feedback',
    category: 'Hardware & Voice',
    icon: 'Camera',
    shortDesc: 'Real-time camera or screen recording preview.',
    detailedDesc: 'Enables live device camera and screen preview for visual feedback, posture checks, workspace audits, and physical conditioning verification.',
    disciplinaryPurpose: 'Permits visual accountability for physical workspace and posture audits with strict client-side privacy.',
    requiresHardwarePrompt: true
  },
  social_sharing: {
    id: 'social_sharing',
    title: 'Social Media & Native OS Sharing',
    category: 'Communication',
    icon: 'Share2',
    shortDesc: 'Share designed content and images to social media apps.',
    detailedDesc: 'Allows Rama AI to invoke the native OS Web Share dialog to pass messages, referral links, and stored images directly to your installed social apps.',
    disciplinaryPurpose: 'Enables deliberate, one-click sharing without getting trapped browsing infinite feeds.'
  },
  lockdown_control: {
    id: 'lockdown_control',
    title: 'System Lockdown & Intent Interception',
    category: 'System Security',
    icon: 'Lock',
    shortDesc: 'Engage timed app suppression and distraction blackouts.',
    detailedDesc: 'Authorizes Rama AI to enforce algorithmic lockdown, suppressing high-dopamine social apps and distracting packages for designated minutes.',
    disciplinaryPurpose: 'Guarantees uncompromised execution by blocking distractors via OS intent interception.'
  }
};

export class RamaPermissionsManager {
  /**
   * Load stored permissions from localStorage, defaulting to granted for smooth experience
   */
  public static getGrantedMap(): Record<RamaPermissionId, boolean> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[RamaPermissions] Failed to load permissions:', e);
    }

    // Default permissions: all initial core permissions granted for full capability
    const defaults: Record<RamaPermissionId, boolean> = {
      telephony: true,
      messaging: true,
      email: true,
      voice_assistant: true,
      media_storage: true,
      in_app_streaming: true,
      camera_vision: true,
      social_sharing: true,
      lockdown_control: true
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
      media_storage: true,
      in_app_streaming: true,
      camera_vision: true,
      social_sharing: true,
      lockdown_control: true
    };
    this.saveGrantedMap(allTrue);
  }
}
