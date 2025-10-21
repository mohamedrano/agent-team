import { describe, it, expect, beforeEach } from "vitest";
import { TokenBucket } from "../src/rate/TokenBucket.js";

describe("Token Bucket Rate Limiter", () => {
  let bucket: TokenBucket;

  beforeEach(() => {
    bucket = new TokenBucket(10, 5); // 10 tokens, refill 5/sec
  });

  it("should initialize with full capacity", () => {
    expect(bucket.getTokens()).toBe(10);
  });

  it("should take tokens successfully", () => {
    expect(bucket.take(3)).toBe(true);
    expect(bucket.getTokens()).toBe(7);
  });

  it("should reject when insufficient tokens", () => {
    bucket.take(8);
    expect(bucket.take(5)).toBe(false);
  });

  it("should refill tokens over time", async () => {
    bucket.take(10); // Empty the bucket
    expect(bucket.getTokens()).toBe(0);

    // Wait for refill (5 tokens/sec)
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(bucket.take(4)).toBe(true);
  });

  it("should not exceed capacity", async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Should be capped at 10 even after 3 seconds
    expect(bucket.getTokens()).toBeLessThanOrEqual(10);
  });

  it("should wait for tokens", async () => {
    const startTime = Date.now();

    bucket.take(10); // Empty
    await bucket.waitForTokens(1);

    const elapsed = Date.now() - startTime;

    // Should have waited for refill
    expect(elapsed).toBeGreaterThan(100);
  });

  it("should reset to full capacity", () => {
    bucket.take(10);
    expect(bucket.getTokens()).toBe(0);

    bucket.reset();
    expect(bucket.getTokens()).toBe(10);
  });

  it("should handle fractional refills", async () => {
    const fastBucket = new TokenBucket(100, 100); // 100/sec

    fastBucket.take(100);
    expect(fastBucket.getTokens()).toBe(0);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Try to take 1 token to trigger refill calculation
    fastBucket.take(0); 

    // Should have refilled some tokens after 0.6 seconds
    const tokens = fastBucket.getTokens();
    expect(tokens).toBeGreaterThan(30); // More forgiving timing
    expect(tokens).toBeLessThan(70);
  });
});
