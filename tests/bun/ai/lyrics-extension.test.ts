import { describe, expect, test } from 'bun:test';

import { isValidLyricsExtension } from '@bun/ai/lyrics-extension';
import { injectLyricsExtension } from '@shared/lyrics-extension';

describe('lyrics extension validation', () => {
  test('accepts an extended tag followed by real text', () => {
    expect(isValidLyricsExtension('[Piano Break: delicate arpeggios]\nHands find the answer')).toBe(
      true
    );
  });

  test('accepts an instrument performance tag with multiple lines', () => {
    expect(
      isValidLyricsExtension('[Guitar Solo: slow bluesy slide]\nA note bends\nThen settles')
    ).toBe(true);
  });

  test('rejects plain lyrics without an extended tag', () => {
    expect(isValidLyricsExtension('[VERSE]\nA line without extension')).toBe(false);
  });

  test('rejects an extended tag with no text', () => {
    expect(isValidLyricsExtension('[Drums: brushed triplets]')).toBe(false);
  });

  test('injects after the selected section instead of always appending', () => {
    const lyrics =
      '[INTRO]\nDawn arrives\n\n[VERSE]\nI keep walking\n\n[CHORUS]\nWe begin again\n\n[OUTRO]\nThe lights fade';
    const result = injectLyricsExtension(lyrics, '[Piano Break]\nKeys answer softly', {
      insertAfter: '[CHORUS]',
      occurrence: 1,
    });

    expect(result).toBe(
      '[INTRO]\nDawn arrives\n\n[VERSE]\nI keep walking\n\n[CHORUS]\nWe begin again\n\n[Piano Break]\nKeys answer softly\n\n[OUTRO]\nThe lights fade'
    );
  });

  test('supports a later occurrence of a repeated section', () => {
    const lyrics = '[VERSE]\nFirst\n\n[CHORUS]\nOne\n\n[VERSE]\nSecond\n\n[CHORUS]\nTwo';
    const result = injectLyricsExtension(lyrics, '[Guitar Solo]\nA slow slide', {
      insertAfter: '[CHORUS]',
      occurrence: 2,
    });

    expect(result.indexOf('[Guitar Solo]')).toBeGreaterThan(result.indexOf('Two'));
  });
});
