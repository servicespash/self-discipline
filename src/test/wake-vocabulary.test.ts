import { describe, it, expect } from 'vitest';
import { detectWakeWord } from '@/cymatic/utils/wakeVocabulary';

describe('wake vocabulary', () => {
  it('"Hey Rama" opens the floating assistant', () => {
    expect(detectWakeWord('Hey Rama')?.target).toBe('assistant');
  });
  it('"Hi Llama" (mis-heard Rama) opens the floating assistant', () => {
    expect(detectWakeWord('hi llama')?.target).toBe('assistant');
  });
  it('"Hey Discipline" opens the full app', () => {
    expect(detectWakeWord('Hey Discipline')?.target).toBe('app');
  });
  it('"Open Displine" opens the full app', () => {
    expect(detectWakeWord('open displine')?.target).toBe('app');
  });
  it('"open display" is not a wake word', () => {
    expect(detectWakeWord('open display')).toBeNull();
  });
  it('passes on the command spoken after the wake word', () => {
    expect(detectWakeWord('Hey Rama, play some music')?.command).toBe('play some music');
  });
});
