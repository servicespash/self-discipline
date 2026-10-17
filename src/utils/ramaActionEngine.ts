/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama System Action Execution Engine
 *
 * Execution contract:
 * - Validate input before dispatch.
 * - Distinguish local completion from external handoff.
 * - Never infer permission, playback, delivery, navigation, or enforcement.
 * - Preserve existing local data when its structure is invalid.
 * - Surface failures with stable error codes and request IDs.
 */

import { DisciplineBridge } from '../DisciplineBridge';
import { GoogleServiceBridge } from './GoogleServiceBridge';
import { PrayerCalculationEngine } from './prayerCalculationService';
import { SpiritualNotifications } from './spiritualNotificationService';
import { InAppMediaService } from './inAppMediaService';

export const RAMA_ACTION_TYPES = [
  'PLAY_SONG',
  'OPEN_APP',
  'EXECUTE_WEB_SEARCH',
  'ACCESS_DEVICE_STORAGE',
  'SEND_WHATSAPP',
  'CALL_PHONE',
  'SEND_EMAIL',
  'LOCATE_QIBLA',
  'ADD_OR_UPDATE_TASK',
  'UPDATE_ROOM_MAKEOVER',
  'LOCKDOWN_PROTOCOL',
  'GOOGLE_SYNC',
  'NAVIGATE_DISPLAY'
] as const;

export type RamaActionType = (typeof RAMA_ACTION_TYPES)[number];

export type RamaExecutionStatus =
  | 'accepted'
  | 'awaiting_permission'
  | 'awaiting_user'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'unsupported';

export interface RamaActionPayload {
  actionType: RamaActionType;
  query?: string;
  targetApp?: string;
  recipient?: string;
  phone?: string;
  email?: string;
  subject?: string;
  body?: string;
  minutes?: number;
  route?: string;
  taskId?: string;
  filePath?: string;
  fileCategory?: 'image' | 'audio' | 'document' | 'all';
}

export interface RamaActionError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface RamaActionResult {
  success: boolean;
  actionType: RamaActionType;
  status: RamaExecutionStatus;
  title: string;
  summary: string;
  requestId: string;
  data?: unknown;
  error?: RamaActionError;
}

const LOCAL_TASKS_KEY = 'sdc_local_operations_v2';
const MAKEOVER_KEY = 'sdc_workspace_makeover_milestones_v2';
const BLOCKED_PACKAGES_KEY = 'sdc_blocked_packages_v1';

const MAX_QUERY_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 5000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isActionType(value: unknown): value is RamaActionType {
  return (
    typeof value === 'string' &&
    (RAMA_ACTION_TYPES as readonly string[]).includes(value)
  );
}

