import { DEFAULT_API_KEYS, type APIKeys, type AppConfig, type AIProvider } from '@shared/types';
import { resolve } from 'node:path';

const LEGACY_AI_ENV_FILE = 'C:\\Users\\Administrator\\Desktop\\spp\\python_app\\.env';

export interface EnvAISettings {
  provider: AIProvider;
  apiKeys: APIKeys;
  model?: string;
  openaiBaseUrl?: string;
  sourcePath: string;
}

function unquote(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseDotEnv(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = unquote(trimmed.slice(separator + 1).trim());
    if (key) values[key] = value;
  }

  return values;
}

function firstConfigured(values: Record<string, string>, names: string[]): string | undefined {
  return names.map((name) => values[name]?.trim()).find(Boolean);
}

function getAIEnvFileCandidates(): string[] {
  const configuredPath = process.env.SUNO_AI_ENV_FILE?.trim() || Bun.env.SUNO_AI_ENV_FILE?.trim();
  if (configuredPath) return [configuredPath];

  return Array.from(new Set([resolve(process.cwd(), '.env'), LEGACY_AI_ENV_FILE]));
}

export async function loadAISettingsFromEnv(): Promise<EnvAISettings | null> {
  let sourcePath: string | undefined;
  let values: Record<string, string> | undefined;

  for (const candidatePath of getAIEnvFileCandidates()) {
    const file = Bun.file(candidatePath);
    if (!(await file.exists())) continue;
    sourcePath = candidatePath;
    values = parseDotEnv(await file.text());
    break;
  }

  if (!sourcePath || !values) return null;

  const endpoint = firstConfigured(values, ['ENDPOINT', 'OPENAI_BASE_URL', 'BASE_URL']);
  const model = firstConfigured(values, ['MODEL', 'OPENAI_MODEL']);
  const explicitOpenAIKey = firstConfigured(values, ['OPENAI_API_KEY']);
  const anthropicKey = firstConfigured(values, ['ANTHROPIC_API_KEY']);
  const groqKey = firstConfigured(values, ['GROQ_API_KEY']);

  // ENDPOINT points to an OpenAI-compatible API in the supplied .env. Its
  // token is named ANTHROPIC_API_KEY by the existing Python application.
  const provider: AIProvider = endpoint
    ? 'openai'
    : explicitOpenAIKey
      ? 'openai'
      : anthropicKey
        ? 'anthropic'
        : 'groq';
  const apiKey = explicitOpenAIKey || anthropicKey || groqKey;

  if (!apiKey && !model && !endpoint) return null;

  return {
    provider,
    apiKeys: { ...DEFAULT_API_KEYS, [provider]: apiKey || null },
    model,
    openaiBaseUrl: endpoint,
    sourcePath,
  };
}

export function applyEnvAISettings(
  config: AppConfig,
  envSettings: EnvAISettings | null
): AppConfig {
  if (!envSettings) {
    return {
      ...config,
      apiKeys: { ...DEFAULT_API_KEYS },
    };
  }

  return {
    ...config,
    provider: envSettings.provider,
    apiKeys: envSettings.apiKeys,
    model: envSettings.model || config.model,
    openaiBaseUrl: envSettings.openaiBaseUrl ?? null,
  };
}
