/**
 * AI Engine Types
 *
 * Type definitions for the AI generation engine, including results,
 * configurations, and context interfaces.
 *
 * @module ai/types
 */

import type { AIProvider, TraceRun } from '@shared/types';
import type { LanguageModel } from 'ai';

export interface GenerationResult {
  text: string;
  title?: string;
  lyrics?: string;
  debugTrace?: TraceRun;
  storyModeFallback?: boolean;
}

export interface EngineConfig {
  getModel: () => LanguageModel;
  isDebugMode: () => boolean;
  isMaxMode?: () => boolean;
  isLyricsMode?: () => boolean;
  isLLMAvailable?: () => boolean;
  getUseSunoTags?: () => boolean;
}

export interface GenerationConfig {
  getModel: () => LanguageModel;
  isDebugMode: () => boolean;
  isMaxMode: () => boolean;
  isLyricsMode: () => boolean;
  isStoryMode: () => boolean;
  isLLMAvailable: () => boolean;
  getUseSunoTags: () => boolean;
  getModelName: () => string;
  getProvider: () => AIProvider;
  isUseLocalLLM: () => boolean;
  getOllamaEndpoint: () => string | undefined;
  getOllamaEndpointIfLocal: () => string | undefined;
}

export interface RefinementConfig extends GenerationConfig {
  postProcess: (text: string) => Promise<string>;
}
