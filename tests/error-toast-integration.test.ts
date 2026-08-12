/**
 * Error Toast Integration Tests
 * Tests the integration between error handlers and toast notifications
 *
 * Integration Testing for Error Toast Notifications
 * Tests error toast display, deduplication, queue management, and error categorization
 */
import { describe, test, expect, beforeEach, mock } from 'bun:test';

import { handleGenerationError, getErrorToastType } from '@/lib/session-helpers';
import { RpcClientError } from '@/services/rpc-shim-error';
import {
  ValidationError,
  AIGenerationError,
  StorageError,
  InvariantError,
} from '@shared/errors';

import type { ChatMessage } from '@/lib/chat-utils';
import type { Logger } from '@shared/logger';

describe('Error Toast Integration', () => {
  describe('Task 4.2: Error Toast Display', () => {
    let setChatMessages: ReturnType<typeof mock>;
    let showToast: ReturnType<typeof mock>;
    let logger: Logger;

    beforeEach(() => {
      setChatMessages = mock(() => {});
      showToast = mock(() => {});
      logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;
    });

    test('should show red toast for AIGenerationError', () => {
      const error = new AIGenerationError('AI generation failed');

      handleGenerationError(
        error,
        'generate prompt',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain('AI generation failed');
      expect(type).toBe('error');
    });

    test('should show red toast for StorageError', () => {
      const error = new StorageError('Failed to save session', 'write');

      handleGenerationError(
        error,
        'save session',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain('Failed to save session');
      expect(type).toBe('error');
    });

    test('should show red toast for InvariantError', () => {
      const error = new InvariantError('Invalid state: session is null');

      handleGenerationError(
        error,
        'update session',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain('Invalid state');
      expect(type).toBe('error');
    });

    test('should show orange toast for ValidationError', () => {
      const error = new ValidationError('Prompt too long (1024/1000 characters)');

      handleGenerationError(
        error,
        'validate prompt',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain('Prompt too long');
      expect(type).toBe('warning');
    });

    test('should show warning toast for RpcClientError validation failures', () => {
      const error = new RpcClientError({
        code: 'RPC_VALIDATION',
        message: 'Invalid refinement payload.',
      });

      handleGenerationError(
        error,
        'refine prompt',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain('Invalid refinement payload.');
      expect(type).toBe('warning');
    });

    test('should show toast and chat message simultaneously', () => {
      const error = new AIGenerationError('Generation failed');

      handleGenerationError(
        error,
        'generate prompt',
        setChatMessages as any,
        showToast as any,
        logger
      );

      // Toast notification triggered
      expect(showToast).toHaveBeenCalledTimes(1);

      // Chat message added
      expect(setChatMessages).toHaveBeenCalledTimes(1);
      const updateFn = setChatMessages.mock.calls[0]?.[0] as (prev: ChatMessage[]) => ChatMessage[];

      const prevMessages: ChatMessage[] = [{ role: 'user', content: 'Generate prompt' }];
      const newMessages = updateFn(prevMessages);

      expect(newMessages.length).toBe(2);
      expect(newMessages[1]?.role).toBe('ai');
      expect(newMessages[1]?.content).toContain('Error:');
      expect(newMessages[1]?.content).toContain('Generation failed');
    });

    test('should show red toast for generic Error', () => {
      const error = new Error('Unexpected error occurred');

      handleGenerationError(
        error,
        'perform action',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain('Unexpected error occurred');
      expect(type).toBe('error'); // Unknown errors default to 'error'
    });

    test('should show red toast for unknown error types', () => {
      const error = 'String error message';

      handleGenerationError(
        error,
        'perform action',
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [_message, type] = showToast.mock.calls[0] as [string, string];
      expect(type).toBe('error'); // Unknown errors default to 'error'
    });
  });

  describe('Task 4.3: Test Deduplication in Error Scenarios', () => {
    test('getErrorToastType categorizes errors correctly for deduplication', () => {
      // Warnings (should deduplicate separately from errors)
      expect(getErrorToastType(new ValidationError('test'))).toBe('warning');
      expect(
        getErrorToastType(
          new RpcClientError({ code: 'RPC_VALIDATION', message: 'Invalid request.' })
        )
      ).toBe('warning');

      // Critical errors
      expect(getErrorToastType(new AIGenerationError('test'))).toBe('error');
      expect(getErrorToastType(new StorageError('test', 'write'))).toBe('error');
      expect(getErrorToastType(new InvariantError('test'))).toBe('error');

      // Unknown errors default to critical
      expect(getErrorToastType(new Error('unknown'))).toBe('error');
      expect(getErrorToastType('string error')).toBe('error');
    });

    test('same error message with different types should create separate toasts', () => {
      const message = 'Operation failed';

      // Simulate two errors with same message but different types
      const validationError = new ValidationError(message);
      const aiError = new AIGenerationError(message);

      const type1 = getErrorToastType(validationError);
      const type2 = getErrorToastType(aiError);

      // Different types should not deduplicate
      expect(type1).toBe('warning');
      expect(type2).toBe('error');
      expect(type1).not.toBe(type2);
    });

    test('rapid identical errors should use same toast type for deduplication', () => {
      const error1 = new AIGenerationError('AI generation failed');
      const error2 = new AIGenerationError('AI generation failed');

      const type1 = getErrorToastType(error1);
      const type2 = getErrorToastType(error2);

      // Same error class should always map to same type
      expect(type1).toBe(type2);
      expect(type1).toBe('error');
    });

    test('chat messages should not be deduplicated (all preserved)', () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      const error = new AIGenerationError('Generation failed');

      // Trigger error 3 times
      for (let i = 0; i < 3; i++) {
        handleGenerationError(
          error,
          'generate prompt',
          setChatMessages as any,
          showToast as any,
          logger
        );
      }

      // showToast called 3 times (deduplication happens in ToastProvider)
      expect(showToast).toHaveBeenCalledTimes(3);

      // setChatMessages also called 3 times (no deduplication in chat)
      expect(setChatMessages).toHaveBeenCalledTimes(3);
    });
  });

  describe('Task 4.4: Test Queue Overflow Scenarios', () => {
    test('simulates 5+ errors triggering queue management logic', () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      // Create 5 different errors
      const errors = [
        new AIGenerationError('Error 1'),
        new StorageError('Error 2', 'write'),
        new InvariantError('Error 3'),
        new Error('Error 4'),
        new ValidationError('Error 5'),
      ];

      // Trigger all 5 errors
      errors.forEach((error, i) => {
        handleGenerationError(
          error,
          `action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      });

      // All errors should trigger showToast
      expect(showToast).toHaveBeenCalledTimes(5);

      // Verify error categorization
      // AIGenerationError, StorageError, InvariantError, Error -> error
      // ValidationError -> warning
      const expectedTypes: ('error' | 'warning')[] = [
        'error',
        'error',
        'error',
        'error',
        'warning',
      ];
      errors.forEach((error, i) => {
        const expectedType = getErrorToastType(error);
        expect(expectedType).toBe(expectedTypes[i]!);
      });
    });

    test('handles 10+ rapid errors gracefully', () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      // Trigger 10 different errors
      for (let i = 0; i < 10; i++) {
        const error = new AIGenerationError(`Error ${i + 1}`);
        handleGenerationError(
          error,
          `action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      }

      // All errors should trigger showToast (FIFO handled in ToastProvider)
      expect(showToast).toHaveBeenCalledTimes(10);

      // All errors logged
      expect(logger.error).toHaveBeenCalledTimes(10);

      // All chat messages added
      expect(setChatMessages).toHaveBeenCalledTimes(10);
    });

    test('verifies error categorization is consistent for queue management', () => {
      // Same error type should always produce same toast type
      const errors = [
        new ValidationError('Validation 1'),
        new ValidationError('Validation 2'),
        new ValidationError('Validation 3'),
      ];

      errors.forEach((error) => {
        expect(getErrorToastType(error)).toBe('warning');
      });
    });
  });

  describe('Dual Display Strategy', () => {
    test('errors appear in both toast and chat', () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      const error = new AIGenerationError('Generation failed');

      handleGenerationError(
        error,
        'generate prompt',
        setChatMessages as any,
        showToast as any,
        logger
      );

      // Toast notification (immediate feedback)
      expect(showToast).toHaveBeenCalledTimes(1);
      // Toast should be called with error message

      // Chat message (permanent history)
      expect(setChatMessages).toHaveBeenCalledTimes(1);
      // Chat messages are added via setState updater function
      // Both toast and chat message should be triggered
    });

    test('toast provides immediate feedback, chat preserves history', () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      // Trigger 3 errors
      for (let i = 0; i < 3; i++) {
        const error = new AIGenerationError(`Error ${i + 1}`);
        handleGenerationError(
          error,
          `action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      }

      // Toast called 3 times (may deduplicate in provider)
      expect(showToast).toHaveBeenCalledTimes(3);

      // Chat called 3 times (all errors preserved)
      expect(setChatMessages).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Error Categorization Edge Cases', () => {
  test('handles null and undefined errors', () => {
    expect(getErrorToastType(null)).toBe('error');
    expect(getErrorToastType(undefined)).toBe('error');
  });

  test('handles non-Error objects', () => {
    expect(getErrorToastType({ message: 'custom error' })).toBe('error');
    expect(getErrorToastType(42)).toBe('error');
    expect(getErrorToastType(true)).toBe('error');
  });

  test('handles Error subclasses not in categorization list', () => {
    class CustomError extends Error {}
    const error = new CustomError('Custom error occurred');

    expect(getErrorToastType(error)).toBe('error');
  });
});
