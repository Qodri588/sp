/**
 * Generation Path: Offline Lyrics (Ollama)
 *
 * Offline generation path - Ollama support has been removed.
 * Delegates to cloud LLM path instead.
 *
 * @module ai/generation/paths/offline-lyrics
 */

import { createLogger } from '@shared/logger';

import { generateWithLyrics } from './with-lyrics';

import type { GenerateInitialOptions, TraceRuntime } from '@bun/ai/generation/types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';

const log = createLogger('Generation');

/**
 * Offline generation path (Ollama support removed).
 *
 * Delegates to standard cloud LLM path with offline flag.
 */
export async function generateWithOfflineLyrics(
  options: GenerateInitialOptions,
  config: GenerationConfig,
  runtime?: TraceRuntime
): Promise<GenerationResult> {
  log.info('generateWithOfflineLyrics:start', { deprecated: 'Ollama support removed' });

  // Delegate to standard generation
  return generateWithLyrics(options, config, false, runtime);
}
