import { createAnthropic } from '@ai-sdk/anthropic';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import * as aiSdk from 'ai';

import { APP_CONSTANTS } from '@shared/constants';

import { createGenerationRequestConfig } from './core/request-config-factory';

import type { AppConfig, AIProvider, APIKeys } from '@shared/types';
import type { GenerationRequestConfig } from './core/request-config';
import type { LanguageModel } from 'ai';

type ProviderRegistry = ReturnType<typeof aiSdk.createProviderRegistry>;

const createProviderRegistrySafe = (
  ...args: Parameters<typeof aiSdk.createProviderRegistry>
): ProviderRegistry => {
  const creator =
    aiSdk.createProviderRegistry ??
    (aiSdk as { experimental_createProviderRegistry?: typeof aiSdk.createProviderRegistry })
      .experimental_createProviderRegistry;

  if (!creator) {
    throw new Error('AI SDK missing createProviderRegistry export. Please upgrade the ai package.');
  }

  return creator(...args);
};

export class AIConfig {
  private provider: AIProvider = APP_CONSTANTS.AI.DEFAULT_PROVIDER;
  private apiKeys: APIKeys = { groq: null, openai: null, anthropic: null };
  private model: string = APP_CONSTANTS.AI.DEFAULT_MODEL;
  private useSunoTags: boolean = APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS;
  private debugMode: boolean = APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE;
  private maxMode: boolean = APP_CONSTANTS.AI.DEFAULT_MAX_MODE;
  private lyricsMode: boolean = APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE;
  private storyMode: boolean = APP_CONSTANTS.AI.DEFAULT_STORY_MODE;
  private registry: ProviderRegistry | null = null;
  private openaiBaseUrl: string | null = null;

  private buildRegistry(): ProviderRegistry {
    this.registry = createProviderRegistrySafe({
      openai: createOpenAI({
        apiKey: this.apiKeys.openai ?? '',
        ...(this.openaiBaseUrl ? { baseURL: this.openaiBaseUrl } : {}),
      }),
      anthropic: createAnthropic({ apiKey: this.apiKeys.anthropic ?? '' }),
      groq: createGroq({ apiKey: this.apiKeys.groq ?? '' }),
    });
    return this.registry;
  }

  private invalidateRegistry(): void {
    this.registry = null;
  }

  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  setApiKey(provider: AIProvider, key: string | null): void {
    this.apiKeys[provider] = key;
    this.invalidateRegistry();
  }

  setModel(model: string): void {
    this.model = model;
  }

  setUseSunoTags(value: boolean): void {
    this.useSunoTags = value;
  }

  setDebugMode(value: boolean): void {
    this.debugMode = value;
  }

  setMaxMode(value: boolean): void {
    this.maxMode = value;
  }

  setLyricsMode(value: boolean): void {
    this.lyricsMode = value;
  }

  setStoryMode(value: boolean): void {
    this.storyMode = value;
  }

  setOpenaiBaseUrl(baseUrl: string | null): void {
    this.openaiBaseUrl = baseUrl ? baseUrl.trim() : null;
    this.invalidateRegistry();
  }

  initialize(config: Partial<AppConfig>): void {
    if (config.provider) this.provider = config.provider;
    if (config.apiKeys) {
      this.apiKeys = { ...this.apiKeys, ...config.apiKeys };
      this.invalidateRegistry();
    }
    if (config.model) this.model = config.model;
    if (config.useSunoTags !== undefined) this.useSunoTags = config.useSunoTags;
    if (config.debugMode !== undefined) this.debugMode = config.debugMode;
    if (config.maxMode !== undefined) this.maxMode = config.maxMode;
    if (config.lyricsMode !== undefined) this.lyricsMode = config.lyricsMode;
    if (config.storyMode !== undefined) this.storyMode = config.storyMode;

    if (config.openaiBaseUrl !== undefined) {
      this.openaiBaseUrl = config.openaiBaseUrl ? config.openaiBaseUrl.trim() : null;
      this.invalidateRegistry();
    }
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  getModel(): LanguageModel {
    const registry = this.registry ?? this.buildRegistry();
    return registry.languageModel(`${this.provider}:${this.model}`);
  }

  getModelName(): string {
    return this.model;
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  isMaxMode(): boolean {
    return this.maxMode;
  }

  isLyricsMode(): boolean {
    return this.lyricsMode;
  }

  isStoryMode(): boolean {
    return this.storyMode;
  }

  getUseSunoTags(): boolean {
    return this.useSunoTags;
  }

  getRequestConfig(): GenerationRequestConfig {
    return createGenerationRequestConfig(
      {
        provider: this.provider,
        apiKeys: { ...this.apiKeys },
        model: this.model,
        useSunoTags: this.useSunoTags,
        debugMode: this.debugMode,
        maxMode: this.maxMode,
        lyricsMode: this.lyricsMode,
        storyMode: this.storyMode,
        promptMode: APP_CONSTANTS.AI.DEFAULT_PROMPT_MODE,
        creativeBoostMode: 'simple',
      },
      this.getModel.bind(this)
    );
  }

  isLLMAvailable(): boolean {
    return this.getRequestConfig().policy.llmAvailable;
  }
}
