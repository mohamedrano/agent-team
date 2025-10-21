/**
 * Exponential backoff calculation
 * @param attempt Current attempt number (0-indexed)
 * @param base Base delay in milliseconds
 * @param max Maximum delay in milliseconds
 * @returns Calculated delay in milliseconds
 */
export const expo = (attempt: number, base = 100, max = 30_000): number => {
  return Math.min(max, base * (2 ** attempt));
};

/**
 * Sleep utility for retry delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffType: "exponential" | "linear" | "constant";
}

/**
 * Default retry policy
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 30_000,
  backoffType: "exponential"
};

/**
 * Calculate delay based on retry policy
 */
export function calculateDelay(attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  switch (policy.backoffType) {
    case "exponential":
      return expo(attempt, policy.baseDelay, policy.maxDelay);
    case "linear":
      return Math.min(policy.maxDelay, policy.baseDelay * (attempt + 1));
    case "constant":
      return policy.baseDelay;
    default:
      return expo(attempt, policy.baseDelay, policy.maxDelay);
  }
}
