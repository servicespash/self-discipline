/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Rama Intent Parser
 *
 * Responsibilities:
 * - Classify supported user commands.
 * - Extract only information supported by the input.
 * - Flag incomplete or ambiguous commands for clarification.
 * - Never represent general chat as an executable action.
 *
 * This is a deterministic rule-based parser, not an LLM or a
 * statistically calibrated semantic model.
 */

import type {
  RamaActionType,
  RamaActionPayload
} from './ramaActionEngine';

export type RamaParsedActionType = RamaActionType | 'GENERAL_CHAT';

export interface ParsedIntentResult {
  actionType: RamaParsedActionType;
  confidence: number;
  payload: RamaActionPayload | null;
  originalQuery: string;
  needsClarification: boolean;
  clarificationPrompt?: string;
}

const DEFAULT_EMAIL_SUBJECT = 'Cymatic Discipline OS Dispatch';

function cleanInput(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCommand(input: string): string {
  return cleanInput(input)
    .replace(
      /^(?:(?:hi|hello|hey)\s+)?rama\b[\s,:!.-]*/i,
      ''
    )
    .replace(/^(?:please|kindly)\s+/i, '')
    .trim();
}

function makeResult(
  originalQuery: string,
  actionType: RamaParsedActionType,
  confidence: number,
  payload: RamaActionPayload | null,
  options: {
    needsClarification?: boolean;
    clarificationPrompt?: string;
  } = {}
): ParsedIntentResult {
  return {
    actionType,
    confidence,
    payload,
    originalQuery,
    needsClarification: options.needsClarification ?? false,
    ...(options.clarificationPrompt
      ? { clarificationPrompt: options.clarificationPrompt }
      : {})
  };
}

function clarify(
  originalQuery: string,
  actionType: RamaActionType,
  payload: RamaActionPayload,
  prompt: string,
  confidence = 0.65
): ParsedIntentResult {
  return makeResult(originalQuery, actionType, confidence, payload, {
    needsClarification: true,
    clarificationPrompt: prompt
  });
}

function extractPhone(input: string): string | undefined {
  const match = input.match(
    /(?:\+\s*\d[\d\s().-]{5,}\d|\b\d[\d\s().-]{5,}\d\b)/
  );

  if (!match) return undefined;

  const raw = match[0].trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length < 7 || digits.length > 15) {
    return undefined;
  }

  return raw.startsWith('+') ? `+${digits}` : digits;
}

function extractEmail(input: string): string | undefined {
  const match = input.match(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  );

  return match?.[0];
}

function extractMessageBody(input: string): string | undefined {
  const match = input.match(
    /\b(?:saying|message|text|body)\s*[:=]?\s*(.+)$/i
  );

  const body = match?.[1]?.trim();
  return body || undefined;
}

function extractSubject(input: string): string | undefined {
  const match = input.match(
    /\bsubject\s*[:=]\s*(.+?)(?=\s+\b(?:body|saying)\s*[:=]?|$)/i
  );

  return match?.[1]?.trim();
}

function extractDurationMinutes(input: string): number | undefined {
  const hours = input.match(/\b(\d+)\s*(?:hours?|hrs?|h)\b/i);

  if (hours) {
    return Number(hours[1]) * 60;
  }

  const minutes = input.match(/\b(\d+)\s*(?:minutes?|mins?|m)\b/i);

  if (minutes) {
    return Number(minutes[1]);
  }

  return undefined;
}

function extractAfterCommand(
  input: string,
  pattern: RegExp
): string {
  return input.replace(pattern, '').trim().replace(/[.!?]+$/, '').trim();
}

