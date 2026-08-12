/**
 * AI Engine Configuration Proxies
 *
 * Provides configuration proxy methods that delegate to AIConfig.
 * Used by AIEngine to expose configuration setters and getters.
 *
 * @module ai/engine/config-proxies
 */

import { type LanguageModel } from 'ai';

import { AIConfig } from '@bun/ai/config';

export function createConfigProxies(config: AIConfig): {
  setProvider: OmitThisParameter<typeof config.setProvider>;
  setApiKey: OmitThisParameter<typeof config.setApiKey>;
  setModel: OmitThisParameter<typeof config.setModel>;
  setUseSunoTags: OmitThisParameter<typeof config.setUseSunoTags>;
  setDebugMode: OmitThisParameter<typeof config.setDebugMode>;
  setMaxMode: OmitThisParameter<typeof config.setMaxMode>;
  setLyricsMode: OmitThisParameter<typeof config.setLyricsMode>;
  setStoryMode: OmitThisParameter<typeof config.setStoryMode>;
  initialize: OmitThisParameter<typeof config.initialize>;
  isDebugMode: OmitThisParameter<typeof config.isDebugMode>;
  setOpenaiBaseUrl: OmitThisParameter<typeof config.setOpenaiBaseUrl>;
  getModel: () => LanguageModel;
} {
  return {
    setProvider: config.setProvider.bind(config),
    setApiKey: config.setApiKey.bind(config),
    setModel: config.setModel.bind(config),
    setUseSunoTags: config.setUseSunoTags.bind(config),
    setDebugMode: config.setDebugMode.bind(config),
    setMaxMode: config.setMaxMode.bind(config),
    setLyricsMode: config.setLyricsMode.bind(config),
    setStoryMode: config.setStoryMode.bind(config),
    initialize: config.initialize.bind(config),
    isDebugMode: config.isDebugMode.bind(config),
    setOpenaiBaseUrl: config.setOpenaiBaseUrl.bind(config),
    getModel: config.getModel.bind(config),
  };
}

export type ConfigProxies = ReturnType<typeof createConfigProxies>;
