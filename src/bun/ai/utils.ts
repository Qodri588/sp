import { condense, condenseWithDedup, rewriteWithoutMeta } from '@bun/ai/llm-rewriter';
import { postProcessPrompt } from '@bun/prompt/postprocess/index';
import { APP_CONSTANTS } from '@shared/constants';

import type { LanguageModel } from 'ai';

export function cleanTitle(title: string | undefined, fallback = 'Untitled'): string {
  return title?.trim().replace(/^["']|["']$/g, '') || fallback;
}

export function cleanLyrics(lyrics: string | undefined): string | undefined {
  return lyrics?.trim() || undefined;
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