export const RamaIntentParser = {
  parse(rawInput: string): ParsedIntentResult {
    const originalQuery =
      typeof rawInput === 'string' ? rawInput.trim() : '';

    if (!originalQuery) {
      return makeResult(
        originalQuery,
        'GENERAL_CHAT',
        0,
        null,
        {
          needsClarification: true,
          clarificationPrompt: 'Enter a request for Rama.'
        }
      );
    }

    const text = normalizeCommand(originalQuery);

    if (!text) {
      return makeResult(originalQuery, 'GENERAL_CHAT', 0.1, null);
    }

    /*
     * 1. Qibla
     * Match this before generic location or navigation language.
     */
    if (
      /\b(?:locate|find|show|calculate)\s+(?:the\s+)?qibla\b/i.test(text) ||
      /\bqibla\s+(?:compass|direction|bearing)\b/i.test(text) ||
      /\bdirection\s+to\s+(?:the\s+)?kaaba\b/i.test(text)
    ) {
      return makeResult(originalQuery, 'LOCATE_QIBLA', 0.96, {
        actionType: 'LOCATE_QIBLA'
      });
    }

    /*
     * 2. Phone calls
     * Never treat a contact name as a telephone number.
     */
    if (
      /^(?:call|dial|phone|ring|connect\s+to)\b/i.test(text)
    ) {
      const phone = extractPhone(text);
      const target = extractAfterCommand(
        text,
        /^(?:call|dial|phone|ring|connect\s+to)\s*/i
      );

      if (!phone) {
        return clarify(
          originalQuery,
          'CALL_PHONE',
          {
            actionType: 'CALL_PHONE',
            recipient: target || undefined
          },
          target
            ? `I found "${target}" as a possible contact name, not a verified phone number. Provide the phone number to open the dialer.`
            : 'Which phone number should Rama open in the dialer?',
          0.72
        );
      }

      return makeResult(originalQuery, 'CALL_PHONE', 0.93, {
        actionType: 'CALL_PHONE',
        phone,
        recipient: phone
      });
    }

    /*
     * 3. WhatsApp messages
     */
    if (
      /\bwhatsapp\b/i.test(text) ||
      /^send\s+(?:a\s+)?message\b/i.test(text) ||
      /^message\b/i.test(text)
    ) {
      const phone = extractPhone(text);
      const body = extractMessageBody(text);

      const recipientMatch = text.match(
        /\bto\s+(.+?)(?=\s+\b(?:saying|message|text|body)\b|$)/i
      );

      const recipientText = recipientMatch?.[1]?.trim();

      if (recipientText && !phone) {
        return clarify(
          originalQuery,
          'SEND_WHATSAPP',
          {
            actionType: 'SEND_WHATSAPP',
            recipient: recipientText,
            body
          },
          `Provide the phone number for "${recipientText}". Contact-name lookup is not implemented by this parser.`,
          0.68
        );
      }

      if (!phone && !body && /\bto\b/i.test(text)) {
        return clarify(
          originalQuery,
          'SEND_WHATSAPP',
          {
            actionType: 'SEND_WHATSAPP'
          },
          'Provide a recipient phone number and the message text.',
          0.6
        );
      }

      return makeResult(originalQuery, 'SEND_WHATSAPP', 0.86, {
        actionType: 'SEND_WHATSAPP',
        ...(phone ? { phone } : {}),
        ...(body ? { body } : {})
      });
    }

    /*
     * 4. Email
     */
    if (
      /\b(?:email|e-mail)\b/i.test(text) ||
      /\b(?:draft|write|send)\s+(?:an?\s+)?email\b/i.test(text)
    ) {
      const email = extractEmail(text);
      const subject = extractSubject(text);
      const body = extractMessageBody(text);

      const payload: RamaActionPayload = {
        actionType: 'SEND_EMAIL',
        ...(email ? { email } : {}),
        ...(subject ? { subject } : {}),
        ...(body ? { body } : {})
      };

      if (!email) {
        return clarify(
          originalQuery,
          'SEND_EMAIL',
          payload,
          'What recipient email address should be used?',
          0.72
        );
      }

      return makeResult(originalQuery, 'SEND_EMAIL', 0.91, {
        ...payload,
        subject: subject || DEFAULT_EMAIL_SUBJECT,
        body: body || ''
      });
    }

    /*
     * 5. Audio playback
     * Do not invent a default track when the query is empty.
     */
    if (
      /^(?:play|stream|listen\s+to)\b/i.test(text) ||
      /\bplay\s+(?:some\s+)?music\b/i.test(text)
    ) {
      const trackQuery = extractAfterCommand(
        text,
        /^(?:play(?:\s+(?:some\s+)?(?:song|music))?|stream|listen\s+to)\s*/i
      );

      if (!trackQuery || /^(?:something|anything|music|a song)$/i.test(trackQuery)) {
        return clarify(
          originalQuery,
          'PLAY_SONG',
          { actionType: 'PLAY_SONG' },
          'What song, artist, genre, or audio should I search for?',
          0.7
        );
      }

      return makeResult(originalQuery, 'PLAY_SONG', 0.9, {
        actionType: 'PLAY_SONG',
        query: trackQuery
      });
    }

    /*
     * 6. App launching
     */
    if (
      /^(?:open|launch|start)\b/i.test(text)
    ) {
      const appName = extractAfterCommand(
        text,
        /^(?:open|launch|start)(?:\s+the)?(?:\s+app)?\s*/i
      );

      if (!appName) {
        return clarify(
          originalQuery,
          'OPEN_APP',
          { actionType: 'OPEN_APP' },
          'Which application or website should I open?',
          0.65
        );
      }

      return makeResult(originalQuery, 'OPEN_APP', 0.86, {
        actionType: 'OPEN_APP',
        targetApp: appName
      });
    }

    /*
     * 7. Lockdown
     * Parse explicit duration units, not just any number in the sentence.
     */
    if (
      /\b(?:lockdown|focus\s+lock|engage\s+lock|start\s+focus\s+mode)\b/i.test(text)
    ) {
      const minutes = extractDurationMinutes(text);

      if (minutes !== undefined && (
        !Number.isInteger(minutes) ||
        minutes < 1 ||
        minutes > 180
      )) {
        return clarify(
          originalQuery,
          'LOCKDOWN_PROTOCOL',
          {
            actionType: 'LOCKDOWN_PROTOCOL',
            minutes
          },
          'Lockdown duration must be between 1 and 180 minutes. Specify a valid duration.',
          0.8
        );
      }

      return makeResult(originalQuery, 'LOCKDOWN_PROTOCOL', 0.89, {
        actionType: 'LOCKDOWN_PROTOCOL',
        ...(minutes !== undefined ? { minutes } : {})
      });
    }

    /*
     * 8. Task creation
     */
    if (
      /\b(?:add|create|schedule)\s+(?:a\s+)?task\b/i.test(text)
    ) {
      const title = extractAfterCommand(
        text,
        /^(?:add|create|schedule)\s+(?:a\s+)?task(?:\s+(?:named|called|to))?\s*/i
      );

      if (!title || /^(?:named|called|to)$/i.test(title)) {
        return clarify(
          originalQuery,
          'ADD_OR_UPDATE_TASK',
          { actionType: 'ADD_OR_UPDATE_TASK' },
          'What task should I add?',
          0.68
        );
      }

      return makeResult(originalQuery, 'ADD_OR_UPDATE_TASK', 0.9, {
        actionType: 'ADD_OR_UPDATE_TASK',
        query: title
      });
    }

    /*
     * 9. Workspace makeover milestone
     */
    if (
      /\b(?:room makeover|workspace makeover|update workspace|record makeover)\b/i.test(text)
    ) {
      const title = extractAfterCommand(
        text,
        /^(?:update\s+)?(?:the\s+)?(?:room|workspace)\s+makeover\s*/i
      );

      return makeResult(originalQuery, 'UPDATE_ROOM_MAKEOVER', 0.82, {
        actionType: 'UPDATE_ROOM_MAKEOVER',
        ...(title ? { query: title } : {})
      });
    }

    /*
     * 10. Device file picker
     */
    if (
      /\b(?:open|browse|select|choose)\s+(?:my\s+)?(?:device\s+)?(?:files?|storage|gallery|documents?)\b/i.test(text)
    ) {
      let fileCategory: RamaActionPayload['fileCategory'] = 'all';

      if (/\b(?:photos?|images?|gallery)\b/i.test(text)) {
        fileCategory = 'image';
      } else if (/\b(?:audio|music|songs?)\b/i.test(text)) {
        fileCategory = 'audio';
      } else if (/\b(?:documents?|pdfs?)\b/i.test(text)) {
        fileCategory = 'document';
      }

      return makeResult(originalQuery, 'ACCESS_DEVICE_STORAGE', 0.84, {
        actionType: 'ACCESS_DEVICE_STORAGE',
        fileCategory
      });
    }

    /*
     * 11. Web search
     */
    if (
      /^(?:search(?:\s+the\s+web)?\s+for|look\s+up|google)\b/i.test(text)
    ) {
      const searchQuery = extractAfterCommand(
        text,
        /^(?:search(?:\s+the\s+web)?\s+for|look\s+up|google)\s*/i
      );

      if (!searchQuery) {
        return clarify(
          originalQuery,
          'EXECUTE_WEB_SEARCH',
          { actionType: 'EXECUTE_WEB_SEARCH' },
          'What should I search for?',
          0.65
        );
      }

      return makeResult(originalQuery, 'EXECUTE_WEB_SEARCH', 0.9, {
        actionType: 'EXECUTE_WEB_SEARCH',
        query: searchQuery
      });
    }

    /*
     * 12. In-app navigation
     */
    if (
      /^(?:navigate\s+to|go\s+to|show\s+me)\b/i.test(text)
    ) {
      const destination = extractAfterCommand(
        text,
        /^(?:navigate\s+to|go\s+to|show\s+me)\s*/i
      );

      if (!destination) {
        return clarify(
          originalQuery,
          'NAVIGATE_DISPLAY',
          { actionType: 'NAVIGATE_DISPLAY' },
          'Which page or view should I navigate to?',
          0.65
        );
      }

      return makeResult(originalQuery, 'NAVIGATE_DISPLAY', 0.8, {
        actionType: 'NAVIGATE_DISPLAY',
        route: destination.startsWith('/')
          ? destination
          : `/${destination}`,
        query: destination
      });
    }

    /*
     * 13. General chat
     *
     * A null payload is intentional. The caller must route this to the
     * chat response handler and must not send it to executeAction().
     */
    return makeResult(
      originalQuery,
      'GENERAL_CHAT',
      0.5,
      null
    );
  }
};
