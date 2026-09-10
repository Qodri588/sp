import { type AIEngine } from '@bun/ai';
import { DEFAULT_API_KEYS } from '@shared/types';
import { type StorageManager } from '@bun/storage';
import { APP_CONSTANTS } from '@shared/constants';
import {
  SaveAllSettingsSchema,
  SetApiKeySchema,
  SetCreativeBoostModeSchema,
  SetModelSchema,
  SetPromptModeSchema,
} from '@shared/schemas';

import { withErrorHandling, log } from './utils';
import { validate } from './validated';

import type { RPCHandlers } from '@shared/types';

type SettingsHandlers = Pick<
  RPCHandlers,
  | 'getApiKey'
  | 'setApiKey'
  | 'getModel'
  | 'setModel'
  | 'getSunoTags'
  | 'setSunoTags'
  | 'getDebugMode'
  | 'setDebugMode'
  | 'getAllSettings'
  | 'saveAllSettings'
  | 'getMaxMode'
  | 'setMaxMode'
  | 'getLyricsMode'
  | 'setLyricsMode'
  | 'getStoryMode'
  | 'setStoryMode'
  | 'getPromptMode'
  | 'setPromptMode'
  | 'getCreativeBoostMode'
  | 'setCreativeBoostMode'
>;

function createCoreHandlers(
  aiEngine: AIEngine,
  storage: StorageManager,
  aiSettingsFromEnv: boolean
): Pick<SettingsHandlers, 'getApiKey' | 'setApiKey' | 'getModel' | 'setModel'> {
  return {
    getApiKey: async () => {
      log.info('getApiKey');
      if (aiSettingsFromEnv) return { apiKey: null };
      const config = await storage.getConfig();
      return { apiKey: config.apiKeys[config.provider] };
    },
    setApiKey: async (params) => {
      const { apiKey } = validate(SetApiKeySchema, params);
      log.info('setApiKey');
      if (aiSettingsFromEnv) return { success: true };
      const config = await storage.getConfig();
      await storage.saveConfig({ apiKeys: { ...config.apiKeys, [config.provider]: apiKey } });
      aiEngine.setApiKey(config.provider, apiKey);
      return { success: true };
    },
    getModel: async () => {
      log.info('getModel');
      if (aiSettingsFromEnv) return { model: aiEngine.getModelName() };
      const config = await storage.getConfig();
      return { model: config.model };
    },
    setModel: async (params) => {
      const { model } = validate(SetModelSchema, params);
      log.info('setModel', { model });
      if (aiSettingsFromEnv) return { success: true };
      await storage.saveConfig({ model });
      aiEngine.setModel(model);
      return { success: true };
    },
  };
}

function createModeHandlers(
  aiEngine: AIEngine,
  storage: StorageManager
): Pick<
  SettingsHandlers,
  | 'getSunoTags'
  | 'setSunoTags'
  | 'getDebugMode'
  | 'setDebugMode'
  | 'getMaxMode'
  | 'setMaxMode'
  | 'getLyricsMode'
  | 'setLyricsMode'
  | 'getStoryMode'
  | 'setStoryMode'
> {
  return {
    getSunoTags: async () => ({ useSunoTags: (await storage.getConfig()).useSunoTags }),
    setSunoTags: async ({ useSunoTags }: { useSunoTags: boolean }) => {
      await storage.saveConfig({ useSunoTags });
      aiEngine.setUseSunoTags(useSunoTags);
      return { success: true };
    },
    getDebugMode: async () => ({ debugMode: (await storage.getConfig()).debugMode }),
    setDebugMode: async ({ debugMode }: { debugMode: boolean }) => {
      await storage.saveConfig({ debugMode });
      aiEngine.setDebugMode(debugMode);
      return { success: true };
    },
    getMaxMode: async () => ({ maxMode: (await storage.getConfig()).maxMode }),
    setMaxMode: async ({ maxMode }: { maxMode: boolean }) => {
      await storage.saveConfig({ maxMode });
      aiEngine.setMaxMode(maxMode);
      return { success: true };
    },
    getLyricsMode: async () => ({ lyricsMode: (await storage.getConfig()).lyricsMode }),
    setLyricsMode: async ({ lyricsMode }: { lyricsMode: boolean }) => {
      await storage.saveConfig({ lyricsMode });
      aiEngine.setLyricsMode(lyricsMode);
      return { success: true };
    },
    getStoryMode: async () => ({ storyMode: (await storage.getConfig()).storyMode }),
    setStoryMode: async ({ storyMode }: { storyMode: boolean }) => {
      await storage.saveConfig({ storyMode });
      aiEngine.setStoryMode(storyMode);
      return { success: true };
    },
  };
}

