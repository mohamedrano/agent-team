import { describe, it, expect } from "vitest";
import { expoBackoff } from "../src/router/policies/backoff.js";

describe("expoBackoff", () => {
  it("should calculate exponential backoff with base delay", () => {
    expect(expoBackoff(0)).toBeGreaterThanOrEqual(100);
    expect(expoBackoff(0)).toBeLessThanOrEqual(200); // base + random(0-100)
  });

  it("should increase delay exponentially", () => {
    const attempt0 = expoBackoff(0, 100, 10000);
    const attempt1 = expoBackoff(1, 100, 10000);
    const attempt2 = expoBackoff(2, 100, 10000);

    expect(attempt1).toBeGreaterThanOrEqual(attempt0);
    expect(attempt2).toBeGreaterThanOrEqual(attempt1);
  });

  it("should respect maximum delay limit", () => {
    const maxDelay = 1000;
    const attempt10 = expoBackoff(10, 100, maxDelay);

    expect(attempt10).toBeGreaterThanOrEqual(maxDelay);
    expect(attempt10).toBeLessThanOrEqual(maxDelay + 100); // max + random(base)
  });

  it("should use custom base delay", () => {
    const base = 50;
    const result = expoBackoff(0, base, 1000);

    expect(result).toBeGreaterThanOrEqual(base);
    expect(result).toBeLessThanOrEqual(base + base); // base + random(0-base)
  });

  it("should handle zero attempt", () => {
    const result = expoBackoff(0, 200, 5000);

    expect(result).toBeGreaterThanOrEqual(200);
    expect(result).toBeLessThanOrEqual(400);
  });

  it("should handle large attempt numbers", () => {
    const result = expoBackoff(20, 100, 30000);

    expect(result).toBeGreaterThanOrEqual(30000);
    expect(result).toBeLessThanOrEqual(30100);
  });

  it("should be deterministic for same inputs (excluding randomness)", () => {
    // Test that the base exponential calculation is deterministic
    const base = 100;
    const max = 10000;

    // For attempt 0: min(max, base * 2^0) = min(10000, 100) = 100
    expect(expoBackoff(0, base, max)).toBeGreaterThanOrEqual(100);

    // For attempt 3: min(max, 100 * 2^3) = min(10000, 800) = 800
    expect(expoBackoff(3, base, max)).toBeGreaterThanOrEqual(800);
  });

  it("should handle edge case of very small max delay", () => {
    const result = expoBackoff(5, 100, 50); // max is smaller than base

    expect(result).toBeGreaterThanOrEqual(50);
    expect(result).toBeLessThanOrEqual(150);
  });

  it("should work with zero base delay", () => {
    const result = expoBackoff(2, 0, 1000);

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(0); // 0 + random(0-0) = 0
    expect(result).toBe(0);
  });
});
