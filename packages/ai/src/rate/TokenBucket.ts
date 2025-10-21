/**
 * Token bucket rate limiter
 */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private capacity: number,
    private refillPerSec: number
  ) {
    this.tokens = capacity;
    this.last = Date.now();
  }

  /**
   * Attempt to take tokens from the bucket
   * @param n Number of tokens to take
   * @returns true if tokens were available, false otherwise
   */
  take(n = 1): boolean {
    const now = Date.now();
    const elapsed = (now - this.last) / 1000;
    
    // Refill tokens based on elapsed time
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillPerSec
    );
    this.last = now;

    if (this.tokens >= n) {
      this.tokens -= n;
      return true;
    }

    return false;
  }

  /**
   * Wait until tokens are available
   */
  async waitForTokens(n = 1): Promise<void> {
    while (!this.take(n)) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    return this.tokens;
  }

  /**
   * Reset the bucket
   */
  reset(): void {
    this.tokens = this.capacity;
    this.last = Date.now();
  }
}
