import { request } from './web-client';

import type { RpcError } from './errors';
import type {
  ConvertToMaxFormatParams,
  ConvertToMaxFormatResponse,
  DeleteSessionParams,
  GenerateCreativeBoostParams,
  GenerateCreativeBoostResponse,
  GenerateInitialParams,
  GenerateInitialResponse,
  GenerateQuickVibesParams,
  GenerateQuickVibesResponse,
  GetAllSettingsResponse,
  GetCreativeBoostModeResponse,
  GetHistoryResponse,
  GetPromptModeResponse,
  RefineCreativeBoostParams,
  RefineCreativeBoostResponse,
  RefinePromptParams,
  RefinePromptResponse,
  RefineQuickVibesParams,
  RefineQuickVibesResponse,
  RemixGenreParams,
  RemixGenreResponse,
  RemixInstrumentsParams,
  RemixInstrumentsResponse,
  RemixLyricsParams,
  RemixLyricsResponse,
  RemixMoodParams,
  RemixMoodResponse,
  RemixRecordingParams,
  RemixRecordingResponse,
  RemixStyleTagsParams,
  RemixStyleTagsResponse,
  RemixTitleParams,
  RemixTitleResponse,
  SaveAllSettingsParams,
  SaveSessionParams,
  SetApiKeyParams,
  SetCreativeBoostModeParams,
  SetLyricsModeParams,
  SetMaxModeParams,
  SetModelParams,
  SetStoryModeParams,
  SetPromptModeParams,
  SetSunoTagsParams,
  SetDebugModeParams,
  SetPromptModeResponse,
  SetCreativeBoostModeResponse,
} from '@shared/types/api';
import type { Result } from '@shared/types/result';

export { type RpcError, type RpcErrorCode, mapToRpcError, redactAndTruncateText } from './errors';
export { request } from './web-client';
export { RpcClientError, unwrapOrThrowResult } from '@/services/rpc-shim-error';

export type EmptyParams = Record<string, never>;