function createPromptModeHandlers(
  storage: StorageManager
): Pick<
  SettingsHandlers,
  'getPromptMode' | 'setPromptMode' | 'getCreativeBoostMode' | 'setCreativeBoostMode'
> {
  return {
    getPromptMode: async () => ({ promptMode: (await storage.getConfig()).promptMode ?? 'full' }),
    setPromptMode: async (params) => {
      const { promptMode } = validate(SetPromptModeSchema, params);
      await storage.saveConfig({
        promptMode,
      });
      return { success: true };
    },
    getCreativeBoostMode: async () => ({
      creativeBoostMode: (await storage.getConfig()).creativeBoostMode ?? 'simple',
    }),
    setCreativeBoostMode: async (params) => {
      const { creativeBoostMode } = validate(SetCreativeBoostModeSchema, params);
      await storage.saveConfig({ creativeBoostMode });
      return { success: true };
    },
  };
}

function createBulkHandlers(
  aiEngine: AIEngine,
  storage: StorageManager,
  aiSettingsFromEnv: boolean
): Pick<SettingsHandlers, 'getAllSettings' | 'saveAllSettings'> {
  return {
    getAllSettings: async () => {
      const config = await storage.getConfig();
      return {
        provider: aiSettingsFromEnv ? aiEngine.getProvider() : config.provider,
        // AI credentials come from the backend .env file and are never sent
        // back to the browser.
        apiKeys: aiSettingsFromEnv ? { ...DEFAULT_API_KEYS } : config.apiKeys,
        model: aiSettingsFromEnv ? aiEngine.getModelName() : config.model,
        ...(aiSettingsFromEnv ? { llmAvailable: aiEngine.isLLMAvailable() } : {}),
        ...(aiSettingsFromEnv ? { aiSettingsFromEnv: true } : {}),
        useSunoTags: config.useSunoTags,
        debugMode: config.debugMode,
        maxMode: config.maxMode,
        lyricsMode: config.lyricsMode,
        storyMode: config.storyMode,
        promptMode: config.promptMode,
        creativeBoostMode: config.creativeBoostMode,
        lyricsPromptSettings: config.lyricsPromptSettings,
      };
    },
    saveAllSettings: async (params) => {
      const {
        provider,
        apiKeys,
        model,
        openaiBaseUrl,
        useSunoTags,
        debugMode,
        maxMode,
        lyricsMode,
        storyMode,
        promptMode,
        creativeBoostMode,
        lyricsPromptSettings,
      } = validate(SaveAllSettingsSchema, params);

      return withErrorHandling(
        'saveAllSettings',
        async () => {
          await storage.saveConfig({
            ...(aiSettingsFromEnv
              ? {}
              : {
                  provider,
                  apiKeys,
                  model,
                  ...(openaiBaseUrl !== undefined ? { openaiBaseUrl } : {}),
                }),
            useSunoTags,
            debugMode,
            maxMode,
            lyricsMode,
            storyMode,
            ...(promptMode !== undefined ? { promptMode } : {}),
            ...(creativeBoostMode !== undefined ? { creativeBoostMode } : {}),
            ...(lyricsPromptSettings !== undefined ? { lyricsPromptSettings } : {}),
          });

          if (!aiSettingsFromEnv) {
            aiEngine.setProvider(provider);
            for (const p of APP_CONSTANTS.AI.PROVIDER_IDS) {
              aiEngine.setApiKey(p, apiKeys[p]);
            }
            aiEngine.setModel(model);
            if (openaiBaseUrl !== undefined) {
              aiEngine.setOpenaiBaseUrl(openaiBaseUrl ?? null);
            }
          }

          aiEngine.setUseSunoTags(useSunoTags);
          aiEngine.setDebugMode(debugMode);
          aiEngine.setMaxMode(maxMode);
          aiEngine.setLyricsMode(lyricsMode);
          aiEngine.setStoryMode(storyMode);
          if (lyricsPromptSettings && typeof aiEngine.setLyricsPromptSettings === 'function') {
            aiEngine.setLyricsPromptSettings(lyricsPromptSettings);
          }

          return { success: true };
        },
        {
          provider: aiSettingsFromEnv ? aiEngine.getProvider() : provider,
        }
      );
    },
  };
}

export function createSettingsHandlers(
  aiEngine: AIEngine,
  storage: StorageManager,
  aiSettingsFromEnv = false
): SettingsHandlers {
  return {
    ...createCoreHandlers(aiEngine, storage, aiSettingsFromEnv),
    ...createModeHandlers(aiEngine, storage),
    ...createPromptModeHandlers(storage),
    ...createBulkHandlers(aiEngine, storage, aiSettingsFromEnv),
  };
}
