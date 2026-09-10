import { runAIRequest } from '@bun/ai/request-runner';
import { cleanLyrics } from '@bun/ai/utils';
import { createLogger } from '@shared/logger';
import {
  DEFAULT_LYRICS_PROMPT_SETTINGS,
  fillLyricsPromptTemplate,
  hasDisabledLyricsSections,
  normalizeLyricsPromptSettings,
} from '@shared/lyrics-settings';

import type { TraceCollector } from '@bun/trace';
import type { LyricsPromptSettings } from '@shared/types';
import type { LyricsExtensionBlock, LyricsExtensionPlacement } from '@shared/types/domain';
import type { LanguageModel } from 'ai';

const log = createLogger('LyricsExtension');
const BASE_SECTION_TAGS = new Set(['intro', 'verse', 'chorus', 'bridge', 'outro']);
const SECTION_TAG_PATTERN = /^\[([^\]]+)\]$/;

function isSectionHeading(line: string): boolean {
  const match = SECTION_TAG_PATTERN.exec(line.trim());
  if (!match) return false;
  const tag = (match[1] ?? '').trim().toLowerCase();
  return /^(intro|verse|chorus|bridge|outro|pre[- ]?chorus|post[- ]?chorus|refrain|hook|interlude|breakdown|coda|reprise|instrumental|solo|drop|build|reverse)\b/.test(
    tag
  );
}

function getExtendedTagLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\[[^\]]+\]$/.test(line));
}

/** Require real extended content instead of accepting a plain lyric response. */
export function isValidLyricsExtension(text: string): boolean {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const tagLines = getExtendedTagLines(text);
  const extendedTagIndexes = tagLines
    .map((tagLine) => lines.indexOf(tagLine))
    .filter(
      (index) =>
        index >= 0 && !BASE_SECTION_TAGS.has((lines[index] ?? '').slice(1, -1).trim().toLowerCase())
    );

  if (extendedTagIndexes.length === 0) return false;

  return extendedTagIndexes.every((tagIndex, index) => {
    const nextTagIndex = extendedTagIndexes[index + 1] ?? lines.length;
    return lines.slice(tagIndex + 1, nextTagIndex).some(Boolean);
  });
}

export interface LyricsExtensionResult {
  extendText: string;
  placement: LyricsExtensionPlacement;
  extensions: LyricsExtensionBlock[];
}

interface ParsedExtensionResponse {
  extensions: LyricsExtensionBlock[];
}

function parseExtensionResponse(raw: string): ParsedExtensionResponse | null {
  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(withoutFence.slice(start, end + 1)) as {
      extensions?: unknown;
      extendText?: unknown;
      insertAfter?: unknown;
      occurrence?: unknown;
    };
    const rawExtensions = Array.isArray(parsed.extensions)
      ? parsed.extensions
      : [
          {
            extendText: parsed.extendText,
            insertAfter: parsed.insertAfter,
            occurrence: parsed.occurrence,
          },
        ];
    const extensions = rawExtensions.flatMap((item): LyricsExtensionBlock[] => {
      if (!item || typeof item !== 'object') return [];
      const block = item as {
        extendText?: unknown;
        insertAfter?: unknown;
        occurrence?: unknown;
      };
      if (
        typeof block.extendText !== 'string' ||
        typeof block.insertAfter !== 'string' ||
        typeof block.occurrence !== 'number'
      ) {
        return [];
      }
      return [
        {
          extendText: cleanLyrics(block.extendText) ?? '',
          placement: {
            insertAfter: block.insertAfter.trim(),
            occurrence: Math.floor(block.occurrence),
          },
        },
      ];
    });

    return extensions.length > 0 ? { extensions } : null;
  } catch {
    return null;
  }
}

function isValidPlacement(lyrics: string, placement: LyricsExtensionPlacement): boolean {
  if (!/^\[[^\]]+\]$/.test(placement.insertAfter) || placement.occurrence < 1) return false;
  const target = placement.insertAfter.trim().toLowerCase();
  const sectionLines = lyrics
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => isSectionHeading(line));
  let occurrence = 0;

  for (const [sectionPosition, { line }] of sectionLines.entries()) {
    if (line.trim().toLowerCase() !== target) continue;
    occurrence += 1;
    if (occurrence === placement.occurrence) {
      // Reject the final section when the song has other sections. This
      // prevents the model's default continuation behavior from turning
      // every extension into an outro while still allowing short one-section
      // lyrics to be extended at their only available point.
      return sectionLines.length < 2 || sectionPosition < sectionLines.length - 1;
    }
  }

  return false;
}

function hasEnoughExtensionBlocks(lyrics: string, extensions: LyricsExtensionBlock[]): boolean {
  const sectionCount = lyrics.split(/\r?\n/).filter((line) => isSectionHeading(line)).length;
  const minimum = sectionCount >= 3 ? 2 : 1;
  const uniquePlacements = new Set(
    extensions.map(
      ({ placement }) => `${placement.insertAfter.toLowerCase()}#${placement.occurrence}`
    )
  );
  return extensions.length >= minimum && uniquePlacements.size === extensions.length;
}

/**
 * Generate an optional extension block for already-generated lyrics.
 * The original lyrics are context only; the model returns the new block.
 */
