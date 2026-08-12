import { type LanguageModel } from 'ai';

import { AIConfig } from '@bun/ai/config';
import { postProcess } from '@bun/ai/utils';

import type { ConfigProxies } from './config-proxies';
import type { GenerationConfig, RefinementConfig } from '@bun/ai/types';

function createPostProcess(_config: AIConfig, getModel: () => LanguageModel): (text: string) => Promise<string> {
  return async (text: string): Promise<string> => {
    return postProcess(text, getModel);
  };
}

export function createConfigFactories(
  config: AIConfig,
  proxies: ConfigProxies
): {
  postProcess: (text: string) => Promise<string>;
  getGenerationConfig: () => GenerationConfig;
  getRefinementConfig: () => RefinementConfig;
} {
  const postProcessFn = createPostProcess(config, proxies.getModel);

  function getGenerationConfig(): GenerationConfig {
    const requestConfig = config.getRequestConfig();

    return {
      getModel: requestConfig.getModel,
      isDebugMode: requestConfig.isDebugMode,
      isMaxMode: requestConfig.isMaxMode,
      isLyricsMode: requestConfig.isLyricsMode,
      isStoryMode: requestConfig.isStoryMode,
      isLLMAvailable: requestConfig.isLLMAvailable,
      getUseSunoTags: requestConfig.getUseSunoTags,
      getModelName: requestConfig.getModelName,
      getProvider: requestConfig.getProvider,
      isUseLocalLLM: () => false,
      getOllamaEndpoint: () => undefined,
      getOllamaEndpointIfLocal: () => undefined,
    };
  }

  function getRefinementConfig(): RefinementConfig {
    return {
      ...getGenerationConfig(),
      postProcess: postProcessFn,
    };
  }

  return {
    postProcess: postProcessFn,
    getGenerationConfig,
    getRefinementConfig,
  };
}

export type ConfigFactories = ReturnType<typeof createConfigFactories>;
