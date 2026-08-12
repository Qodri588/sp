import { DEFAULT_API_KEYS, type AppConfig } from '@shared/types';

import { buildGenerationPolicy } from './policy';

import type { GenerationRequestConfig } from './request-config';
import type { LanguageModel } from 'ai';

type ModelResolver = () => LanguageModel;

export function createGenerationRequestConfig(
  config: AppConfig,
  getModel: ModelResolver
): GenerationRequestConfig {
  const requestConfig = {
    provider: config.provider,
    model: config.model,
    useSunoTags: config.useSunoTags,
    debugMode: config.debugMode,
    maxMode: config.maxMode,
    lyricsMode: config.lyricsMode,
    storyMode: config.storyMode,
    apiKeys: { ...DEFAULT_API_KEYS, ...config.apiKeys },
  };

  const policy = buildGenerationPolicy(requestConfig);

  return {
    ...requestConfig,
    policy,
    getModel,
    getModelName: () => requestConfig.model,
    getProvider: () => requestConfig.provider,
    isDebugMode: () => requestConfig.debugMode,
    isMaxMode: () => requestConfig.maxMode,
    isLyricsMode: () => requestConfig.lyricsMode,
    isStoryMode: () => requestConfig.storyMode,
    isLLMAvailable: () => policy.llmAvailable,
    getUseSunoTags: () => requestConfig.useSunoTags,
  };
}