// eslint-disable-next-line max-lines-per-function
export async function generateLyricsExtension(options: {
  currentLyrics: string;
  genre: string;
  mood: string;
  getModel: () => LanguageModel;
  useSunoTags?: boolean;
  timeoutMs?: number;
  trace?: TraceCollector;
  promptSettings?: Partial<LyricsPromptSettings>;
}): Promise<LyricsExtensionResult> {
  const {
    currentLyrics,
    genre,
    mood,
    getModel,
    useSunoTags = false,
    timeoutMs,
    trace,
    promptSettings = DEFAULT_LYRICS_PROMPT_SETTINGS,
  } = options;
  const settings = normalizeLyricsPromptSettings(promptSettings);
  const customPrompt = fillLyricsPromptTemplate(settings.lyricsExtensionPrompt, {
    topic: 'the existing lyrics',
    genre,
    mood,
    bannedWords: settings.bannedLyricsWords.join(', '),
  });
  const structurePreference = [
    settings.includeLyricsIntro ? null : 'Do not create an [INTRO] section.',
    settings.includeLyricsOutro ? null : 'Do not create an [OUTRO] section.',
  ]
    .filter((rule): rule is string => Boolean(rule))
    .join(' ');
  const systemPrompt = `You are a professional songwriter injecting a focused extension into existing lyrics.

TASK:
- Return JSON only with exactly this field: {"extensions":[{"insertAfter":"[EXISTING SECTION]","occurrence":1,"extendText":"..."}]}.
- Usually return 2-4 extension blocks at different musical moments. When the song has fewer than three sections, return at least one valid block.
- Choose insertion points from the existing section headings. They can be after an intro, verse, pre-chorus, chorus, bridge, refrain, instrumental section, outro, or another suitable heading.
- Do not automatically choose the final section. When two or more sections exist, choose non-final sections so the extensions can live naturally across the song.
- Each insertAfter must exactly match a bracketed section heading already present in the existing lyrics, and occurrence is its 1-based occurrence from top to bottom.
- Each extendText must contain 1-3 new extended performance tags plus real text after them. Each block is inserted before the next existing section after its insertAfter heading.
- You MUST provide real text for every extension block. Never output tags alone or only one block when two or more non-final sections are available.
- Extended tags may describe how instruments or vocals are performed, for example a piano arpeggio, guitar slide, muted bass groove, brushed drums, legato strings, a whispered vocal, or a reverse swell. Choose details that fit the genre, mood, and story.
- Keep each lyric line short, concrete, and connected to the existing story.
- Do not rewrite or repeat the existing lyrics inside extendText.
- Do not include markdown fences, explanations, titles, labels, internal delimiters, or ///*****///.
${settings.bannedLyricsWords.length > 0 ? `- Never use these user-banned words: ${settings.bannedLyricsWords.join(', ')}.\n` : ''}${structurePreference ? `- ${structurePreference}\n` : ''}
USER-CONFIGURED EXTENSION INSTRUCTIONS (MANDATORY):
${customPrompt}

GENRE: ${genre}
MOOD: ${mood}
${useSunoTags ? 'Backing vocals may be used sparingly in parentheses.' : 'Do not add backing vocals in parentheses.'}`;
  const userPrompt = `Existing lyrics:
---
${currentLyrics}
---

Choose several natural insertion points anywhere in the song and return the JSON response now. The result must contain multiple actual extensions when the song structure allows it, not a copy of the existing lyrics.`;

  const requestExtension = async (retry = false): Promise<string> =>
    runAIRequest({
      getModel,
      systemPrompt,
      userPrompt: retry
        ? `${userPrompt}\n\nYour previous response was invalid. Return valid JSON with an extensions array. Provide 2-4 distinct extension blocks when the song has enough sections; each insertAfter must match an existing non-final section heading, and every extendText must contain an extended tag followed by real text. Do not return plain lyrics, one block when multiple positions are available, or tags without content.`
        : userPrompt,
      errorContext: 'extend lyrics with tags',
      timeoutMs,
      trace,
      traceLabel: retry ? 'lyrics.extend.retry' : 'lyrics.extend',
    });

  const validateResponse = (raw: string): LyricsExtensionResult | null => {
    const parsed = parseExtensionResponse(raw);
    if (
      !parsed?.extensions.length ||
      !hasEnoughExtensionBlocks(currentLyrics, parsed.extensions) ||
      parsed.extensions.some(
        ({ extendText, placement }) =>
          !isValidLyricsExtension(extendText) ||
          hasDisabledLyricsSections(extendText, settings) ||
          !isValidPlacement(currentLyrics, placement)
      )
    ) {
      return null;
    }
    const [firstExtension] = parsed.extensions;
    if (!firstExtension) return null;
    return {
      extendText: parsed.extensions.map(({ extendText }) => extendText).join('\n\n'),
      placement: firstExtension.placement,
      extensions: parsed.extensions,
    };
  };

  try {
    const firstResult = validateResponse(await requestExtension());
    if (firstResult) return firstResult;

    const retryResult = validateResponse(await requestExtension(true));
    if (retryResult) return retryResult;

    throw new Error('AI did not return a valid extended tag block with text');
  } catch (error: unknown) {
    log.warn('generateLyricsExtension:failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
