/**
 * Lyrics Refinement Logic
 *
 * Contains functions for refining lyrics using LLM.
 * Extracted from refinement.ts for better separation of concerns.
 *
 * @module ai/refinement/lyrics-refinement
 */

import { runAIRequest } from '@bun/ai/request-runner';
import { cleanLyrics } from '@bun/ai/utils';
import { enforceLyricsSectionSettings } from '@bun/ai/lyrics-policy';
import { createLogger } from '@shared/logger';
import { APP_CONSTANTS } from '@shared/constants';
import {
  DEFAULT_LYRICS_PROMPT_SETTINGS,
  fillLyricsPromptTemplate,
  normalizeLyricsPromptSettings,
} from '@shared/lyrics-settings';

import type { RefinementConfig } from '@bun/ai/types';
import type { LyricsPromptSettings } from '@shared/types';
import type { TraceCollector } from '@bun/trace';

const log = createLogger('LyricsRefinement');

async function finalizeRefinedLyrics(options: {
  refinedLyrics: string;
  currentLyrics: string;
  systemPrompt: string;
  config: RefinementConfig;
  timeoutMs: number;
  promptSettings?: Partial<LyricsPromptSettings> | null;
  traceRuntime?: { readonly trace?: TraceCollector; readonly traceLabel?: string };
}): Promise<string> {
  const {
    refinedLyrics,
    currentLyrics,
    systemPrompt,
    config,
    timeoutMs,
    promptSettings,
    traceRuntime,
  } = options;
  return enforceLyricsSectionSettings({
    lyrics: cleanLyrics(refinedLyrics) ?? cleanLyrics(currentLyrics),
    getModel: config.getModel,
    promptSettings,
    systemPrompt,
    context: 'Refined lyrics that must follow the current section settings:',
    timeoutMs,
    trace: traceRuntime?.trace,
    traceLabel: traceRuntime?.traceLabel ?? 'lyrics.refinement',
    errorContext: 'repair refined lyrics section settings',
  });
}

/**
 * Build system prompt for lyrics refinement.
 * Used when lyrics mode is ON (works with both cloud and local LLM).
 *
 * @param genre - Genre for lyrics context
 * @param mood - Mood for lyrics context
 * @param useSunoTags - Whether to use Suno-compatible tags
 * @param maxMode - Whether MAX mode is enabled (requires header)
 * @returns System prompt for lyrics refinement
 */
export function buildLyricsRefinementPrompt(
  genre: string,
  mood: string,
  useSunoTags: boolean,
  maxMode: boolean,
  promptSettings: Partial<LyricsPromptSettings> = DEFAULT_LYRICS_PROMPT_SETTINGS
): string {
  const settings = normalizeLyricsPromptSettings(promptSettings);
  const tagInstructions = useSunoTags
    ? `Use Suno-compatible section tags: [Verse], [Chorus], [Bridge]${settings.includeLyricsIntro ? ', [Intro]' : ''}${settings.includeLyricsOutro ? ', [Outro]' : ''}, etc.`
    : `Use standard section markers like [Verse 1], [Chorus], [Bridge]${settings.includeLyricsIntro ? ', [Intro]' : ''}${settings.includeLyricsOutro ? ', [Outro]' : ''}.`;
  const excludedSections = [
    settings.includeLyricsIntro ? null : 'Do not add an [INTRO] section.',
    settings.includeLyricsOutro ? null : 'Do not add an [OUTRO] section.',
  ]
    .filter((rule): rule is string => Boolean(rule))
    .join('\n- ');
  const customPrompt = fillLyricsPromptTemplate(settings.lyricsPrompt, {
    topic: 'the existing song topic',
    genre,
    mood,
    bannedWords: settings.bannedLyricsWords.join(', '),
  });

  const maxModeInstructions = maxMode
    ? `CRITICAL: The VERY FIRST LINE of your output MUST be exactly:
${APP_CONSTANTS.MAX_MODE_HEADER}

Then continue with the refined lyrics on subsequent lines.

`
    : '';

  return `You are a professional songwriter refining existing lyrics for a ${genre} song with a ${mood} mood.

${maxModeInstructions}TASK: Apply the user's feedback to improve the lyrics while maintaining the song structure.

RULES:
- Keep the same overall structure (verses, chorus, bridge)
- Apply the specific changes requested in the feedback
- Maintain the genre (${genre}) and mood (${mood})
- ${tagInstructions}
- Keep lines singable with natural rhythm
${settings.bannedLyricsWords.length > 0 ? `- Never use these user-banned words: ${settings.bannedLyricsWords.join(', ')}\n` : ''}${excludedSections ? `- ${excludedSections}\n` : ''}- Follow these user-configured lyrics instructions exactly:
${customPrompt}
- Output ONLY the refined lyrics, no explanations

IMPORTANT: Return only the refined lyrics text, nothing else.`;
}

