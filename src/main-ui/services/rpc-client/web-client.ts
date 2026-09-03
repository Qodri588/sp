import { APP_CONSTANTS } from '@shared/constants';
import { Err, Ok } from '@shared/types/result';

import { mapToRpcError, type RpcError } from './errors';

import type { Result } from '@shared/types/result';

const API_BASE = '/api';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isResultEnvelope(
  value: unknown
): value is { ok: boolean; value?: unknown; error?: unknown } {
  return isRecord(value) && typeof value.ok === 'boolean';
}

export async function request<T>(method: string, params: unknown): Promise<Result<T, RpcError>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, APP_CONSTANTS.AI.TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => ({}));
      const message =
        body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
          ? body.message
          : response.statusText;
      return Err(mapToRpcError({ code: response.status, message }, { method }));
    }

    const body: unknown = await response.json();
    if (isResultEnvelope(body)) {
      if (body.ok) return Ok(body.value as T);
      return Err(mapToRpcError(body.error, { method }));
    }
    return Ok(body as T);
  } catch (error) {
    return Err(mapToRpcError(error, { method }));
  }
}
