import type { LyricsExtensionBlock, LyricsExtensionPlacement } from './types/domain';

const SECTION_TAG_PATTERN = /^\[([^\]]+)\]$/;

function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isSectionHeading(line: string): boolean {
  const match = SECTION_TAG_PATTERN.exec(line.trim());
  if (!match) return false;

  const tag = normalizeTag(match[1] ?? '');
  return /^(intro|verse|chorus|bridge|outro|pre[- ]?chorus|post[- ]?chorus|refrain|hook|interlude|breakdown|coda|reprise|instrumental|solo|drop|build|reverse)\b/.test(
    tag
  );
}

/**
 * Inserts a generated extension before the next song section after the chosen
 * anchor. This keeps the original lyrics intact while allowing the model to
 * choose a musically sensible location instead of always appending at the end.
 */
export function injectLyricsExtension(
  lyrics: string,
  extension: string,
  placement: LyricsExtensionPlacement
): string {
  const lyricLines = lyrics.trim().split(/\r?\n/);
  const target = normalizeTag(placement.insertAfter);
  const requestedOccurrence = Math.max(1, placement.occurrence);
  let occurrence = 0;
  let anchorIndex = -1;

  for (let index = 0; index < lyricLines.length; index += 1) {
    const line = lyricLines[index] ?? '';
    if (!isSectionHeading(line) || normalizeTag(line) !== target) {
      continue;
    }
    occurrence += 1;
    if (occurrence === requestedOccurrence) {
      anchorIndex = index;
      break;
    }
  }

  if (anchorIndex < 0) {
    return `${lyrics.trim()}\n\n${extension.trim()}`.trim();
  }

  const nextSectionIndex = lyricLines.findIndex(
    (line, index) => index > anchorIndex && isSectionHeading(line)
  );
  const insertAt = nextSectionIndex < 0 ? lyricLines.length : nextSectionIndex;
  const before = lyricLines.slice(0, insertAt).join('\n').trimEnd();
  const after = lyricLines.slice(insertAt).join('\n').trimStart();

  return [before, extension.trim(), after].filter(Boolean).join('\n\n').trim();
}

export function injectLyricsExtensions(lyrics: string, extensions: LyricsExtensionBlock[]): string {
  return extensions.reduce(
    (currentLyrics, extension) =>
      injectLyricsExtension(currentLyrics, extension.extendText, extension.placement),
    lyrics
  );
}
