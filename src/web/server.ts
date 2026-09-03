import { AIEngine } from '@bun/ai';
import { applyEnvAISettings, loadAISettingsFromEnv } from '@bun/ai/env-settings';
import { createHandlers } from '@bun/handlers';
import { StorageManager } from '@bun/storage';
import { createLogger } from '@shared/logger';
import { type RPCHandlers } from '@shared/types';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

const log = createLogger('WebServer');

const aiEngine = new AIEngine();
const storage = new StorageManager(process.env.SUNO_STORAGE_DIR?.trim() || undefined);

let handlers: RPCHandlers;

export async function initialize(): Promise<void> {
  try {
    log.info('init:start');
    await storage.initialize();
    const storedConfig = await storage.getConfig();
    const envAISettings = await loadAISettingsFromEnv();
    const config = applyEnvAISettings(storedConfig, envAISettings);
    aiEngine.initialize(config);
    log.info('ai-config:loaded', {
      source: envAISettings?.sourcePath ?? 'environment file not found',
      provider: config.provider,
      model: config.model,
      hasApiKey: Object.values(config.apiKeys).some((key: string | null) => Boolean(key?.trim())),
    });
    handlers = createHandlers(aiEngine, storage, { aiSettingsFromEnv: true });
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

async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = url.pathname.replace(/^\/api\//, '');

  if (!method || method === 'api' || req.method !== 'POST') {
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }
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
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

const WEB_DIST_DIR = resolve(process.env.WEB_DIST_DIR?.trim() || 'dist-web');
const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function serveStatic(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(req.url);
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return errorResponse('Invalid URL', 400);
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(WEB_DIST_DIR, requestedPath);
  const relativePath = relative(WEB_DIST_DIR, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return errorResponse('Forbidden', 403);
  }

  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(req.method === 'HEAD' ? null : file);
  }

  // Vite builds a single-page application. Let client-side routes resolve to it.
  if (!extname(requestedPath)) {
    const indexFile = Bun.file(join(WEB_DIST_DIR, 'index.html'));
    if (await indexFile.exists()) {
      return new Response(req.method === 'HEAD' ? null : indexFile);
    }
  }

  return errorResponse('Not found', 404);
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === '/health') {
    return jsonResponse({ status: 'ok' });
  }
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    return handleApiRequest(req);
  }
  return serveStatic(req);
}

function withCors(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function startServer(): Promise<ReturnType<typeof Bun.serve>> {
  await initialize();

  for (const [key, value] of Object.entries(handlers)) {
    handlerMap[key] = value as (p: unknown) => Promise<unknown>;
  }

  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      if (req.method === 'OPTIONS') {
        return withCors(new Response(null));
      }

      return withCors(await handleRequest(req));
    },
  });

  log.info('server:started', { port: PORT });
  return server;
}

if (import.meta.main) {
  startServer().catch((error: unknown) => {
    log.error('server:failed', error);
    process.exit(1);
  });
}
