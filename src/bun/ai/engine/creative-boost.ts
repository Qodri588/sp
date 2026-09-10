/**
 * AI Engine Creative Boost Methods
 *
 * Creative Boost generation and refinement operations.
 *
 * @module ai/engine/creative-boost
 */

import {
  generateCreativeBoost as generateCreativeBoostImpl,
  refineCreativeBoost as refineCreativeBoostImpl,
} from '@bun/ai/creative-boost';

import type { ConfigFactories } from './config-factories';
import type { CreativeBoostEngineConfig } from '@bun/ai/creative-boost/types';
import type { GenerationConfig, GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

/** Creates the config object for creative boost operations from GenerationConfig */
function buildCreativeBoostConfig(generationConfig: GenerationConfig): CreativeBoostEngineConfig {
  return {
    getModel: generationConfig.getModel,
    isDebugMode: generationConfig.isDebugMode,
    isLLMAvailable: generationConfig.isLLMAvailable,
    isStoryMode: generationConfig.isStoryMode,
    getUseSunoTags: generationConfig.getUseSunoTags,
    getLyricsPromptSettings: generationConfig.getLyricsPromptSettings,
  };
}

/** Create Creative Boost methods bound to configuration. */
export function createCreativeBoostMethods(factories: ConfigFactories): {
  generateCreativeBoost: (
    creativityLevel: number,
    seedGenres: string[],
    sunoStyles: string[],
    description: string,
    lyricsTopic: string,
    maxMode: boolean,
    withLyrics: boolean,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
  refineCreativeBoost: (
    currentPrompt: string,
    currentTitle: string,
    currentLyrics: string | undefined,
    feedback: string,
    lyricsTopic: string,
    description: string,
    seedGenres: string[],
    sunoStyles: string[],
    maxMode: boolean,
    withLyrics: boolean,
    targetGenreCount?: number,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ) => Promise<GenerationResult>;
} {
  return {
    async generateCreativeBoost(
      creativityLevel,
      seedGenres,
      sunoStyles,
      description,
      lyricsTopic,
      maxMode,
      withLyrics,
      runtime
    ) {
      // Build this at call time. AIEngine is constructed before persisted
      // settings are initialized, so capturing it here would freeze the
      // Intro/Outro and custom lyrics settings at their defaults.
      const boostConfig = buildCreativeBoostConfig(factories.getGenerationConfig());

      return generateCreativeBoostImpl(
        {
          creativityLevel,
          seedGenres,
          sunoStyles,
          description,
          lyricsTopic,
          maxMode,
          withLyrics,
          config: boostConfig,
        },
        runtime
      );
    },

    async refineCreativeBoost(
      currentPrompt,
      currentTitle,
      currentLyrics,
      feedback,
      lyricsTopic,
      description,
      seedGenres,
      sunoStyles,
      maxMode,
      withLyrics,
      targetGenreCount,
      runtime
    ) {
      // Refresh the request snapshot for every refinement for the same reason
      // as generation: settings can be changed through the Settings UI.
      const boostConfig = buildCreativeBoostConfig(factories.getGenerationConfig());

      return refineCreativeBoostImpl(
        {
          currentPrompt,
          currentTitle,
          currentLyrics,
          feedback,
          lyricsTopic,
          description,
          seedGenres,
          sunoStyles,
          maxMode,
          withLyrics,
          targetGenreCount,
          config: boostConfig,
        },
        runtime
      );
    },
  };
}

export type CreativeBoostMethods = ReturnType<typeof createCreativeBoostMethods>;
