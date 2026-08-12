/**
 * Tests for request-runner.ts
 */

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';

import { AIGenerationError } from '@shared/errors';

import { setAiGenerateTextMock } from '../../helpers/ai-mock';

// Mock the AI SDK before importing runAIRequest
const mockGenerateText = mock(async (_options?: unknown) => ({
  text: 'generated response',
  response: { modelId: 'gpt-4' },
  finishReason: 'stop',
  usage: { inputTokens: 10, outputTokens: 20 },
}));

beforeEach(async () => {
  setAiGenerateTextMock(mockGenerateText);
});

afterEach(() => {
  mock.restore();
});

describe('runAIRequest', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGenerateText.mockResolvedValue({
      text: 'generated response',
      response: { modelId: 'gpt-4' },
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20 },
    });
  });

  describe('without trace (fast path)', () => {
    test('calls cloud provider', async () => {
      const { runAIRequest } = await import('@bun/ai/request-runner');

      const result = await runAIRequest({
        getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
        systemPrompt: 'system',
        userPrompt: 'user',
        errorContext: 'test context',
      });

      expect(result).toBe('generated response');
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });

    test('throws AIGenerationError for empty response', async () => {
      mockGenerateText.mockResolvedValue({
        text: '',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 0 },
      });
      const { runAIRequest } = await import('@bun/ai/request-runner');

      await expect(
        runAIRequest({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test context',
        })
      ).rejects.toThrow(AIGenerationError);
    });

    test('wraps non-AIGenerationError errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('network error'));
      const { runAIRequest } = await import('@bun/ai/request-runner');

      await expect(
        runAIRequest({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test operation',
        })
      ).rejects.toThrow('Failed to test operation');
    });

    test('preserves AIGenerationError errors', async () => {
      const originalError = new AIGenerationError('original message');
      mockGenerateText.mockRejectedValue(originalError);
      const { runAIRequest } = await import('@bun/ai/request-runner');

      await expect(
        runAIRequest({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test operation',
        })
      ).rejects.toThrow('original message');
    });
  });

  describe('with trace (traced path)', () => {
    test('records LLM call event on success', async () => {
      // Mock generateText to call onFinish callback (required for traced path)
      mockGenerateText.mockImplementation(async (options: unknown) => {
        const opts = options as {
          onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void;
        };
        if (opts.onFinish) {
          opts.onFinish({
            response: { modelId: 'gpt-4' },
            usage: { inputTokens: 10, outputTokens: 20 },
            finishReason: 'stop',
          });
        }
        return {
          text: 'generated response',
          response: { modelId: 'gpt-4' },
          finishReason: 'stop',
          usage: { inputTokens: 10, outputTokens: 20 },
        };
      });

      const { runAIRequest } = await import('@bun/ai/request-runner');
      const { createTraceCollector } = await import('@bun/trace');

      const trace = createTraceCollector({
        runId: 'test-run',
        action: 'generate.full',
        promptMode: 'full',
        rng: { seed: 1, algorithm: 'mulberry32' },
      });

      const result = await runAIRequest({
        getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
        systemPrompt: 'system prompt',
        userPrompt: 'user prompt',
        errorContext: 'test context',
        trace,
        traceLabel: 'test.call',
      });

      expect(result).toBe('generated response');

      const traceData = trace.finalize();
      const llmEvent = traceData.events.find((e) => e.type === 'llm.call');
      expect(llmEvent).toBeDefined();
    });

    test('records error event on failure', async () => {
      mockGenerateText.mockRejectedValue(new AIGenerationError('test failure'));
      const { runAIRequest } = await import('@bun/ai/request-runner');
      const { createTraceCollector } = await import('@bun/trace');

      const trace = createTraceCollector({
        runId: 'test-run',
        action: 'generate.full',
        promptMode: 'full',
        rng: { seed: 1, algorithm: 'mulberry32' },
      });

      await expect(
        runAIRequest({
          getModel: () => ({}) as any,
          systemPrompt: 'system',
          userPrompt: 'user',
          errorContext: 'test context',
          trace,
        })
      ).rejects.toThrow();

      const traceData = trace.finalize();
      expect(traceData.stats.hadErrors).toBe(true);
    });
  });
});

