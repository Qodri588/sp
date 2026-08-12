// AI Provider and Configuration types

export type AIProvider = 'groq' | 'openai' | 'anthropic';

export interface APIKeys {
  groq: string | null;
  openai: string | null;
  anthropic: string | null;
}

export const DEFAULT_API_KEYS: APIKeys = {
  groq: null,
  openai: null,
  anthropic: null,
};

import type { PromptMode, CreativeBoostMode } from '@shared/types/domain';

export interface AppConfig {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  /** Custom base URL for OpenAI-compatible APIs (e.g. 9router) */
  openaiBaseUrl?: string | null;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  /** Whether to generate prompts in narrative prose format (requires LLM) */
  storyMode: boolean;
  promptMode: PromptMode;
  creativeBoostMode: CreativeBoostMode;
}