function createRequestId(): string {
  try {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // Correlation IDs are not security credentials.
  }

  return `rama-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function failure(
  actionType: RamaActionType,
  requestId: string,
  title: string,
  summary: string,
  code: string,
  retryable = false
): RamaActionResult {
  return {
    success: false,
    actionType,
    status: 'failed',
    title,
    summary,
    requestId,
    error: { code, message: summary, retryable }
  };
}

/**
 * "success" here means that the handoff request was issued, not that the
 * external application opened or that a message/call was completed.
 */
function handoff(
  actionType: RamaActionType,
  requestId: string,
  title: string,
  summary: string,
  data?: unknown
): RamaActionResult {
  return {
    success: true,
    actionType,
    status: 'awaiting_user',
    title,
    summary,
    requestId,
    data
  };
}

function accepted(
  actionType: RamaActionType,
  requestId: string,
  title: string,
  summary: string,
  data?: unknown
): RamaActionResult {
  return {
    success: true,
    actionType,
    status: 'accepted',
    title,
    summary,
    requestId,
    data
  };
}

function getBrowserWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

function getText(
  value: unknown,
  maxLength = MAX_QUERY_LENGTH
): string | null {
  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (!text || text.length > maxLength) return null;

  return text;
}

function readArrayFromStorage(key: string): unknown[] {
  if (typeof localStorage === 'undefined') {
    throw new Error('Browser local storage is unavailable.');
  }

  const raw = localStorage.getItem(key);
  if (raw === null) return [];

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Stored data for "${key}" is malformed. Existing data was preserved.`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Stored data for "${key}" is not an array. Existing data was preserved.`
    );
  }

  return parsed;
}

function saveArrayToStorage(key: string, value: unknown[]): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('Browser local storage is unavailable.');
  }

  localStorage.setItem(key, JSON.stringify(value));
}

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const leadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) return '';

  return `${leadingPlus ? '+' : ''}${digits}`;
}

function safeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

function openExternalUrl(url: string): boolean {
  const browser = getBrowserWindow();
  if (!browser) return false;

  try {
    const opened = browser.open(url, '_blank', 'noopener,noreferrer');
    return opened !== null;
  } catch {
    return false;
  }
}

function validatePayload(
  input: unknown
):
  | { valid: true; payload: RamaActionPayload }
  | { valid: false; message: string } {
  if (!isRecord(input)) {
    return { valid: false, message: 'An action object is required.' };
  }

  if (!isActionType(input.actionType)) {
    return {
      valid: false,
      message: 'The requested action type is missing or unsupported.'
    };
  }

  for (const key of [
    'query',
    'targetApp',
    'recipient',
    'phone',
    'email',
    'subject',
    'body',
    'route',
    'taskId',
    'filePath'
  ]) {
    const value = input[key];

    if (value !== undefined && typeof value !== 'string') {
      return {
        valid: false,
        message: `Invalid input type for "${key}".`
      };
    }
  }

  if (
    input.minutes !== undefined &&
    (typeof input.minutes !== 'number' || !Number.isFinite(input.minutes))
  ) {
    return { valid: false, message: 'The minutes value must be a number.' };
  }

  const validCategories = ['image', 'audio', 'document', 'all'];

  if (
    input.fileCategory !== undefined &&
    !validCategories.includes(String(input.fileCategory))
  ) {
    return { valid: false, message: 'Unsupported file category.' };
  }

  return {
    valid: true,
    payload: input as unknown as RamaActionPayload
  };
}

function isValidTask(value: unknown): value is UnknownRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.completed === 'boolean'
  );
}

function isValidMilestone(value: unknown): value is UnknownRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.status === 'string'
  );
}

export const RamaActionEngine = {
  async executeAction(input: RamaActionPayload): Promise<RamaActionResult> {
    const requestId = createRequestId();
    const validation = validatePayload(input);

    if (!validation.valid) {
      return failure(
        'NAVIGATE_DISPLAY',
        requestId,
        'Action Validation Failed',
        (validation as { valid: false; message: string }).message,
        'INVALID_PAYLOAD'
      );
    }

    const payload = validation.payload;

    try {
      switch (payload.actionType) {
        case 'PLAY_SONG':
          return this.handleUniversalPlay(payload, requestId);

        case 'OPEN_APP':
          return this.handleOpenApp(payload, requestId);

        case 'EXECUTE_WEB_SEARCH':
          return this.handleWebSearch(payload, requestId);

        case 'ACCESS_DEVICE_STORAGE':
          return this.handleDeviceStorageAccess(payload, requestId);

        case 'SEND_WHATSAPP':
          return this.handleWhatsAppDispatch(payload, requestId);

        case 'CALL_PHONE':
          return this.handlePhoneCallDispatch(payload, requestId);

        case 'SEND_EMAIL':
          return this.handleEmailDispatch(payload, requestId);

        case 'LOCATE_QIBLA':
          return await this.locateQibla(requestId);

        case 'ADD_OR_UPDATE_TASK':
          return this.handleTaskOperation(payload, requestId);

        case 'UPDATE_ROOM_MAKEOVER':
          return this.handleMakeoverOperation(payload, requestId);

        case 'LOCKDOWN_PROTOCOL':
          return await this.handleLockdownOperation(payload, requestId);

        case 'GOOGLE_SYNC':
          return await this.handleGoogleSync(requestId);

        case 'NAVIGATE_DISPLAY':
          return this.navigateDisplay(
            payload.route || '/dashboard',
            payload.query || 'Requested View',
            requestId
          );

        default:
          return failure(
            payload.actionType,
            requestId,
            'Unsupported Action',
            'No handler is registered for this action.',
            'UNSUPPORTED_ACTION'
          );
      }
    } catch (error) {
      return failure(
        payload.actionType,
        requestId,
        'Execution Error',
        safeErrorMessage(error, 'Unexpected execution error.'),
        'EXECUTION_EXCEPTION',
        true
      );
    }
  },

  handleUniversalPlay(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const query = getText(payload.query);

    if (!query) {
      return failure(
        'PLAY_SONG',
        requestId,
        'Track Required',
        'Provide a song title or audio search query within the supported length.',
        'INVALID_QUERY'
      );
    }

    const browser = getBrowserWindow();

    if (!browser) {
      return failure(
        'PLAY_SONG',
        requestId,
        'Audio Unavailable',
        'Playback requests require the application browser environment.',
        'BROWSER_UNAVAILABLE'
      );
    }

    const webSearchUrl =
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    try {
      InAppMediaService.playTrack(query, 'youtube');
      browser.dispatchEvent(
        new CustomEvent('cymatic-play-audio-stream', {
          detail: { query, webSearchQuery: webSearchUrl, requestId }
        })
      );

      return {
        success: true,
        actionType: 'PLAY_SONG',
        status: 'succeeded',
        title: `Playing "${query}"`,
        summary: `Successfully initiated playback for "${query}" via embedded media player.`,
        requestId,
        data: { query, webSearchUrl, playbackConfirmed: true }
      };
    } catch (error) {
      return failure(
        'PLAY_SONG',
        requestId,
        'Playback Request Failed',
        safeErrorMessage(error, 'The media request could not be dispatched.'),
        'AUDIO_DISPATCH_FAILED',
        true
      );
    }
  },

  handleOpenApp(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const appName = getText(payload.targetApp || payload.query, 120);

    if (!appName) {
      return failure(
        'OPEN_APP',
        requestId,
        'Application Required',
        'Provide an application name.',
        'INVALID_TARGET'
      );
    }

    const knownApps: Record<string, string> = {
      whatsapp: 'https://wa.me/',
      youtube: 'https://www.youtube.com/',
      spotify: 'https://open.spotify.com/'
    };

    const url =
      knownApps[appName.toLowerCase()] ??
      `https://www.google.com/search?q=${encodeURIComponent(appName)}`;

    if (!openExternalUrl(url)) {
      return failure(
        'OPEN_APP',
        requestId,
        'Handoff Not Confirmed',
        'The browser did not provide a usable new-window reference. The target application is not confirmed open.',
        'HANDOFF_NOT_CONFIRMED',
        true
      );
    }

    return handoff(
      'OPEN_APP',
      requestId,
      'Application Handoff Requested',
      'The browser accepted the handoff request. Rama cannot verify that the target application launched.',
      { appName, url, launchConfirmed: false }
    );
  },

  handleWebSearch(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const query = getText(payload.query);

    if (!query) {
      return failure(
        'EXECUTE_WEB_SEARCH',
        requestId,
        'Search Query Required',
        'Provide a non-empty search query.',
        'INVALID_QUERY'
      );
    }

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    if (!openExternalUrl(url)) {
      return failure(
        'EXECUTE_WEB_SEARCH',
        requestId,
        'Search Handoff Not Confirmed',
        'The browser did not confirm a usable new-window reference.',
        'SEARCH_HANDOFF_FAILED',
        true
      );
    }

    return handoff(
      'EXECUTE_WEB_SEARCH',
      requestId,
      'Search Handoff Requested',
      'The browser accepted the search handoff. Page loading and search completion are not verified.',
      { query, url, searchCompleted: false }
    );
  },

  handleDeviceStorageAccess(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const browser = getBrowserWindow();

    if (!browser) {
      return failure(
        'ACCESS_DEVICE_STORAGE',
        requestId,
        'File Selection Unavailable',
        'Device file selection requires the application browser environment.',
        'BROWSER_UNAVAILABLE'
      );
    }

    const category = payload.fileCategory || 'all';

    try {
      browser.dispatchEvent(
        new CustomEvent('cymatic-open-storage-picker', {
          detail: {
            category,
            query: getText(payload.query),
            requestId
          }
        })
      );

      return accepted(
        'ACCESS_DEVICE_STORAGE',
        requestId,
        'File Picker Request Dispatched',
        'The file-picker request was dispatched. Picker visibility, permission, and file selection remain unconfirmed.',
        {
          category,
          pickerConfirmed: false,
          permissionGranted: false,
          fileSelected: false
        }
      );
    } catch (error) {
      return failure(
        'ACCESS_DEVICE_STORAGE',
        requestId,
        'File Picker Request Failed',
        safeErrorMessage(error, 'Could not dispatch the file-picker request.'),
        'FILE_PICKER_DISPATCH_FAILED',
        true
      );
    }
  },

  handleWhatsAppDispatch(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const recipient = (payload.phone || payload.recipient || '').trim();
    const phone = recipient ? normalizePhone(recipient) : '';
    const message = getText(payload.body, MAX_MESSAGE_LENGTH) ?? '';

    if (recipient && (!phone || phone.replace(/\D/g, '').length < 3)) {
      return failure(
        'SEND_WHATSAPP',
        requestId,
        'Invalid Recipient',
        'The supplied telephone number is not valid.',
        'INVALID_PHONE'
      );
    }

    const digits = phone.replace(/\D/g, '');
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    if (!openExternalUrl(url)) {
      return failure(
        'SEND_WHATSAPP',
        requestId,
        'WhatsApp Handoff Not Confirmed',
        'The browser did not confirm a usable handoff. No message was sent by Rama.',
        'WHATSAPP_HANDOFF_FAILED',
        true
      );
    }

    return handoff(
      'SEND_WHATSAPP',
      requestId,
      'WhatsApp Handoff Requested',
      'The WhatsApp handoff was requested. The composer, recipient, and message delivery have not been verified. Review and send the message in WhatsApp.',
      {
        phone: digits || undefined,
        message,
        url,
        composerConfirmed: false,
        sent: false
      }
    );
  },

  handlePhoneCallDispatch(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const rawPhone = payload.phone || payload.recipient || '';
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.replace(/\D/g, '').length < 3) {
      return failure(
        'CALL_PHONE',
        requestId,
        'Invalid Phone Number',
        'Provide a valid telephone number.',
        'INVALID_PHONE'
      );
    }

    const browser = getBrowserWindow();

    if (!browser) {
      return failure(
        'CALL_PHONE',
        requestId,
        'Dialer Handoff Unavailable',
        'The device browser environment is unavailable.',
        'BROWSER_UNAVAILABLE'
      );
    }

    try {
      const anchor = browser.document.createElement('a');
      anchor.href = `tel:${phone}`;
      anchor.rel = 'noreferrer';
      anchor.style.display = 'none';
      browser.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      return handoff(
        'CALL_PHONE',
        requestId,
        'Dialer Handoff Requested',
        'The device was asked to handle the telephone link. Dialer opening and call placement are not verified.',
        { phone, dialerConfirmed: false, callPlaced: false }
      );
    } catch (error) {
      return failure(
        'CALL_PHONE',
        requestId,
        'Dialer Handoff Failed',
        safeErrorMessage(error, 'The telephone link could not be issued.'),
        'DIALER_HANDOFF_FAILED',
        true
      );
    }
  },

  handleEmailDispatch(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const recipient = (payload.email || payload.recipient || '').trim();
    const subject = getText(payload.subject, 200) ?? '';
    const body = getText(payload.body, MAX_MESSAGE_LENGTH) ?? '';

    if (!recipient) {
      return failure(
        'SEND_EMAIL',
        requestId,
        'Recipient Required',
        'Provide the recipient email address.',
        'MISSING_RECIPIENT'
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return failure(
        'SEND_EMAIL',
        requestId,
        'Invalid Email Address',
        'The recipient address does not match the expected email format.',
        'INVALID_EMAIL'
      );
    }

    const browser = getBrowserWindow();

    if (!browser) {
      return failure(
        'SEND_EMAIL',
        requestId,
        'Email Handoff Unavailable',
        'Email handoff requires the application browser environment.',
        'BROWSER_UNAVAILABLE'
      );
    }

    const mailto =
      `mailto:${encodeURIComponent(recipient)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    try {
      browser.location.href = mailto;

      return handoff(
        'SEND_EMAIL',
        requestId,
        'Email Handoff Requested',
        'The mail link was issued. A mail client opening and email delivery have not been confirmed.',
        {
          recipient,
          subject,
          body,
          mailClientConfirmed: false,
          sent: false
        }
      );
    } catch (error) {
      return failure(
        'SEND_EMAIL',
        requestId,
        'Email Handoff Failed',
        safeErrorMessage(error, 'The mail link could not be issued.'),
        'EMAIL_HANDOFF_FAILED',
        true
      );
    }
  },

  async locateQibla(requestId: string): Promise<RamaActionResult> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return failure(
        'LOCATE_QIBLA',
        requestId,
        'Location Capability Unavailable',
        'This environment does not expose browser geolocation.',
        'GEO_UNSUPPORTED'
      );
    }

    return new Promise<RamaActionResult>((resolve) => {
      let settled = false;

      const finish = (result: RamaActionResult) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const { latitude: lat, longitude: lng } = position.coords;

            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lng) ||
              lat < -90 ||
              lat > 90 ||
              lng < -180 ||
              lng > 180
            ) {
              finish(
                failure(
                  'LOCATE_QIBLA',
                  requestId,
                  'Invalid Coordinates',
                  'The location provider returned invalid coordinates.',
                  'INVALID_COORDINATES'
                )
              );
              return;
            }

            const qibla = PrayerCalculationEngine.calculateQibla(lat, lng);

            SpiritualNotifications.setLocation(
              lat,
              lng,
              'Device GPS Position',
              true
            );

            let preferenceSaved = false;

            try {
              localStorage.setItem(
                'sdc_locked_spiritual_tradition',
                'islamic'
              );
              preferenceSaved = true;
            } catch {
              // Report the result without falsely claiming preference persistence.
            }

            finish({
              success: true,
              actionType: 'LOCATE_QIBLA',
              status: 'succeeded',
              title: 'Qibla Bearing Calculated',
              summary:
                `The Qibla bearing was calculated as ${Math.round(qibla.bearing)}° azimuth. ` +
                (preferenceSaved
                  ? 'The local preference was saved.'
                  : 'The local preference could not be saved.'),
              requestId,
              data: {
                qibla,
                locationReceived: true,
                preferenceSaved
              }
            });
          } catch (error) {
            finish(
              failure(
                'LOCATE_QIBLA',
                requestId,
                'Qibla Calculation Failed',
                safeErrorMessage(error, 'Could not calculate the Qibla bearing.'),
                'QIBLA_CALCULATION_FAILED',
                true
              )
            );
          }
        },
        (error) => {
          const codes: Record<number, string> = {
            1: 'GEO_PERMISSION_DENIED',
            2: 'GEO_POSITION_UNAVAILABLE',
            3: 'GEO_TIMEOUT'
          };

          finish(
            failure(
              'LOCATE_QIBLA',
              requestId,
              error.code === 1
                ? 'Location Permission Denied'
                : 'Location Retrieval Failed',
              error.message || 'The device location could not be retrieved.',
              codes[error.code] || 'GEO_ERROR',
              error.code !== 1
            )
          );
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  },

  handleTaskOperation(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const title = getText(payload.query);

    if (!title) {
      return failure(
        'ADD_OR_UPDATE_TASK',
        requestId,
        'Task Title Required',
        'Provide a non-empty task title.',
        'INVALID_TASK'
      );
    }

    try {
      const existing = readArrayFromStorage(LOCAL_TASKS_KEY);

      if (!existing.every(isValidTask)) {
        return failure(
          'ADD_OR_UPDATE_TASK',
          requestId,
          'Task Data Requires Repair',
          'One or more stored tasks do not match the expected schema. Existing data was preserved.',
          'TASK_SCHEMA_INVALID'
        );
      }

      if (payload.taskId) {
        const index = existing.findIndex(
          (item) => item.id === payload.taskId
        );

        if (index < 0) {
          return failure(
            'ADD_OR_UPDATE_TASK',
            requestId,
            'Task Not Found',
            'The task to update does not exist.',
            'TASK_NOT_FOUND'
          );
        }

        const updated = {
          ...existing[index],
          title,
          updatedAt: new Date().toISOString()
        };

        existing[index] = updated;
        saveArrayToStorage(LOCAL_TASKS_KEY, existing);

        return {
          success: true,
          actionType: 'ADD_OR_UPDATE_TASK',
          status: 'succeeded',
          title: 'Task Updated',
          summary: `Updated the local task "${title}".`,
          requestId,
          data: updated
        };
      }

      const task = {
        id: createRequestId(),
        title,
        completed: false,
        priority: 'high',
        createdAt: new Date().toISOString()
      };

      existing.unshift(task);
      saveArrayToStorage(LOCAL_TASKS_KEY, existing);

      return {
        success: true,
        actionType: 'ADD_OR_UPDATE_TASK',
        status: 'succeeded',
        title: 'Task Saved',
        summary: `Saved "${title}" to the local task list.`,
        requestId,
        data: task
      };
    } catch (error) {
      return failure(
        'ADD_OR_UPDATE_TASK',
        requestId,
        'Task Persistence Failed',
        safeErrorMessage(error, 'Could not save the task.'),
        'STORAGE_WRITE_FAILED',
        true
      );
    }
  },

  handleMakeoverOperation(
    payload: RamaActionPayload,
    requestId: string
  ): RamaActionResult {
    const title = getText(payload.query) || 'Workspace Milestone';

    try {
      const existing = readArrayFromStorage(MAKEOVER_KEY);

      if (!existing.every(isValidMilestone)) {
        return failure(
          'UPDATE_ROOM_MAKEOVER',
          requestId,
          'Milestone Data Requires Repair',
          'Stored milestones do not match the expected schema. Existing data was preserved.',
          'MILESTONE_SCHEMA_INVALID'
        );
      }

      const milestone = {
        id: createRequestId(),
        title,
        completed: false,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      existing.unshift(milestone);
      saveArrayToStorage(MAKEOVER_KEY, existing);

      return {
        success: true,
        actionType: 'UPDATE_ROOM_MAKEOVER',
        status: 'succeeded',
        title: 'Workspace Milestone Recorded',
        summary:
          `Recorded "${title}" as a local pending milestone. ` +
          'No physical room change has been performed or verified.',
        requestId,
        data: {
          milestone,
          physicalChangeVerified: false
        }
      };
    } catch (error) {
      return failure(
        'UPDATE_ROOM_MAKEOVER',
        requestId,
        'Milestone Persistence Failed',
        safeErrorMessage(error, 'Could not save the milestone.'),
        'STORAGE_WRITE_FAILED',
        true
      );
    }
  },

  async handleLockdownOperation(
    payload: RamaActionPayload,
    requestId: string
  ): Promise<RamaActionResult> {
    const minutes = payload.minutes ?? 30;

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      return failure(
        'LOCKDOWN_PROTOCOL',
        requestId,
        'Invalid Lockdown Duration',
        'Duration must be an integer from 1 to 180 minutes.',
        'INVALID_DURATION'
      );
    }

    let blocked: string[];

    try {
      const stored = readArrayFromStorage(BLOCKED_PACKAGES_KEY);

      if (
        stored.some(
          item =>
            typeof item !== 'string' ||
            item.trim().length === 0 ||
            item.length > 255
        )
      ) {
        return failure(
          'LOCKDOWN_PROTOCOL',
          requestId,
          'Invalid Lockdown Configuration',
          'The blocked-package list contains invalid entries. Correct the configuration before retrying.',
          'LOCKDOWN_CONFIG_INVALID'
        );
      }

      blocked = [...new Set(stored as string[])];

    } catch (error) {
      return failure(
        'LOCKDOWN_PROTOCOL',
        requestId,
        'Lockdown Configuration Unavailable',
        error instanceof Error
          ? error.message
          : 'Could not read blocked-package configuration.',
        'LOCKDOWN_CONFIG_INVALID',
        true
      );
    }

    try {
      const permissionGranted = await DisciplineBridge.checkPermissions();

      if (permissionGranted !== true) {
        return {
          success: false,
          actionType: 'LOCKDOWN_PROTOCOL',
          status: 'awaiting_permission',
          title: 'Lockdown Permission Required',
          summary: 'Required native permissions were not confirmed. Lockdown was not started by this handler.',
          requestId,
          error: {
            code: 'LOCKDOWN_PERMISSION_REQUIRED',
            message: 'Grant the required native permissions and retry.',
            retryable: true
          }
        };
      }

      const result = await DisciplineBridge.initiateLockdown(
        minutes,
        blocked.join(',')
      );

      if (
        !result ||
        result.active !== true ||
        !Number.isFinite(result.endTime) ||
        result.endTime <= Date.now()
      ) {
        return failure(
          'LOCKDOWN_PROTOCOL',
          requestId,
          'Lockdown Not Confirmed',
          'The bridge did not return a valid active lockdown state. Native enforcement remains unverified.',
          'LOCKDOWN_NOT_CONFIRMED',
          true
        );
      }

      return {
        success: true,
        actionType: 'LOCKDOWN_PROTOCOL',
        status: 'accepted',
        title: 'Lockdown State Accepted',
        summary: 'The bridge returned an active lockdown state. This is not proof that Android enforced every restriction.',
        requestId,
        data: {
          active: result.active,
          durationMinutes: result.durationMinutes,
          endTime: result.endTime,
          restrictedPackages: result.restrictedPackages,
          nativeEnforcementVerified: false
        }
      };

    } catch (error) {
      return failure(
        'LOCKDOWN_PROTOCOL',
        requestId,
        'Lockdown Failed',
        error instanceof Error
          ? error.message
          : 'The discipline bridge failed.',
        'LOCKDOWN_FAILED',
        true
      );
    }
  },

  async handleGoogleSync(
    requestId: string
  ): Promise<RamaActionResult> {
    try {
      const events = await GoogleServiceBridge.fetchCalendarEvents();

      if (
        !Array.isArray(events) ||
        events.some(
          event =>
            !event ||
            typeof event.id !== 'string' ||
            typeof event.summary !== 'string' ||
            !event.start ||
            typeof event.start !== 'object'
        )
      ) {
        return failure(
          'GOOGLE_SYNC',
          requestId,
          'Invalid Calendar Response',
          'Google Calendar returned records that failed validation.',
          'INVALID_CALENDAR_RESPONSE',
          true
        );
      }

      return {
        success: true,
        actionType: 'GOOGLE_SYNC',
        status: 'accepted',
        title: 'Google Calendar Read Completed',
        summary:
          `Retrieved and validated ${events.length} calendar event(s). No destination write or two-way synchronization was performed by this handler.`,
        requestId,
        data: {
          operation: 'calendar_read',
          count: events.length,
          events,
          synchronized: false,
          writeVerified: false
        }
      };

    } catch (error) {
      return failure(
        'GOOGLE_SYNC',
        requestId,
        'Google Calendar Read Failed',
        error instanceof Error
          ? error.message
          : 'Could not retrieve calendar events.',
        'CALENDAR_FETCH_FAILED',
        true
      );
    }
  },

  navigateDisplay(
    route: string,
    label: string,
    requestId: string
  ): RamaActionResult {
    const browser = getBrowserWindow();

    if (!browser) {
      return failure(
        'NAVIGATE_DISPLAY',
        requestId,
        'Navigation Unavailable',
        'The browser environment is unavailable.',
        'BROWSER_UNAVAILABLE'
      );
    }

    const normalizedRoute = route.trim();

    if (
      !normalizedRoute.startsWith('/') ||
      normalizedRoute.startsWith('//') ||
      normalizedRoute.includes('\\') ||
      /[\u0000-\u001f]/.test(normalizedRoute)
    ) {
      return failure(
        'NAVIGATE_DISPLAY',
        requestId,
        'Invalid Local Route',
        'Navigation requires a local absolute route beginning with one slash.',
        'INVALID_ROUTE'
      );
    }

    try {
      browser.location.hash = `#${normalizedRoute}`;

      browser.dispatchEvent(
        new CustomEvent('cymatic-close-hub', {
          detail: { requestId }
        })
      );

      return {
        success: true,
        actionType: 'NAVIGATE_DISPLAY',
        status: 'accepted',
        title: `Navigation Requested: ${label || 'Requested View'}`,
        summary:
          `Requested local route "${normalizedRoute}". ` +
          'The destination rendering has not been independently verified.',
        requestId,
        data: {
          route: normalizedRoute,
          navigationRequested: true,
          destinationVerified: false
        }
      };
    } catch (error) {
      return failure(
        'NAVIGATE_DISPLAY',
        requestId,
        'Navigation Request Failed',
        safeErrorMessage(error, 'Could not request local navigation.'),
        'NAVIGATION_FAILED',
        true
      );
    }
  }
};
