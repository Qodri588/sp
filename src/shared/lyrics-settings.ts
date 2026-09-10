import type { LyricsPromptSettings } from '@shared/types/config';

/** Default words that commonly make generated lyrics sound generic. */
export const DEFAULT_BANNED_LYRICS_WORDS = [
  'shadows',
  'echoes',
  'neon',
  'ignite',
  'spark',
  'whispers',
  'shattered',
  'chains',
  'horizon',
  'ocean',
  'tides',
  'ashes',
  'embers',
  'labyrinth',
  'canvas',
  'symphony',
  'twilight',
  'dawn',
  'constellation',
  'stardust',
  'solitude',
] as const;

/** Editable instructions used for every lyrics generation request. */
export const DEFAULT_LYRICS_PROMPT = `Write complete song lyrics about "{{topic}}".
Use {{genre}} vocabulary and a {{mood}} emotional tone while telling a specific, coherent story.
Output only lyrics with clear section tags. Keep every lyric line short (3-6 words), vivid, singable, and directly tied to the topic.
Avoid meta-lyrics, generic phrasing, and predictable imagery.`;

/** Editable instructions used when the user extends already-generated lyrics. */
export const DEFAULT_LYRICS_EXTENSION_PROMPT = `Extend the existing lyrics with original, concise content that advances the same story.
Choose natural insertion points and return only the requested JSON extension blocks.
Each extension must contain real new lyric text after any performance tag, must fit the genre and mood, and must not copy existing lines.`;

export const DEFAULT_LYRICS_PROMPT_SETTINGS: LyricsPromptSettings = {
  lyricsPrompt: DEFAULT_LYRICS_PROMPT,
  lyricsExtensionPrompt: DEFAULT_LYRICS_EXTENSION_PROMPT,
  bannedLyricsWords: [...DEFAULT_BANNED_LYRICS_WORDS],
  includeLyricsIntro: true,
  includeLyricsOutro: true,
};

export interface LyricsPromptTemplateValues {
  topic?: string;
  genre?: string;
  mood?: string;
  bannedWords?: string;
}

/** Replace the small set of documented placeholders in an editable prompt. */
export function fillLyricsPromptTemplate(
  template: string,
  values: LyricsPromptTemplateValues
): string {
  const replacements: Record<string, string> = {
    topic: values.topic ?? '{{topic}}',
    genre: values.genre ?? '{{genre}}',
    mood: values.mood ?? '{{mood}}',
    banned_words: values.bannedWords ?? '{{banned_words}}',
  };

  return template.replace(/{{\s*(topic|genre|mood|banned_words)\s*}}/gi, (_, key: string) => {
    return replacements[key.toLowerCase()] ?? '';
  });
}

/** Normalize persisted settings so older config files remain compatible. */
export function normalizeLyricsPromptSettings(
  settings?: Partial<LyricsPromptSettings> | null
): LyricsPromptSettings {
  const bannedLyricsWords = Array.isArray(settings?.bannedLyricsWords)
    ? Array.from(
        new Map(
          settings.bannedLyricsWords
            .filter((word): word is string => typeof word === 'string')
            .map((word) => [word.trim().toLocaleLowerCase(), word.trim()] as const)
            .filter(([key, value]) => Boolean(key && value))
        ).values()
      )
    : [...DEFAULT_BANNED_LYRICS_WORDS];

  return {
    lyricsPrompt:
      typeof settings?.lyricsPrompt === 'string' && settings.lyricsPrompt.trim()
        ? settings.lyricsPrompt.trim()
        : DEFAULT_LYRICS_PROMPT,
    lyricsExtensionPrompt:
      typeof settings?.lyricsExtensionPrompt === 'string' && settings.lyricsExtensionPrompt.trim()
        ? settings.lyricsExtensionPrompt.trim()
        : DEFAULT_LYRICS_EXTENSION_PROMPT,
    bannedLyricsWords,
    includeLyricsIntro:
      typeof settings?.includeLyricsIntro === 'boolean' ? settings.includeLyricsIntro : true,
    includeLyricsOutro:
      typeof settings?.includeLyricsOutro === 'boolean' ? settings.includeLyricsOutro : true,
  };
}

export function cloneLyricsPromptSettings(
  settings?: Partial<LyricsPromptSettings> | null
): LyricsPromptSettings {
  const normalized = normalizeLyricsPromptSettings(settings);
  return { ...normalized, bannedLyricsWords: [...normalized.bannedLyricsWords] };
}

const SECTION_TAG_PATTERN = /^\s*\[([^\]]+)\]/;
const LYRICS_SECTION_PATTERN =
  /^(intro|outro|verse|chorus|bridge|pre[- ]?chorus|post[- ]?chorus|refrain|hook|interlude|breakdown|coda|reprise)\b/i;

function getLyricsSectionTag(line: string): string | undefined {
  const match = SECTION_TAG_PATTERN.exec(line);
  const tag = match?.[1]?.trim();
  return tag && LYRICS_SECTION_PATTERN.test(tag) ? tag : undefined;
}

/** Detect forbidden top-level intro/outro sections in an AI response. */
export function hasDisabledLyricsSections(
  lyrics: string | undefined,
  settings?: Partial<LyricsPromptSettings> | null
): boolean {
  if (!lyrics) return false;

  const normalized = normalizeLyricsPromptSettings(settings);
  if (normalized.includeLyricsIntro && normalized.includeLyricsOutro) return false;

  return lyrics.split(/\r?\n/).some((line) => {
    const sectionTag = getLyricsSectionTag(line)?.toLowerCase() ?? '';
    return (
      (sectionTag.startsWith('intro') && !normalized.includeLyricsIntro) ||
      (sectionTag.startsWith('outro') && !normalized.includeLyricsOutro)
    );
  });
}
