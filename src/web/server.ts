import { AIEngine } from '@bun/ai';
import { createHandlers } from '@bun/handlers';
import { StorageManager } from '@bun/storage';
import { createLogger } from '@shared/logger';
import { type RPCHandlers } from '@shared/types';

const log = createLogger('WebServer');

const aiEngine = new AIEngine();
const storage = new StorageManager();

let handlers: RPCHandlers;

process.env.CI = '1';

async function initialize(): Promise<void> {
  try {
    log.info('init:start');
    await storage.initialize();
    const config = await storage.getConfig();
    aiEngine.initialize(config);
    handlers = createHandlers(aiEngine, storage);
    log.info('init:complete');
  } catch (error) {
    log.error('init:failed', error);
    throw error;
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ message }, status);
}

const handlerMap: Record<string, (p: unknown) => Promise<unknown>> = {};

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = url.pathname.replace(/^\/api\//, '');

  if (!method || method === 'api') {
    return errorResponse('Not found', 404);
  }

  let params: Record<string, unknown> = {};
  if (req.method === 'POST') {
    try {
      params = (await req.json()) as Record<string, unknown>;
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
  }

  try {
    const handler = handlerMap[method];
    if (!handler) {
      return errorResponse(`Unknown method: ${method}`, 404);
    }

    const result = await handler(params);
    return jsonResponse(result);
  } catch (error) {
    log.error('handler:error', error, { method });
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}

const PORT = parseInt(process.env.PORT ?? '3001', 10);

try {
  await initialize();

  for (const [key, value] of Object.entries(handlers)) {
    handlerMap[key] = value as (p: unknown) => Promise<unknown>;
  }

  Bun.serve({
    port: PORT,
    async fetch(req) {
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      const response = await handleRequest(req);
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    },
  });

  log.info('server:started', { port: PORT });
} catch (error) {
  log.error('server:failed', error);
  process.exit(1);
}
