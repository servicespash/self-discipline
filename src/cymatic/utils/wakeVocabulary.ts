/**
 * Unified wake-word vocabulary for Cymatic.
 *
 * - "assistant" target: summons the Rama floating sheet over whatever is on screen.
 * - "app" target: brings the whole Cymatic Discipline OS to the foreground.
 *
 * Speech engines often mis-hear names, so each target lists the common
 * transcriptions (e.g. "Llama" for "Rama", "Displine" for "Discipline").
 */

export type WakeTarget = 'assistant' | 'app';

export interface WakeMatch {
  target: WakeTarget;
  phrase: string;
  /** Whatever the user said after the wake phrase, if anything. */
  command: string;
}

const ASSISTANT_NAMES = ['rama', 'llama', 'lama', 'rahma', 'ramah'];
const APP_NAMES = ['discipline', 'displine', 'disciplin', 'diss pline', 'dis pline'];
const ASSISTANT_PREFIXES = ['hey', 'hi', 'hello', 'okay', 'ok'];
const APP_PREFIXES = ['hey', 'hi', 'open', 'launch', 'start', 'wake up', 'wake'];

function buildPhrases(prefixes: string[], names: string[]): string[] {
  const out: string[] = [];
  for (const p of prefixes) for (const n of names) out.push(`${p} ${n}`);
  // Longest first so "wake up discipline" wins over "wake discipline".
  return out.sort((a, b) => b.length - a.length);
}

const APP_PHRASES = buildPhrases(APP_PREFIXES, APP_NAMES);
const ASSISTANT_PHRASES = buildPhrases(ASSISTANT_PREFIXES, ASSISTANT_NAMES);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectWakeWord(transcript: string): WakeMatch | null {
  const text = normalize(transcript);
  if (!text) return null;

  // App phrases are checked first: "open discipline" must never open only the sheet.
  for (const [target, phrases] of [
    ['app', APP_PHRASES],
    ['assistant', ASSISTANT_PHRASES],
  ] as const) {
    for (const phrase of phrases) {
      const re = new RegExp(`(^|\\s)${phrase}(\\s|$)`);
      const m = re.exec(text);
      if (m) {
        const command = text.slice(m.index + m[0].length).trim();
        return { target, phrase, command };
      }
    }
  }
  return null;
}
