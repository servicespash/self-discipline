/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Professional Semantic Intent Parser for Rama AI
 * Combines fuzzy natural language pattern matching with structured entity extraction.
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
  originalQuery: string;
}

export const RamaIntentParser = {
  parse(rawInput: string): ParsedIntent {
    const query = rawInput.trim();
    const text = query.toLowerCase().replace(/^(hi\s+rama|hello\s+rama|hey\s+rama|rama|please)[,\s:]+/i, '').trim();

    // 1. Telephony / Call Intent
    if (/(?:call|dial|phone|ring|connect\s+to)\b/i.test(text)) {
      const match = text.match(/(?:call|dial|phone|ring|connect\s+to)\s+(?:to\s+)?([a-z0-9\s+]+)/i);
      return {
        type: 'SYSTEM_CALL',
        confidence: 0.98,
        extractedParam: match ? match[1].trim() : 'Emergency Contact',
        originalQuery: query
      };
    }

    // 2. Messaging / WhatsApp / Email Intent
    if (/(?:write|send|draft|tell|message)\s+(?:a\s+)?(?:message|email|text|whatsapp)\b/i.test(text) || text.includes('message to') || text.includes('email to')) {
      const recipientMatch = text.match(/(?:to|for|my)\s+([a-z]+)/i);
      return {
        type: 'SYSTEM_MESSAGE',
        confidence: 0.97,
        extractedParam: recipientMatch ? recipientMatch[1].trim() : 'Recipient',
        originalQuery: query
      };
    }

    // 3. Music & Streaming Intent
    if (/(?:play|listen\s+to|stream)\b/i.test(text)) {
      const platform = text.includes('spotify') ? 'spotify' : text.includes('deezer') ? 'deezer' : text.includes('local') ? 'local' : 'youtube';
      const cleanSong = text.replace(/^(?:play\s+song|play\s+music|play|listen\s+to|stream)\s+/i, '').replace(/\s+(?:on|via)\s+(?:spotify|deezer|youtube|local)/i, '').trim();
      return {
        type: 'SYSTEM_MUSIC',
        confidence: 0.96,
        extractedParam: cleanSong || 'Discipline Focus Stream',
        subType: platform,
        originalQuery: query
      };
    }

    // 4. Vision & Camera Intent
    if (/(?:open\s+camera|start\s+vision|show\s+vision|camera\s+preview|screen\s+preview)\b/i.test(text)) {
      const isScreen = text.includes('screen');
      return {
        type: 'SYSTEM_VISION',
        confidence: 0.98,
        extractedParam: isScreen ? 'screen' : 'camera',
        originalQuery: query
      };
    }

    // 5. Discipline & Lockdown Intent
    if (/(?:locate\s+qibla|find\s+qibla|engage\s+lockdown|start\s+lockdown|add\s+task|sync\s+calendar)\b/i.test(text)) {
      return {
        type: 'SYSTEM_DISCIPLINE',
        confidence: 0.95,
        extractedParam: text,
        originalQuery: query
      };
    }

    // 6. Default General Semantic Chat
    return {
      type: 'GENERAL_CHAT',
      confidence: 0.90,
      extractedParam: text,
      originalQuery: query
    };
  }
};
