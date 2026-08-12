import { z } from 'zod';

const ProviderSchema = z.enum(['groq', 'openai', 'anthropic']);
export const PromptModeSchema = z.enum(['full', 'quickVibes', 'creativeBoost']);
export const CreativeBoostModeSchema = z.enum(['simple', 'advanced']);

export const SetApiKeySchema = z.object({
  apiKey: z.string().trim().min(1).nullable(),
});

export const SetModelSchema = z.object({
  model: z.string().trim().min(1),
});

export const SetPromptModeSchema = z.object({
  promptMode: PromptModeSchema,
});

export const SetCreativeBoostModeSchema = z.object({
  creativeBoostMode: CreativeBoostModeSchema,
});

export const SaveAllSettingsSchema = z.object({
  provider: ProviderSchema,
  apiKeys: z.object({
    groq: z.string().nullable(),
    openai: z.string().nullable(),
    anthropic: z.string().nullable(),
  }),
  model: z.string().min(1),
  openaiBaseUrl: z.url('Endpoint must be a valid URL').nullable().optional(),
  useSunoTags: z.boolean(),
  debugMode: z.boolean(),
  maxMode: z.boolean(),
  lyricsMode: z.boolean(),
  storyMode: z.boolean(),
  promptMode: PromptModeSchema.optional(),
  creativeBoostMode: CreativeBoostModeSchema.optional(),
});

export type SaveAllSettingsInput = z.infer<typeof SaveAllSettingsSchema>;
export type SetApiKeyInput = z.infer<typeof SetApiKeySchema>;
export type SetModelInput = z.infer<typeof SetModelSchema>;
export type SetPromptModeInput = z.infer<typeof SetPromptModeSchema>;
export type SetCreativeBoostModeInput = z.infer<typeof SetCreativeBoostModeSchema>;