export const rpcClient = {
  getHistory: (params: EmptyParams): Promise<Result<GetHistoryResponse, RpcError>> =>
    request('getHistory', params),
  saveSession: (params: SaveSessionParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('saveSession', params as Record<string, unknown>),
  deleteSession: (params: DeleteSessionParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('deleteSession', params as Record<string, unknown>),

  generateInitial: (
    params: GenerateInitialParams
  ): Promise<Result<GenerateInitialResponse, RpcError>> =>
    request('generateInitial', params as Record<string, unknown>),
  refinePrompt: (params: RefinePromptParams): Promise<Result<RefinePromptResponse, RpcError>> =>
    request('refinePrompt', params as Record<string, unknown>),

  remixInstruments: (
    params: RemixInstrumentsParams
  ): Promise<Result<RemixInstrumentsResponse, RpcError>> =>
    request('remixInstruments', params as Record<string, unknown>),
  remixGenre: (params: RemixGenreParams): Promise<Result<RemixGenreResponse, RpcError>> =>
    request('remixGenre', params as Record<string, unknown>),
  remixMood: (params: RemixMoodParams): Promise<Result<RemixMoodResponse, RpcError>> =>
    request('remixMood', params as Record<string, unknown>),
  remixStyleTags: (
    params: RemixStyleTagsParams
  ): Promise<Result<RemixStyleTagsResponse, RpcError>> =>
    request('remixStyleTags', params as Record<string, unknown>),
  remixRecording: (
    params: RemixRecordingParams
  ): Promise<Result<RemixRecordingResponse, RpcError>> =>
    request('remixRecording', params as Record<string, unknown>),
  remixTitle: (params: RemixTitleParams): Promise<Result<RemixTitleResponse, RpcError>> =>
    request('remixTitle', params as Record<string, unknown>),
  remixLyrics: (params: RemixLyricsParams): Promise<Result<RemixLyricsResponse, RpcError>> =>
    request('remixLyrics', params as Record<string, unknown>),

  getApiKey: (params: EmptyParams): Promise<Result<{ apiKey: string | null }, RpcError>> =>
    request('getApiKey', params),
  setApiKey: (params: SetApiKeyParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setApiKey', params as Record<string, unknown>),
  getModel: (params: EmptyParams): Promise<Result<{ model: string }, RpcError>> =>
    request('getModel', params),
  setModel: (params: SetModelParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setModel', params as Record<string, unknown>),
  getSunoTags: (params: EmptyParams): Promise<Result<{ useSunoTags: boolean }, RpcError>> =>
    request('getSunoTags', params),
  setSunoTags: (params: SetSunoTagsParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setSunoTags', params as Record<string, unknown>),
  getDebugMode: (params: EmptyParams): Promise<Result<{ debugMode: boolean }, RpcError>> =>
    request('getDebugMode', params),
  setDebugMode: (params: SetDebugModeParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setDebugMode', params as Record<string, unknown>),
  getAllSettings: (params: EmptyParams): Promise<Result<GetAllSettingsResponse, RpcError>> =>
    request('getAllSettings', params),
  saveAllSettings: (
    params: SaveAllSettingsParams
  ): Promise<Result<{ success: boolean }, RpcError>> =>
    request('saveAllSettings', params as Record<string, unknown>),
  getMaxMode: (params: EmptyParams): Promise<Result<{ maxMode: boolean }, RpcError>> =>
    request('getMaxMode', params),
  setMaxMode: (params: SetMaxModeParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setMaxMode', params as Record<string, unknown>),
  getLyricsMode: (params: EmptyParams): Promise<Result<{ lyricsMode: boolean }, RpcError>> =>
    request('getLyricsMode', params),
  setLyricsMode: (params: SetLyricsModeParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setLyricsMode', params as Record<string, unknown>),
  getStoryMode: (params: EmptyParams): Promise<Result<{ storyMode: boolean }, RpcError>> =>
    request('getStoryMode', params),
  setStoryMode: (params: SetStoryModeParams): Promise<Result<{ success: boolean }, RpcError>> =>
    request('setStoryMode', params as Record<string, unknown>),

  getPromptMode: (params: EmptyParams): Promise<Result<GetPromptModeResponse, RpcError>> =>
    request('getPromptMode', params),
  setPromptMode: (params: SetPromptModeParams): Promise<Result<SetPromptModeResponse, RpcError>> =>
    request('setPromptMode', params as Record<string, unknown>),
  getCreativeBoostMode: (
    params: EmptyParams
  ): Promise<Result<GetCreativeBoostModeResponse, RpcError>> =>
    request('getCreativeBoostMode', params),
  setCreativeBoostMode: (
    params: SetCreativeBoostModeParams
  ): Promise<Result<SetCreativeBoostModeResponse, RpcError>> =>
    request('setCreativeBoostMode', params as Record<string, unknown>),

  generateQuickVibes: (
    params: GenerateQuickVibesParams
  ): Promise<Result<GenerateQuickVibesResponse, RpcError>> =>
    request('generateQuickVibes', params as Record<string, unknown>),
  refineQuickVibes: (
    params: RefineQuickVibesParams
  ): Promise<Result<RefineQuickVibesResponse, RpcError>> =>
    request('refineQuickVibes', params as Record<string, unknown>),

  convertToMaxFormat: (
    params: ConvertToMaxFormatParams
  ): Promise<Result<ConvertToMaxFormatResponse, RpcError>> =>
    request('convertToMaxFormat', params as Record<string, unknown>),

  generateCreativeBoost: (
    params: GenerateCreativeBoostParams
  ): Promise<Result<GenerateCreativeBoostResponse, RpcError>> =>
    request('generateCreativeBoost', params as Record<string, unknown>),
  refineCreativeBoost: (
    params: RefineCreativeBoostParams
  ): Promise<Result<RefineCreativeBoostResponse, RpcError>> =>
    request('refineCreativeBoost', params as Record<string, unknown>),
};
