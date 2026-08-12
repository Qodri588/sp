import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { SectionLabel } from '@/components/ui/section-label';
import { APP_CONSTANTS } from '@shared/constants';

import type { AIProvider, APIKeys } from '@shared/types';
import type { ReactElement } from 'react';

const PROVIDERS = APP_CONSTANTS.AI.PROVIDERS;
const selectClassName =
  'border-border data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-[var(--height-control-md)] w-full min-w-0 rounded-md border bg-input/30 px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-footnote)] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

interface ApiKeySectionProps {
  provider: AIProvider;
  apiKeys: APIKeys;
  openaiBaseUrl: string;
  showKey: boolean;
  loading: boolean;
  error: string | null;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (value: string) => void;
  onOpenaiBaseUrlChange: (value: string) => void;
  onToggleShowKey: () => void;
}

export function ApiKeySection({
  provider,
  apiKeys,
  openaiBaseUrl,
  showKey,
  loading,
  error,
  onProviderChange,
  onApiKeyChange,
  onOpenaiBaseUrlChange,
  onToggleShowKey,
}: ApiKeySectionProps): ReactElement {
  const currentProvider = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];
  const currentApiKey = apiKeys[provider] || '';
  const showBaseUrl = provider === 'openai';

  return (
    <>
      <div className="space-y-2">
        <SectionLabel>AI Provider</SectionLabel>
        <select
          value={provider}
          onChange={(e) => {
            onProviderChange(e.target.value as AIProvider);
          }}
          disabled={loading}
          className={selectClassName}
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="ui-helper">Select your preferred AI provider</p>
      </div>

      {showBaseUrl && (
        <div className="space-y-2">
          <SectionLabel>OpenAI-compatible Base URL</SectionLabel>
          <Input
            type="text"
            value={openaiBaseUrl}
            onChange={(e) => {
              onOpenaiBaseUrlChange(e.target.value);
            }}
            placeholder="https://api.9router.com/v1 (optional)"
            className="bg-input"
          />
          <p className="ui-helper">
            Leave empty to use the official OpenAI API. Set this to any OpenAI-compatible
            endpoint (e.g. 9router, DeepSeek, Kimi).
          </p>
        </div>
      )}

      <div className="space-y-2">
        <SectionLabel>{currentProvider.name} API Key</SectionLabel>
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            value={currentApiKey}
            onChange={(e) => {
              onApiKeyChange(e.target.value);
            }}
            placeholder={currentProvider.keyPlaceholder}
            className="pr-10 bg-input"
          />
          <button
            type="button"
            onClick={onToggleShowKey}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {!showBaseUrl && (
          <p className="ui-helper">
            Get your key from{' '}
            <a
              href={currentProvider.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {currentProvider.keyUrl.replace('https://', '')}
            </a>
          </p>
        )}
        {!currentApiKey && !loading && (
          <p className="ui-helper text-amber-500">
            No API key configured for {currentProvider.name}. Generation will fail.
          </p>
        )}
        {error && (
          <p className="text-caption text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
      </div>
    </>
  );
}
