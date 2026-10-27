export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_LENGTH = 1000;
const MIN_LENGTH = 2;

/**
 * Validate raw user input before it reaches the agent. This is the boundary
 * check that guards the pipeline from empty, oversized, or non-string input.
 */
export function validateInput(raw: unknown): ValidationResult {
  if (typeof raw !== 'string') {
    return { valid: false, error: 'Message must be text.' };
  }
  const trimmed = raw.trim();
  if (trimmed.length < MIN_LENGTH) {
    return { valid: false, error: 'Please enter a question at least 2 characters long.' };
  }
  if (trimmed.length > MAX_LENGTH) {
    return { valid: false, error: `Message is too long (max ${MAX_LENGTH} characters).` };
  }
  return { valid: true };
}

export const INPUT_LIMITS = { MAX_LENGTH, MIN_LENGTH };
