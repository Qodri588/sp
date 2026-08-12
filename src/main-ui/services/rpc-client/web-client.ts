import { APP_CONSTANTS } from '@shared/constants';
import { Err, Ok } from '@shared/types/result';

import { mapToRpcError, type RpcError } from './errors';

import type { Result } from '@shared/types/result';

const API_BASE = '/api';

export async function request<M extends string>(
  method: M,
  params: Record<string, never> | Record<string, unknown>
): Promise<Result<any, RpcError>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), APP_CONSTANTS.AI.TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return Err(
        mapToRpcError(
          { code: response.status, message: body.message ?? response.statusText },
          { method },
        ),
      );
    }

    return Ok(await response.json());
  } catch (error) {
    return Err(mapToRpcError(error, { method }));
  }
}