describe('onFinish callback behavior', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
  });

  test('onFinish callback is invoked during cloud generation without trace', async () => {
    let onFinishCalled = false;
    let capturedOnFinish:
      | ((params: { response: unknown; usage: unknown; finishReason: string }) => void)
      | undefined;

    // Mock generateText to capture the onFinish callback
    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as {
        onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void;
      };
      capturedOnFinish = opts.onFinish;
      // Simulate the AI SDK calling onFinish
      if (opts.onFinish) {
        onFinishCalled = true;
        opts.onFinish({
          response: { modelId: 'gpt-4' },
          usage: { inputTokens: 100, outputTokens: 50 },
          finishReason: 'stop',
        });
      }
      return {
        text: 'generated response',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 100, outputTokens: 50 },
      };
    });

    const { runAIRequest } = await import('@bun/ai/request-runner');

    await runAIRequest({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
      systemPrompt: 'system',
      userPrompt: 'user',
      errorContext: 'test context',
    });

    expect(onFinishCalled).toBe(true);
    expect(capturedOnFinish).toBeDefined();
  });

  test('trace telemetry contains correct token counts from onFinish', async () => {
    // Mock generateText to call onFinish with specific token counts
    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as {
        onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void;
      };
      if (opts.onFinish) {
        opts.onFinish({
          response: { modelId: 'gpt-4-turbo' },
          usage: { inputTokens: 200, outputTokens: 75 },
          finishReason: 'stop',
        });
      }
      return {
        text: 'generated response',
        response: { modelId: 'gpt-4-turbo' },
        finishReason: 'stop',
        usage: { inputTokens: 200, outputTokens: 75 },
      };
    });

    const { runAIRequest } = await import('@bun/ai/request-runner');
    const { createTraceCollector } = await import('@bun/trace');

    const trace = createTraceCollector({
      runId: 'test-run-tokens',
      action: 'generate.full',
      promptMode: 'full',
      rng: { seed: 1, algorithm: 'mulberry32' },
    });

    await runAIRequest({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4-turbo' }) as any,
      systemPrompt: 'system prompt',
      userPrompt: 'user prompt',
      errorContext: 'test context',
      trace,
      traceLabel: 'test.tokens',
    });

    const traceData = trace.finalize();
    const llmEvent = traceData.events.find((e) => e.type === 'llm.call') as {
      type: string;
      telemetry?: { tokensIn?: number; tokensOut?: number; finishReason?: string };
    };

    expect(llmEvent).toBeDefined();
    expect(llmEvent.telemetry?.tokensIn).toBe(200);
    expect(llmEvent.telemetry?.tokensOut).toBe(75);
    expect(llmEvent.telemetry?.finishReason).toBe('stop');
  });

  test('graceful behavior when trace is undefined', async () => {
    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as {
        onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void;
      };
      // onFinish should still be called even without trace
      if (opts.onFinish) {
        opts.onFinish({
          response: { modelId: 'gpt-4' },
          usage: { inputTokens: 50, outputTokens: 25 },
          finishReason: 'stop',
        });
      }
      return {
        text: 'response without trace',
        response: { modelId: 'gpt-4' },
        finishReason: 'stop',
        usage: { inputTokens: 50, outputTokens: 25 },
      };
    });

    const { runAIRequest } = await import('@bun/ai/request-runner');

    // Call without trace - should not throw
    const result = await runAIRequest({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
      systemPrompt: 'system',
      userPrompt: 'user',
      errorContext: 'test context',
      // trace is undefined
    });

    expect(result).toBe('response without trace');
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  test('onFinish data is used for telemetry when available', async () => {
    // Test that onFinish callback data takes precedence
    const onFinishTokens = { inputTokens: 999, outputTokens: 888 };
    const resultTokens = { inputTokens: 100, outputTokens: 50 };

    mockGenerateText.mockImplementation(async (options: unknown) => {
      const opts = options as {
        onFinish?: (params: { response: unknown; usage: unknown; finishReason: string }) => void;
      };
      if (opts.onFinish) {
        opts.onFinish({
          response: { modelId: 'callback-model' },
          usage: onFinishTokens,
          finishReason: 'length',
        });
      }
      // Return different values than onFinish to verify onFinish takes precedence
      return {
        text: 'generated response',
        response: { modelId: 'result-model' },
        finishReason: 'stop',
        usage: resultTokens,
      };
    });

    const { runAIRequest } = await import('@bun/ai/request-runner');
    const { createTraceCollector } = await import('@bun/trace');

    const trace = createTraceCollector({
      runId: 'test-precedence',
      action: 'generate.full',
      promptMode: 'full',
      rng: { seed: 1, algorithm: 'mulberry32' },
    });

    await runAIRequest({
      getModel: () => ({ provider: 'openai', modelId: 'gpt-4' }) as any,
      systemPrompt: 'system',
      userPrompt: 'user',
      errorContext: 'test context',
      trace,
    });

    const traceData = trace.finalize();
    const llmEvent = traceData.events.find((e) => e.type === 'llm.call') as {
      type: string;
      telemetry?: { tokensIn?: number; tokensOut?: number; finishReason?: string };
    };

    // onFinish data should be used for telemetry
    expect(llmEvent.telemetry?.tokensIn).toBe(999);
    expect(llmEvent.telemetry?.tokensOut).toBe(888);
    expect(llmEvent.telemetry?.finishReason).toBe('length');
  });
});
