/**
 * AI Engine - Facade for AI Generation Operations
 *
 * Provides a unified interface for AI-powered prompt generation.
 * Delegates to focused modules for specific operations:
 * - generation.ts: Initial prompt generation
 * - refinement.ts: Prompt refinement
 * - quick-vibes-engine.ts: Quick Vibes generation
 * - creative-boost/: Creative Boost generation
 *
 * @module ai/engine/ai-engine
 */

import { AIConfig } from '@bun/ai/config';
import {
  generateInitial as generateInitialImpl,
  type GenerateInitialOptions,
} from '@bun/ai/generation/index';
import {
  refinePrompt as refinePromptImpl,
  type RefinePromptOptions,
} from '@bun/ai/refinement/index';
import { remixLyrics as remixLyricsImpl, remixTitle as remixTitleImpl } from '@bun/ai/remix';
import { generateLyricsExtension } from '@bun/ai/lyrics-extension';
import { extractGenreFromPrompt, extractMoodFromPrompt } from '@bun/prompt/deterministic';
import { generateDeterministicTitle } from '@bun/prompt/title';

import { createConfigFactories } from './config-factories';
import { createConfigProxies } from './config-proxies';
import { createCreativeBoostMethods } from './creative-boost';
import { createQuickVibesMethods } from './quick-vibes';

import type { GenerationResult } from '@bun/ai/types';
import type { TraceCollector } from '@bun/trace';

export class AIEngine {
  private config = new AIConfig();
  private proxies = createConfigProxies(this.config);
  private factories = createConfigFactories(this.config, this.proxies);
  private quickVibes = createQuickVibesMethods(this.factories);
  private creativeBoost = createCreativeBoostMethods(this.factories);

  // ==========================================================================
  // Configuration Proxies (delegated)
  // ==========================================================================

  setProvider = this.proxies.setProvider;
  setApiKey = this.proxies.setApiKey;
  setModel = this.proxies.setModel;
  getModel = this.proxies.getModel;
  setUseSunoTags = this.proxies.setUseSunoTags;
  setDebugMode = this.proxies.setDebugMode;
  setMaxMode = this.proxies.setMaxMode;
  setLyricsMode = this.proxies.setLyricsMode;
  setStoryMode = this.proxies.setStoryMode;
  setLyricsPromptSettings = this.proxies.setLyricsPromptSettings;
  initialize = this.proxies.initialize;
  isDebugMode = this.proxies.isDebugMode;
  setOpenaiBaseUrl = this.proxies.setOpenaiBaseUrl;

  getProvider = this.config.getProvider.bind(this.config);
  getModelName = this.config.getModelName.bind(this.config);
  getOpenaiBaseUrl = this.config.getOpenaiBaseUrl.bind(this.config);
  isLLMAvailable = this.config.isLLMAvailable.bind(this.config);

  // ==========================================================================
  // Core Generation & Refinement
  // ==========================================================================

  async generateInitial(
    options: GenerateInitialOptions,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ): Promise<GenerationResult> {
    return generateInitialImpl(options, this.factories.getGenerationConfig(), runtime);
  }

  async refinePrompt(
    options: RefinePromptOptions,
    runtime?: { readonly trace?: TraceCollector; readonly rng?: () => number }
  ): Promise<GenerationResult> {
    return refinePromptImpl(options, this.factories.getRefinementConfig(), runtime);
  }

  // ==========================================================================
  // LLM-Based Remix (Title and Lyrics)
  // ==========================================================================

  async remixTitle(
    currentPrompt: string,
    originalInput: string,
    currentLyrics?: string,
    traceRuntime?: { readonly trace?: TraceCollector }
  ): Promise<{ title: string }> {
    if (this.config.isLyricsMode() || this.config.isLLMAvailable()) {
      return remixTitleImpl(
        currentPrompt,
        originalInput,
        this.proxies.getModel,
        undefined,
        currentLyrics,
        {
          trace: traceRuntime?.trace,
          traceLabel: 'title.generate',
        }
      );
    }
    const genre = extractGenreFromPrompt(currentPrompt);
    const mood = extractMoodFromPrompt(currentPrompt);
    return { title: generateDeterministicTitle(genre, mood) };
  }

  async remixLyrics(
    currentPrompt: string,
    originalInput: string,
    lyricsTopic?: string
  ): Promise<{ lyrics: string }> {
    return remixLyricsImpl(
      currentPrompt,
      originalInput,
      lyricsTopic,
      this.config.isMaxMode(),
      this.proxies.getModel,
      this.config.getUseSunoTags(),
      false,
      '',
      undefined,
      undefined,
      this.config.getLyricsPromptSettings()
    );
  }

  async extendLyrics(
    currentLyrics: string,
    currentPrompt: string,
    traceRuntime?: { readonly trace?: TraceCollector }
  ): Promise<Awaited<ReturnType<typeof generateLyricsExtension>>> {
    return generateLyricsExtension({
      currentLyrics,
      genre: extractGenreFromPrompt(currentPrompt),
      mood: extractMoodFromPrompt(currentPrompt),
      getModel: this.proxies.getModel,
      useSunoTags: this.config.getUseSunoTags(),
      promptSettings: this.config.getLyricsPromptSettings(),
      trace: traceRuntime?.trace,
    });
  }

  // ==========================================================================
  // Quick Vibes (delegated)
  // ==========================================================================

  generateQuickVibes = this.quickVibes.generateQuickVibes;
  refineQuickVibes = this.quickVibes.refineQuickVibes;

  // ==========================================================================
  // Creative Boost (delegated)
  // ==========================================================================

  generateCreativeBoost = this.creativeBoost.generateCreativeBoost;
  refineCreativeBoost = this.creativeBoost.refineCreativeBoost;
}
