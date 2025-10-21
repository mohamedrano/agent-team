import { describe, it, expect, beforeEach, vi } from "vitest";
import { TokenBucket } from "../src/rate/TokenBucket.js";

describe("TokenBucket - Rate Limiting & Denial", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests within capacity", () => {
    const bucket = new TokenBucket(5, 5);

    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
  });

  it("should deny requests when bucket is empty", () => {
    const bucket = new TokenBucket(3, 3);

    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false); // Denied - bucket empty
  });

  it("should refill tokens over time", () => {
    const bucket = new TokenBucket(5, 2); // 2 tokens per second

    // Exhaust bucket
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false); // Empty

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    // Should have 2 new tokens
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false); // Empty again
  });

  it("should not exceed capacity when refilling", () => {
    const bucket = new TokenBucket(3, 10); // High refill rate

    // Use one token
    expect(bucket.take()).toBe(true);

    // Advance time significantly
    vi.advanceTimersByTime(10000); // 10 seconds

    // Should be capped at capacity (3 tokens)
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false);
  });

  it("should handle taking multiple tokens at once", () => {
    const bucket = new TokenBucket(10, 10);

    expect(bucket.take(5)).toBe(true);
    expect(bucket.take(5)).toBe(true);
    expect(bucket.take(1)).toBe(false); // Not enough tokens
  });

  it("should deny when requesting more tokens than available", () => {
    const bucket = new TokenBucket(5, 5);

    expect(bucket.take(3)).toBe(true); // 2 left
    expect(bucket.take(3)).toBe(false); // Not enough
    expect(bucket.take(2)).toBe(true); // Exactly enough
  });

  it("should implement QPS limiting correctly", () => {
    const qps = 3; // 3 queries per second
    const bucket = new TokenBucket(qps, qps);

    // Should allow exactly QPS requests immediately
    for (let i = 0; i < qps; i++) {
      expect(bucket.take()).toBe(true);
    }

    // Next request should be denied
    expect(bucket.take()).toBe(false);

    // After 1 second, should allow QPS requests again
    vi.advanceTimersByTime(1000);
    for (let i = 0; i < qps; i++) {
      expect(bucket.take()).toBe(true);
    }
    expect(bucket.take()).toBe(false);
  });

  it("should handle burst traffic correctly", () => {
    const bucket = new TokenBucket(10, 5); // 10 capacity, 5 per second refill

    // Burst of 10 requests
    for (let i = 0; i < 10; i++) {
      expect(bucket.take()).toBe(true);
    }
    expect(bucket.take()).toBe(false);

    // After 2 seconds, should have 10 tokens (capped at capacity)
    vi.advanceTimersByTime(2000);
    for (let i = 0; i < 10; i++) {
      expect(bucket.take()).toBe(true);
    }
    expect(bucket.take()).toBe(false);
  });

  it("should wait for tokens to become available", async () => {
    vi.useRealTimers(); // Need real timers for async operations

    const bucket = new TokenBucket(2, 4); // 2 capacity, 4 per second

    // Exhaust bucket
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);

    const startTime = Date.now();
    
    // Wait for tokens to become available
    await bucket.waitForTokens();
    
    const elapsed = Date.now() - startTime;
    
    // Should have waited approximately 250ms (for 1 token at 4 per second)
    expect(elapsed).toBeGreaterThanOrEqual(200);
    expect(elapsed).toBeLessThan(500);
  });

  it("should reset bucket to full capacity", () => {
    const bucket = new TokenBucket(5, 5);

    // Exhaust bucket
    for (let i = 0; i < 5; i++) {
      bucket.take();
    }
    expect(bucket.take()).toBe(false);

    // Reset
    bucket.reset();

    // Should be full again
    for (let i = 0; i < 5; i++) {
      expect(bucket.take()).toBe(true);
    }
  });

  it("should report current token count", () => {
    const bucket = new TokenBucket(5, 5);

    expect(bucket.getTokens()).toBe(5);
    
    bucket.take(2);
    expect(bucket.getTokens()).toBe(3);
    
    bucket.take(3);
    expect(bucket.getTokens()).toBe(0);
  });

  it("should handle fractional token refills", () => {
    vi.useRealTimers();

    const bucket = new TokenBucket(10, 10); // 10 per second

    // Exhaust bucket
    for (let i = 0; i < 10; i++) {
      bucket.take();
    }

    // Wait 100ms = 0.1 seconds = 1 token refilled
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    return wait(100).then(() => {
      expect(bucket.take()).toBe(true); // Should have ~1 token
    });
  });

  it("should prevent exceeding rate limit under sustained load", () => {
    const bucket = new TokenBucket(5, 5);

    // First 5 requests succeed
    for (let i = 0; i < 5; i++) {
      expect(bucket.take()).toBe(true);
    }

    // Next 5 requests fail (no refill)
    for (let i = 0; i < 5; i++) {
      expect(bucket.take()).toBe(false);
    }

    // After 1 second, only 5 more succeed
    vi.advanceTimersByTime(1000);
    for (let i = 0; i < 5; i++) {
      expect(bucket.take()).toBe(true);
    }
    expect(bucket.take()).toBe(false);
  });
});
