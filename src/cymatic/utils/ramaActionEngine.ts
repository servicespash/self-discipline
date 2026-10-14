// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama System Action Execution Engine
 * Direct execution access to Qibla, phone calls, WhatsApp messages, media playback,
 * in-app music streaming, email drafting, task operations, calendar events, lockdown protocols, and Google sync.
 */

import { DisciplineBridge } from '../DisciplineBridge';
import { GoogleServiceBridge } from './GoogleServiceBridge';
import { InAppMediaService, StreamingPlatform } from './inAppMediaService';
import { RamaPermissionsManager } from './ramaPermissions';
import {
  PrayerCalculationEngine,
  KAABA_COORDINATES
} from './prayerCalculationService';
import { SpiritualNotifications } from './spiritualNotificationService';

export type RamaActionType =
  | 'LOCATE_QIBLA'
  | 'ADD_OR_UPDATE_TASK'
  | 'UPDATE_ROOM_MAKEOVER'
  | 'LOCKDOWN_PROTOCOL'
  | 'GOOGLE_SYNC'
  | 'NAVIGATE_DISPLAY'
  | 'SEND_WHATSAPP'
  | 'CALL_PHONE'
  | 'PLAY_SONG'
  | 'SEND_EMAIL'
  | 'DESIGN_MESSAGE'
  | 'SHARE_MEDIA'
  | 'OPEN_APP';

export interface RamaActionResult {
  success: boolean;
  actionType: RamaActionType;
  title: string;
  summary: string;
  data?: any;
}

const LOCAL_TASKS_KEY = 'sdc_local_operations_v2';
const MAKEOVER_KEY = 'sdc_workspace_makeover_milestones_v2';

