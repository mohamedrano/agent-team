/**
 * Timeout policy configuration
 */
export interface TimeoutPolicy {
  taskTimeout: number;
  workflowTimeout: number;
}

/**
 * Default timeout policy (milliseconds)
 */
export const DEFAULT_TIMEOUT_POLICY: TimeoutPolicy = {
  taskTimeout: 60_000, // 1 minute
  workflowTimeout: 600_000, // 10 minutes
};

/**
 * Execute a promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}
