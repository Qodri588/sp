/**
 * Enforcement helpers for user-configured lyrics section rules.
 *
 * The model remains responsible for rewriting the song. This module only
 * detects a forbidden section and asks the model for a complete correction;
 * it never removes lines by slicing the generated text.
 *
 * @module ai/lyrics-policy
 */

import { runAIRequest } from '@bun/ai/request-runner';
import { cleanLyrics } from '@bun/ai/utils';
import { APP_CONSTANTS } from '@shared/constants';
import {
  fillLyricsPromptTemplate,
  hasDisabledLyricsSections,
  normalizeLyricsPromptSettings,
} from '@shared/lyrics-settings';

import type { LyricsPromptSettings } from '@shared/types';
import type { TraceCollector } from '@bun/trace';
import type { LanguageModel } from 'ai';

function getForbiddenSections(settings: LyricsPromptSettings): string[] {
  return [
    settings.includeLyricsIntro ? null : '[INTRO]',
    settings.includeLyricsOutro ? null : '[OUTRO]',
  ].filter((section): section is string => Boolean(section));
}

/**
 * Ensure a lyrics response follows the Intro/Outro settings.
 *
 * A valid response is returned unchanged (apart from normal cleanup). When a
 * forbidden section is found, the model receives the complete draft and must
 * return a coherent replacement. A second invalid response is rejected so it
 * cannot be saved or displayed as if it were valid.
 */
export async function enforceLyricsSectionSettings(options: {
  lyrics: string | undefined;
  getModel: () => LanguageModel;
  promptSettings?: Partial<LyricsPromptSettings> | null;
  /** Existing system prompt, when the repair belongs to another operation. */
  systemPrompt?: string;
  /** Additional context for a repair with no existing generation prompt. */
  context?: string;
  timeoutMs?: number;
  trace?: TraceCollector;
  traceLabel?: string;
  errorContext?: string;
}): Promise<string> {
  const cleanedLyrics = cleanLyrics(options.lyrics);
  if (!hasDisabledLyricsSections(cleanedLyrics, options.promptSettings)) {
    return cleanedLyrics ?? '';
  }

  const settings = normalizeLyricsPromptSettings(options.promptSettings);
  const forbiddenSections = getForbiddenSections(settings);
  const customPrompt = fillLyricsPromptTemplate(settings.lyricsPrompt, {
    topic: 'the existing song',
    genre: 'the existing genre',
    mood: 'the existing mood',
    bannedWords: settings.bannedLyricsWords.join(', '),
  });
  const systemPrompt = [
    options.systemPrompt?.trim() ||
      'You are a professional songwriter repairing an existing song while preserving its story and musical coherence.',
    '',
    'SECTION SETTINGS (MANDATORY):',
    `- Omit ${forbiddenSections.join(' and ')} completely, including every line belonging to those sections.`,
    '- Preserve every allowed section, the story, the emotional arc, and singable rhythm.',
    '- Rewrite the COMPLETE lyrics; do not return only the removed section or a summary.',
    '- Return ONLY the corrected lyrics. Do not explain the correction.',
    '- Follow these user-configured lyrics instructions exactly:',
    customPrompt,
  ].join('\n');
  const userPrompt = [
    options.context?.trim() || 'Existing lyrics that must be corrected:',
    '---',
    cleanedLyrics ?? options.lyrics ?? '',
    '---',
    '',
    'Return the complete corrected lyrics now. Do not include the forbidden sections.',
  ].join('\n');

  const repairedLyrics = await runAIRequest({
    getModel: options.getModel,
    systemPrompt,
    userPrompt,
    errorContext: options.errorContext ?? 'repair lyrics section settings',
    timeoutMs: options.timeoutMs ?? APP_CONSTANTS.AI.TIMEOUT_MS,
    trace: options.trace,
    traceLabel: options.traceLabel
      ? `${options.traceLabel}.repair-sections`
      : 'lyrics.repair-sections',
  });
  const cleanedRepairedLyrics = cleanLyrics(repairedLyrics);

  if (
    !cleanedRepairedLyrics ||
    hasDisabledLyricsSections(cleanedRepairedLyrics, options.promptSettings)
  ) {
    throw new Error('AI returned lyrics with disabled sections after correction');
  }

  return cleanedRepairedLyrics;
}