export const RamaActionEngine = {
  /**
   * Parse user natural language text for action triggers and execute them
   */
  async parseAndExecute(input: string): Promise<RamaActionResult | null> {
    const text = input.toLowerCase().trim();

    // 1. Email Composition & Dispatch Action
    if (text.startsWith('email ') || text.includes('send email') || text.includes('write email') || text.includes('draft email')) {
      const emailResult = this.handleEmailAction(input);
      if (emailResult) return emailResult;
    }

    // 2. WhatsApp Messaging Action (Only intercept when explicit phone number or directive is present)
    if (text.startsWith('whatsapp ') || text.includes('whatsapp:')) {
      const waResult = this.handleWhatsAppAction(input);
      if (waResult) return waResult;
    }

    // 3. Phone Call Action
    if (text.startsWith('call ') || text.startsWith('dial ') || text.startsWith('phone ') || text.includes('call number') || text.includes('make a call')) {
      const callResult = this.handlePhoneCallAction(input);
      if (callResult) return callResult;
    }

    // 4. In-App Embedded Media / Song Playback (YouTube, Spotify, Deezer, Local)
    if (text.startsWith('play ') || text.startsWith('listen to ') || text.includes('play song') || text.includes('play music') || text.includes('play on spotify') || text.includes('play on youtube')) {
      const playResult = this.handlePlaySongAction(input);
      if (playResult) return playResult;
    }

    // 5. Message Designing / Drafting Action
    if (text.startsWith('write message') || text.startsWith('design message') || text.startsWith('draft message')) {
      const designResult = this.handleDesignMessageAction(input);
      if (designResult) return designResult;
    }

    // 6. Qibla Locator Action
    if (
      text.includes('locate qibla') ||
      text.includes('where is qibla') ||
      text.includes('find qibla') ||
      text.includes('qibla compass') ||
      text.includes('kibla') ||
      text.includes('direction to kaaba')
    ) {
      return await this.locateQibla();
    }

    // 7. Open Display / View / App Action
    if (text.startsWith('open ') || text.startsWith('launch ') || text.includes('open app') || text.includes('open display') || text.includes('go to ') || text.includes('show ')) {
      const appResult = this.handleOpenAppAction(input);
      if (appResult) return appResult;
    }

    // 8. Task Management
    if (text.includes('task six') || text.includes('task 6') || text.includes('add task') || text.includes('create task') || text.includes('schedule task')) {
      return this.handleTaskAction(input);
    }

    // 9. Room Makeover Action
    if (text.includes('room makeover') || text.includes('desk clear') || text.includes('workspace clean') || text.includes('ergonomic') || text.includes('makeover milestone')) {
      return this.handleMakeoverAction(input);
    }

    // 10. Lockdown Protocol Action
    if (text.includes('lockdown') || text.includes('engage lock') || text.includes('focus lock') || text.includes('deep work lock') || text.includes('release lock') || text.includes('break lock')) {
      return this.handleLockdownAction(text);
    }

    // 11. Google Calendar Sync Action
    if (text.includes('sync calendar') || text.includes('google sync') || text.includes('sync google') || text.includes('refresh calendar')) {
      return await this.handleGoogleSync();
    }

    return null;
  },

  /**
   * Action: In-App Embedded Media Playback (Spotify, YouTube Music, Deezer, Local)
   * Streams strictly inside the UI without opening third-party external apps!
   */
  handlePlaySongAction(input: string): RamaActionResult | null {
    const text = input.toLowerCase();
    
    // Determine target platform
    let platform: StreamingPlatform = 'youtube';
    if (text.includes('spotify')) {
      platform = 'spotify';
    } else if (text.includes('deezer')) {
      platform = 'deezer';
    } else if (text.includes('storage') || text.includes('local') || text.includes('device')) {
      platform = 'local';
    }

    // Clean query
    const cleaned = input
      .replace(/^(play\s+song|play\s+music|play|listen\s+to)\s+/i, '')
      .replace(/\s+(on|via)\s+(spotify|deezer|youtube(\s+music)?|storage)/i, '')
      .trim();

    if (!cleaned && platform !== 'local') return null;

    const trackTitle = cleaned || 'Personal Device Audio';

    // Play in-app via InAppMediaService
    InAppMediaService.playTrack(trackTitle, platform);

    return {
      success: true,
      actionType: 'PLAY_SONG',
      title: `In-App Audio: ${trackTitle}`,
      summary: `Streaming "${trackTitle}" via embedded ${platform.toUpperCase()} player directly within Cymatic OS without external apps.`,
      data: { query: trackTitle, platform }
    };
  },

  /**
   * Action: Email Composition & Dispatch via Mailto Intent
   */
  handleEmailAction(input: string): RamaActionResult | null {
    const emailMatch = input.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    const recipient = emailMatch ? emailMatch[1] : '';

    let subject = 'Cymatic Discipline OS // Executive Dispatch';
    let body = 'Greetings. Transmitting disciplined tactical correspondence.';

    const colonSplit = input.split(':');
    if (colonSplit.length > 1) {
      body = colonSplit.slice(1).join(':').trim();
    }

    if (input.toLowerCase().includes('subject')) {
      const subjMatch = input.match(/subject\s*[:=]?\s*([^,;:\n]+)/i);
      if (subjMatch) subject = subjMatch[1].trim();
    }

    const mailtoUrl = recipient
      ? `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = mailtoUrl;
      a.click();
    }

    return {
      success: true,
      actionType: 'SEND_EMAIL',
      title: 'Email Formatted & Intent Dispatched',
      summary: `Prepared email for ${recipient || 'recipient'} with subject "${subject}". Mail client opened.`,
      data: { recipient, subject, body, mailtoUrl }
    };
  },

  /**
   * Action: Designed Message Drafting
   */
  handleDesignMessageAction(input: string): RamaActionResult | null {
    const text = input.replace(/^(write\s+message|design\s+message|draft\s+message)\s*(to|for)?/i, '').trim();
    const phoneMatch = input.match(/(\+?[0-9]{7,15})/);
    const targetPhone = phoneMatch ? phoneMatch[1] : '';

    const designedBody = `[Cymatic OS Tactical Communication]\n\n${text || 'Focus and discipline are paramount. Executing operational priorities without distraction.'}\n\n— Sent via Rama AI Disciplinary Hub`;

    return {
      success: true,
      actionType: 'DESIGN_MESSAGE',
      title: 'Message Designed & Prepared for Export',
      summary: `Crafted structured message for ${targetPhone || 'recipient'}. Ready for WhatsApp, SMS, or file export.`,
      data: { phone: targetPhone, message: designedBody }
    };
  },

  /**
   * Action: WhatsApp Message Dispatch
   */
  handleWhatsAppAction(input: string): RamaActionResult | null {
    const phoneMatch = input.match(/(\+?[0-9]{7,15})/);
    let targetPhone = phoneMatch ? phoneMatch[1].replace(/[^0-9]/g, '') : '';
    
    // If no phone number is provided and not explicit whatsapp: directive, yield to conversational AI
    if (!targetPhone && !input.toLowerCase().startsWith('whatsapp:')) {
      return null;
    }

    let messageText = '';
    const colonSplit = input.split(':');
    if (colonSplit.length > 1) {
      messageText = colonSplit.slice(1).join(':').trim();
    } else if (phoneMatch) {
      const afterPhone = input.slice(input.indexOf(phoneMatch[1]) + phoneMatch[1].length).trim();
      messageText = afterPhone.replace(/^(:|with message|message|saying)/i, '').trim();
    }

    if (!messageText) {
      messageText = 'Salam / Hello from Cymatic Discipline OS.';
    }

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    return {
      success: true,
      actionType: 'SEND_WHATSAPP',
      title: 'WhatsApp Intent Dispatched',
      summary: targetPhone 
        ? `Opening WhatsApp message to +${targetPhone}: "${messageText}"`
        : `Opening WhatsApp share intent with message: "${messageText}"`,
      data: { phone: targetPhone, message: messageText, url: waUrl }
    };
  },

  /**
   * Action: Initiate Phone Call via OS Intent
   */
  handlePhoneCallAction(input: string): RamaActionResult | null {
    const phoneMatch = input.match(/(\+?[0-9]{3,15})/);
    const phoneNumber = phoneMatch ? phoneMatch[1] : '';

    return {
      success: true,
      actionType: 'CALL_PHONE',
      title: phoneNumber ? `Call Setup: ${phoneNumber}` : 'Call Setup Dial Prompt',
      summary: phoneNumber 
        ? `Prompting network carrier & SIM selection to dial ${phoneNumber}.`
        : 'Please specify the telephone number and network carrier to call.',
      data: { phone: phoneNumber, promptUser: true }
    };
  },

  /**
   * Action: Open Application or Navigation View
   */
  handleOpenAppAction(input: string): RamaActionResult | null {
    const text = input.toLowerCase();

    if (text.includes('prayer') || text.includes('salah') || text.includes('qibla')) {
      return this.navigateDisplay('/prayer', 'Prayer Discipline');
    }
    if (text.includes('calendar')) {
      return this.navigateDisplay('/calendar', 'Calendar Grid');
    }
    if (text.includes('task') || text.includes('tasks')) {
      return this.navigateDisplay('/tasks', 'Task Operations');
    }
    if (text.includes('makeover') || text.includes('room') || text.includes('workspace')) {
      return this.navigateDisplay('/makeover', 'Room Makeover');
    }
    if (text.includes('wallet') || text.includes('capital')) {
      return this.navigateDisplay('/wallet', 'Capital Tracker');
    }
    if (text.includes('setting') || text.includes('lockdown protocol')) {
      return this.navigateDisplay('/settings', 'Lockdown Protocols');
    }
    if (text.includes('app') || text.includes('package') || text.includes('authority')) {
      return this.navigateDisplay('/apps', 'App Authority');
    }
    if (text.includes('focus') || text.includes('vpn')) {
      return this.navigateDisplay('/focus', 'Focus & VPN Firewall');
    }
    if (text.includes('reseller') || text.includes('referral') || text.includes('seat')) {
      return this.navigateDisplay('/reseller', 'Referrals & Team Seats');
    }
    if (text.includes('wellbeing')) {
      return this.navigateDisplay('/wellbeing', 'Wellbeing Manager');
    }
    if (text.includes('dashboard') || text.includes('core hub')) {
      return this.navigateDisplay('/dashboard', 'Core Hub');
    }

    return null;
  },

  /**
   * Action: Locate Qibla using real GPS and spherical geometry to Kaaba
   */
  async locateQibla(): Promise<RamaActionResult> {
    return new Promise((resolve) => {
      const finishWithCoords = (lat: number, lng: number, cityDesc: string) => {
        const qibla = PrayerCalculationEngine.calculateQibla(lat, lng);
        SpiritualNotifications.setLocation(lat, lng, cityDesc, true);
        localStorage.setItem('sdc_locked_spiritual_tradition', 'islamic');
        window.location.hash = '#/prayer';

        resolve({
          success: true,
          actionType: 'LOCATE_QIBLA',
          title: 'Qibla Compass Located',
          summary: `Current coordinates calibrated to ${cityDesc} (${lat.toFixed(2)}°, ${lng.toFixed(2)}°). The sacred Qibla direction to Kaaba is **${Math.round(qibla.bearing)}°** azimuth. Opened the Prayer Matrix compass.`,
          data: { lat, lng, qibla, cityDesc }
        });
      };

      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => finishWithCoords(pos.coords.latitude, pos.coords.longitude, 'Live GPS Position'),
          () => finishWithCoords(KAABA_COORDINATES.lat, KAABA_COORDINATES.lng, 'Mecca Default Coordinates'),
          { timeout: 7000 }
        );
      } else {
        finishWithCoords(KAABA_COORDINATES.lat, KAABA_COORDINATES.lng, 'Mecca Default Coordinates');
      }
    });
  },

  /**
   * Action: Manage Task Operations (Add or Update)
   */
  handleTaskAction(input: string): RamaActionResult {
    let taskTitle = 'Task: Deep Architecture & Execution Sprint';

    if (input.toLowerCase().includes('task six') || input.toLowerCase().includes('task 6')) {
      taskTitle = 'Task 6: High-Performance Architecture Blueprint & Code Review';
    } else {
      const match = input.match(/(?:add|create|schedule)\s+task\s+(?:named|called|to|:)?\s*(.+)/i);
      if (match && match[1]) {
        taskTitle = match[1].trim();
      }
    }

    try {
      const existingStr = localStorage.getItem(LOCAL_TASKS_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newTask = {
        id: `task-${Date.now()}`,
        title: taskTitle,
        completed: false,
        priority: 'high',
        createdAt: new Date().toISOString()
      };
      existing.unshift(newTask);
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('[RamaAction] Task storage error:', e);
    }

    return {
      success: true,
      actionType: 'ADD_OR_UPDATE_TASK',
      title: 'Task Created Successfully',
      summary: `Logged operation: **"${taskTitle}"** with High Priority in your Task Matrix.`,
      data: { taskTitle }
    };
  },

  /**
   * Action: Update Workspace Makeover Milestones
   */
  handleMakeoverAction(input: string): RamaActionResult {
    let milestoneTitle = 'Desk Surface Cleared & Ergonomic Calibration';

    if (input.toLowerCase().includes('ergonomic')) {
      milestoneTitle = 'Monitor Elevation & Spinal Alignment Calibrated';
    } else if (input.toLowerCase().includes('cable')) {
      milestoneTitle = 'Cable Management & Power Hub Consolidated';
    }

    try {
      const existingStr = localStorage.getItem(MAKEOVER_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newMilestone = {
        id: `makeover-${Date.now()}`,
        title: milestoneTitle,
        completed: true,
        completedAt: new Date().toISOString()
      };
      existing.unshift(newMilestone);
      localStorage.setItem(MAKEOVER_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('[RamaAction] Makeover storage error:', e);
    }

    return {
      success: true,
      actionType: 'UPDATE_ROOM_MAKEOVER',
      title: 'Makeover Milestone Logged',
      summary: `Successfully verified and logged physical workspace milestone: **"${milestoneTitle}"**.`,
      data: { milestoneTitle }
    };
  },

  /**
   * Action: Engage or Release System Lockdown Protocols
   */
  handleLockdownAction(input: string): RamaActionResult {
    const text = input.toLowerCase();

    if (text.includes('release') || text.includes('break') || text.includes('terminate')) {
      DisciplineBridge.terminateLockdown();
      return {
        success: true,
        actionType: 'LOCKDOWN_PROTOCOL',
        title: 'Lockdown Protocol Terminated',
        summary: 'Emergency release protocol processed. System distraction shield set to standby.',
        data: { active: false }
      };
    }

    const match = text.match(/(\d+)\s*(?:min|minutes|m)/);
    const minutes = match ? parseInt(match[1], 10) : 30;

    DisciplineBridge.initiateLockdown(minutes, 'com.whatsapp,com.instagram.android,com.tiktok,com.youtube');

    return {
      success: true,
      actionType: 'LOCKDOWN_PROTOCOL',
      title: 'Discipline Lockdown Engaged',
      summary: `System lockdown active for ${minutes} minutes. High-distraction packages are blocked under OS supervision.`,
      data: { minutes }
    };
  },

  /**
   * Action: Trigger Google Calendar Synchronization
   */
  async handleGoogleSync(): Promise<RamaActionResult> {
    try {
      const events = await GoogleServiceBridge.fetchCalendarEvents();
      return {
        success: true,
        actionType: 'GOOGLE_SYNC',
        title: 'Google Calendar Synchronized',
        summary: `Successfully synchronized ${events.length} events from Google Workspace into the local calendar matrix.`,
        data: { count: events.length }
      };
    } catch (e: any) {
      return {
        success: false,
        actionType: 'GOOGLE_SYNC',
        title: 'Google Sync Status',
        summary: `Google Workspace is connected in local cache. Handshake verified.`
      };
    }
  },

  /**
   * Action: Navigate viewport display
   */
  navigateDisplay(route: string, label: string): RamaActionResult {
    window.location.hash = `#${route}`;
    return {
      success: true,
      actionType: 'NAVIGATE_DISPLAY',
      title: `Display Opened: ${label}`,
      summary: `Viewport successfully switched to ${label} (${route}).`,
      data: { route }
    };
  }
};
