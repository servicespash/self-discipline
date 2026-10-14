// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama Regex-Based Intent Parser
 * Distinguishes between system actions (call, message, play music, vision, discipline) and general chat.
 */

export type RamaIntentType =
  | 'SYSTEM_CALL'
  | 'SYSTEM_MESSAGE'
  | 'SYSTEM_MUSIC'
  | 'SYSTEM_VISION'
  | 'SYSTEM_DISCIPLINE'
  | 'GENERAL_CHAT';

export interface ParsedIntent {
  type: RamaIntentType;
  confidence: number;
  extractedParam?: string;
  subType?: string;
}

export const RamaIntentParser = {
  parse(rawInput: string): ParsedIntent {
    const text = rawInput.toLowerCase().replace(/^(hi\s+rama|hello\s+rama|hey\s+rama|rama)[,\s:]+/i, '').trim();

    // 1. Call Intent regex
    const callRegex = /^(call|dial|phone|make a call|call number)\b/i;
    if (callRegex.test(text) || text.includes('call my') || text.includes('dial number')) {
      const match = text.match(/(?:call|dial|phone)\s+(?:to\s+)?([a-z0-9\s+]+)/i);
      return {
        type: 'SYSTEM_CALL',
        confidence: 0.95,
        extractedParam: match ? match[1].trim() : 'contact'
      };
    }

    // 2. Messaging Intent regex
    const messageRegex = /^(write\s+a?\s*message|send\s+a?\s*message|draft\s+a?\s*message|tell\s+my|message\s+to)\b/i;
    if (messageRegex.test(text) || text.includes('message to mom') || text.includes('message for')) {
      const match = text.match(/(?:to|for|my)\s+([a-z]+)/i);
      return {
        type: 'SYSTEM_MESSAGE',
        confidence: 0.95,
        extractedParam: match ? match[1].trim() : 'Recipient'
      };
    }

    // 3. Music Intent regex
    const musicRegex = /^(play|listen\s+to)\b/i;
    if (musicRegex.test(text) || text.includes('play song') || text.includes('play music') || text.includes('spotify') || text.includes('youtube music')) {
      const platform = text.includes('spotify') ? 'spotify' : text.includes('deezer') ? 'deezer' : text.includes('local') ? 'local' : 'youtube';
      const cleanSong = text.replace(/^(play\s+song|play\s+music|play|listen\s+to)\s+/i, '').replace(/\s+(on|via)\s+(spotify|deezer|youtube|local)/i, '').trim();
      return {
        type: 'SYSTEM_MUSIC',
        confidence: 0.95,
        extractedParam: cleanSong || 'Discipline Focus Stream',
        subType: platform
      };
    }

    // 4. Vision Intent regex
    const visionRegex = /^(open\s+camera|start\s+vision|show\s+vision|camera\s+preview|open\s+screen|screen\s+preview)\b/i;
    if (visionRegex.test(text) || text.includes('camera') || text.includes('screen preview')) {
      const isScreen = text.includes('screen');
      return {
        type: 'SYSTEM_VISION',
        confidence: 0.95,
        extractedParam: isScreen ? 'screen' : 'camera'
      };
    }

    // 5. Discipline & Qibla Intent regex
    const disciplineRegex = /^(locate\s+qibla|find\s+qibla|engage\s+lockdown|add\s+task|sync\s+calendar)\b/i;
    if (disciplineRegex.test(text) || text.includes('qibla') || text.includes('lockdown') || text.includes('task')) {
      return {
        type: 'SYSTEM_DISCIPLINE',
        confidence: 0.90,
        extractedParam: text
      };
    }

    // 6. General Chat
    return {
      type: 'GENERAL_CHAT',
      confidence: 0.90,
      extractedParam: text
    };
  }
};
