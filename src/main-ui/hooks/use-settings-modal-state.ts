import { useState, useEffect, useCallback } from 'react';

import { createLogger } from '@shared/logger';
import { rpcClient, unwrapOrThrowResult } from '@/services/rpc-client';
import { APP_CONSTANTS } from '@shared/constants';
import { type AIProvider, type APIKeys, DEFAULT_API_KEYS } from '@shared/types';
import {
  DEFAULT_LYRICS_PROMPT_SETTINGS,
  normalizeLyricsPromptSettings,
} from '@shared/lyrics-settings';

const log = createLogger('SettingsModalState');

/** Current state values for the settings modal */
export interface SettingsModalState {
  provider: AIProvider;
  apiKeys: APIKeys;
  model: string;
  useSunoTags: boolean;
  debugMode: boolean;
  maxMode: boolean;
  lyricsMode: boolean;
  storyMode: boolean;
  lyricsPrompt: string;
  lyricsExtensionPrompt: string;
  bannedLyricsWords: string;
  includeLyricsIntro: boolean;
  includeLyricsOutro: boolean;
  showKey: boolean;
  saving: boolean;
  loading: boolean;
  aiSettingsFromEnv: boolean;
  error: string | null;
}

/** Actions for updating settings modal state */
export interface SettingsModalActions {
  setProvider: (provider: AIProvider) => void;
  handleProviderChange: (provider: AIProvider) => void;
  handleApiKeyChange: (value: string) => void;
  setModel: (model: string) => void;
  setUseSunoTags: (value: boolean) => void;
  setDebugMode: (value: boolean) => void;
  setMaxMode: (value: boolean) => void;
  setLyricsMode: (value: boolean) => void;
  setStoryMode: (value: boolean) => void;
  setLyricsPrompt: (value: string) => void;
  setLyricsExtensionPrompt: (value: string) => void;
  setBannedLyricsWords: (value: string) => void;
  setIncludeLyricsIntro: (value: boolean) => void;
  setIncludeLyricsOutro: (value: boolean) => void;
  setShowKey: (value: boolean) => void;
  toggleShowKey: () => void;
  handleSave: (onClose: () => void) => Promise<void>;
}

/**
 * Custom hook for managing settings modal state and actions.
 * Handles loading, saving, and updating all application settings.
 *
 * @param isOpen - Whether the modal is currently open (triggers settings load)
 * @returns Tuple of [state, actions] for use in the settings modal component
 */
