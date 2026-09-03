import { describe, expect, test } from 'bun:test';

import { generateLyrics } from '@bun/ai/content-generator';
import { cleanLyrics } from '@bun/ai/utils';

describe('lyrics generation', () => {
  test('propagates model failures instead of returning a template', async () => {
    let caughtError: unknown;

    try {
      await generateLyrics('a quiet garden at dawn', 'indie folk', 'hopeful', true, () => {
        throw new Error('No language model configured');
      });
    } catch (error: unknown) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toContain('Failed to generate lyrics');
  });

  test('removes the internal Max Mode delimiter from lyrics', () => {
    expect(cleanLyrics('///*****///\n[VERSE]\nA clean lyric line')).toBe(
      '[VERSE]\nA clean lyric line'
    );
  });
});