/**
 * Refine only the lyrics using LLM, applying user feedback.
 * Style fields remain unchanged (handled by deterministic refinement).
 *
 * Works with both cloud providers and local Ollama:
 * - Cloud: Uses configured AI provider (Groq/OpenAI/Anthropic)
 * - Offline: Uses local Ollama with Gemma model
 *
 * @param currentLyrics - Current lyrics to refine
 * @param feedback - User feedback to apply
 * @param currentPrompt - Current prompt for genre/mood extraction
 * @param lyricsTopic - Optional topic for context
 * @param config - Configuration with dependencies
 * @param maxMode - Whether MAX mode is enabled (requires header in lyrics)
 * @param ollamaEndpoint - Optional Ollama endpoint for offline mode
 * @returns Refined lyrics
 *
 * @throws {OllamaUnavailableError} When offline mode but Ollama is not running
 * @throws {OllamaModelMissingError} When offline mode but Gemma model is missing
 */
export async function refineLyricsWithFeedback(
  currentLyrics: string,
  feedback: string,
  currentPrompt: string,
  lyricsTopic: string | undefined,
  config: RefinementConfig,
  maxMode: boolean,
  _ollamaEndpoint?: string,
  traceRuntime?: { readonly trace?: TraceCollector; readonly traceLabel?: string }
): Promise<{ lyrics: string }> {
  const { extractGenreFromPrompt, extractMoodFromPrompt } =
    await import('@bun/prompt/deterministic');

  const genre = extractGenreFromPrompt(currentPrompt);
  const mood = extractMoodFromPrompt(currentPrompt);
  const timeoutMs = APP_CONSTANTS.AI.TIMEOUT_MS;

  log.info('refineLyricsWithFeedback:start', {
    genre,
    mood,
    feedbackLength: feedback.length,
    currentLyricsLength: currentLyrics.length,
    maxMode,
  });

  const promptSettings = config.getLyricsPromptSettings?.();
  const systemPrompt = buildLyricsRefinementPrompt(
    genre,
    mood,
    config.getUseSunoTags(),
    maxMode,
    promptSettings
  );
  const userPrompt = `Current lyrics:\n${currentLyrics}\n\nFeedback to apply:\n${feedback}${lyricsTopic ? `\n\nTopic/theme: ${lyricsTopic}` : ''}`;

  const refinedLyrics = await runAIRequest({
    getModel: config.getModel,
    systemPrompt,
    userPrompt,
    errorContext: 'refine lyrics with feedback',
    timeoutMs,
    trace: traceRuntime?.trace,
    traceLabel: traceRuntime?.traceLabel,
  });

  log.info('refineLyricsWithFeedback:complete', {
    outputLength: refinedLyrics.length,
  });

  return {
    lyrics: await finalizeRefinedLyrics({
      refinedLyrics,
      currentLyrics,
      systemPrompt,
      config,
      timeoutMs,
      promptSettings,
      traceRuntime,
    }),
  };
}