// eslint-disable-next-line max-lines-per-function
export function useSettingsModalState(isOpen: boolean): [SettingsModalState, SettingsModalActions] {
  const [provider, setProvider] = useState<AIProvider>(APP_CONSTANTS.AI.DEFAULT_PROVIDER);
  const [apiKeys, setApiKeys] = useState({ ...DEFAULT_API_KEYS });
  const [model, setModel] = useState('');
  const [useSunoTags, setUseSunoTags] = useState(
    (): boolean => APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS
  );
  const [debugMode, setDebugMode] = useState((): boolean => APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE);
  const [maxMode, setMaxMode] = useState((): boolean => APP_CONSTANTS.AI.DEFAULT_MAX_MODE);
  const [lyricsMode, setLyricsMode] = useState((): boolean => APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE);
  const [storyMode, setStoryMode] = useState((): boolean => APP_CONSTANTS.AI.DEFAULT_STORY_MODE);
  const [lyricsPrompt, setLyricsPrompt] = useState(DEFAULT_LYRICS_PROMPT_SETTINGS.lyricsPrompt);
  const [lyricsExtensionPrompt, setLyricsExtensionPrompt] = useState(
    DEFAULT_LYRICS_PROMPT_SETTINGS.lyricsExtensionPrompt
  );
  const [bannedLyricsWords, setBannedLyricsWords] = useState(
    DEFAULT_LYRICS_PROMPT_SETTINGS.bannedLyricsWords.join('\n')
  );
  const [includeLyricsIntro, setIncludeLyricsIntro] = useState(true);
  const [includeLyricsOutro, setIncludeLyricsOutro] = useState(true);
  const [showKey, setShowKey] = useState((): boolean => false);
  const [saving, setSaving] = useState((): boolean => false);
  const [loading, setLoading] = useState((): boolean => true);
  const [aiSettingsFromEnv, setAiSettingsFromEnv] = useState((): boolean => false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadSettings = async (): Promise<void> => {
      setError(null);
      setLoading(true);
      try {
        const result = await rpcClient.getAllSettings({});
        if (!result.ok) {
          setError('Unable to load settings.');
          return;
        }

        const settings = result.value;
        setProvider(settings.provider ?? APP_CONSTANTS.AI.DEFAULT_PROVIDER);
        setApiKeys(settings.apiKeys ?? { ...DEFAULT_API_KEYS });
        setModel(settings.model ?? '');
        setAiSettingsFromEnv(settings.aiSettingsFromEnv ?? false);
        setUseSunoTags(settings.useSunoTags);
        setDebugMode(settings.debugMode);
        setMaxMode(settings.maxMode);
        setLyricsMode(settings.lyricsMode);
        setStoryMode(settings.storyMode);
        const promptSettings = normalizeLyricsPromptSettings(settings.lyricsPromptSettings);
        setLyricsPrompt(promptSettings.lyricsPrompt);
        setLyricsExtensionPrompt(promptSettings.lyricsExtensionPrompt);
        setBannedLyricsWords(promptSettings.bannedLyricsWords.join('\n'));
        setIncludeLyricsIntro(promptSettings.includeLyricsIntro);
        setIncludeLyricsOutro(promptSettings.includeLyricsOutro);
      } catch (err: unknown) {
        log.error('fetchSettings:failed', err);
        setError('Unable to load settings.');
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, [isOpen]);

  const handleProviderChange = useCallback((newProvider: AIProvider): void => {
    setProvider(newProvider);
    setShowKey(false);
  }, []);

  const handleApiKeyChange = useCallback(
    (value: string): void => {
      setApiKeys((prev) => ({ ...prev, [provider]: value || null }));
    },
    [provider]
  );

  const toggleShowKey = useCallback((): void => {
    setShowKey((prev) => !prev);
  }, []);

  const handleSave = useCallback(
    async (onClose: () => void): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        unwrapOrThrowResult(
          await rpcClient.saveAllSettings({
            provider,
            model,
            useSunoTags,
            debugMode,
            maxMode,
            lyricsMode,
            storyMode,
            lyricsPromptSettings: {
              lyricsPrompt,
              lyricsExtensionPrompt,
              bannedLyricsWords: Array.from(
                new Map(
                  bannedLyricsWords
                    .split(/\r?\n/)
                    .map((word) => word.trim())
                    .filter(Boolean)
                    .map((word) => [word.toLocaleLowerCase(), word] as const)
                ).values()
              ),
              includeLyricsIntro,
              includeLyricsOutro,
            },
            apiKeys: {
              groq: apiKeys.groq?.trim() || null,
              openai: apiKeys.openai?.trim() || null,
              anthropic: apiKeys.anthropic?.trim() || null,
            },
          })
        );
        onClose();
      } catch (e: unknown) {
        log.error('saveSettings:failed', e);
        setError('Failed to save settings. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      provider,
      model,
      useSunoTags,
      debugMode,
      maxMode,
      lyricsMode,
      storyMode,
      lyricsPrompt,
      lyricsExtensionPrompt,
      bannedLyricsWords,
      includeLyricsIntro,
      includeLyricsOutro,
      apiKeys,
    ]
  );

  const state: SettingsModalState = {
    provider,
    apiKeys,
    model,
    useSunoTags,
    debugMode,
    maxMode,
    lyricsMode,
    storyMode,
    lyricsPrompt,
    lyricsExtensionPrompt,
    bannedLyricsWords,
    includeLyricsIntro,
    includeLyricsOutro,
    showKey,
    saving,
    loading,
    aiSettingsFromEnv,
    error,
  };

  const actions: SettingsModalActions = {
    setProvider,
    handleProviderChange,
    handleApiKeyChange,
    setModel,
    setUseSunoTags,
    setDebugMode,
    setMaxMode,
    setLyricsMode,
    setStoryMode,
    setLyricsPrompt,
    setLyricsExtensionPrompt,
    setBannedLyricsWords,
    setIncludeLyricsIntro,
    setIncludeLyricsOutro,
    setShowKey,
    toggleShowKey,
    handleSave,
  };

  return [state, actions];
}
