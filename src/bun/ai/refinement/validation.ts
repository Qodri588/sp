/**
 * Refinement Validation Logic
 *
 * Contains validation functions for refinement operations,
 * including locked phrase handling.
 *
 * @module ai/refinement/validation
 */

/**
 * Validate Ollama availability for offline mode (Ollama support removed).
 */
export async function validateOllamaForRefinement(_endpoint: string): Promise<void> {
  // Ollama support removed - no-op
}

/**
 * Apply locked phrase to prompt if provided.
 *
 * @param prompt - Prompt text to modify
 * @param lockedPhrase - Optional locked phrase to inject
 * @returns Prompt with locked phrase injected if provided
 */
export async function applyLockedPhraseIfNeeded(
  prompt: string,
  lockedPhrase: string | undefined
): Promise<string> {
  if (!lockedPhrase) return prompt;

  const { injectLockedPhrase } = await import('@bun/prompt/postprocess/index');
  return injectLockedPhrase(prompt, lockedPhrase);
}
