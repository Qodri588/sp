import { type LanguageModel } from 'ai';

import { generateTitle, generateLyrics } from '@bun/ai/content-generator';
import { createLogger } from '@shared/logger';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/prompt/deterministic';
import { APP_CONSTANTS } from '@shared/constants';

import type { TraceCollector } from '@bun/trace';

const log = createLogger('Remix');

export async function remixTitle(
  currentPrompt: string,
  originalInput: string,
  getModel: () => LanguageModel,
  _ollamaEndpoint?: string,
  currentLyrics?: string,
  traceRuntime?: { readonly trace?: TraceCollector; readonly traceLabel?: string }
): Promise<{ title: string }> {
  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);

  log.info('remixTitle', { genre, mood, hasLyrics: !!currentLyrics });

  const result = await generateTitle({
    description: originalInput,
    genre,
    mood,
    getModel,
    lyrics: currentLyrics,
    trace: traceRuntime?.trace,
    traceLabel: traceRuntime?.traceLabel,
  });
  return { title: result.title };
}

export async function remixLyrics(
  currentPrompt: string,
  originalInput: string,
  lyricsTopic: string | undefined,
  maxMode: boolean,
  getModel: () => LanguageModel,
  useSunoTags = false,
  _isOffline = false,
  _ollamaEndpoint?: string,
  traceRuntime?: { readonly trace?: TraceCollector; readonly traceLabel?: string }
): Promise<{ lyrics: string }> {
  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const topicForLyrics = lyricsTopic?.trim() || originalInput;

  const timeoutMs = APP_CONSTANTS.AI.TIMEOUT_MS;

  const result = await generateLyrics(
    topicForLyrics,
    genre,
    mood,
    maxMode,
    getModel,
    useSunoTags,
    timeoutMs,
    traceRuntime
  );
  return { lyrics: result.lyrics };
}
