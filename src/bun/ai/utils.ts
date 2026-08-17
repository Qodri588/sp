import { condense, condenseWithDedup, rewriteWithoutMeta } from '@bun/ai/llm-rewriter';
import { postProcessPrompt } from '@bun/prompt/postprocess/index';
import { APP_CONSTANTS } from '@shared/constants';

import type { LanguageModel } from 'ai';

export function cleanTitle(title: string | undefined, fallback = 'Untitled'): string {
  return title?.trim().replace(/^["']|["']$/g, '') || fallback;
}

export function cleanLyrics(lyrics: string | undefined): string | undefined {
  if (!lyrics) return undefined;

  let text = lyrics.trim();

  // Strip markdown code fences the model sometimes wraps lyrics in
  text = text.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

  // Strip a stray leading title/chatter line the model adds before the first
  // section tag (e.g. `"My Song Title"`, `Title: My Song Title`, "Here are...")
  const lines = text.split('\n');
  const firstTagIndex = lines.findIndex((line) => line.trim().startsWith('['));
  if (firstTagIndex > 0) {
    const prefix = lines.slice(0, firstTagIndex).join(' ').trim();
    const looksLikeTitle = /^["'“”].{1,60}["'“”]$/.test(prefix);
    const looksLikeChatter = /^(title|song title|here are|here is|lyrics)(\s*:|:|\s+)/i.test(prefix);
    if (looksLikeTitle || looksLikeChatter) {
      text = lines.slice(firstTagIndex).join('\n').trim();
    }
  }

  return text || undefined;
}

export async function postProcess(
  text: string,
  getModel: () => LanguageModel
): Promise<string> {
  return postProcessPrompt(text, {
    maxChars: APP_CONSTANTS.MAX_PROMPT_CHARS,
    minChars: APP_CONSTANTS.MIN_PROMPT_CHARS,
    rewriteWithoutMeta: (t) => rewriteWithoutMeta(t, getModel),
    condense: (t) => condense(t, getModel),
    condenseWithDedup: (t, repeated) => condenseWithDedup(t, repeated, getModel),
  });
}
