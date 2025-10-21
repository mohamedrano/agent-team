import { describe, it, expect, vi } from "vitest";
import { expo, calculateDelay, DEFAULT_RETRY_POLICY } from "../src/policies/retry.js";
import { withTimeout } from "../src/policies/timeouts.js";

describe("Retry Policies", () => {
  it("should calculate exponential backoff correctly", () => {
    expect(expo(0)).toBe(100);
    expect(expo(1)).toBe(200);
    expect(expo(2)).toBe(400);
    expect(expo(3)).toBe(800);
    expect(expo(10)).toBe(30_000); // capped at max
  });

  it("should respect custom base and max values", () => {
    expect(expo(0, 50, 1000)).toBe(50);
    expect(expo(1, 50, 1000)).toBe(100);
    expect(expo(5, 50, 1000)).toBe(1000); // capped
  });

  it("should calculate delay based on retry policy", () => {
    const policy = { ...DEFAULT_RETRY_POLICY, baseDelay: 200 };
    expect(calculateDelay(0, policy)).toBe(200);
    expect(calculateDelay(1, policy)).toBe(400);
    expect(calculateDelay(2, policy)).toBe(800);
  });

  it("should handle linear backoff", () => {
    const policy = {
      maxAttempts: 5,
      baseDelay: 100,
      maxDelay: 1000,
      backoffType: "linear" as const
    };

    expect(calculateDelay(0, policy)).toBe(100);
    expect(calculateDelay(1, policy)).toBe(200);
    expect(calculateDelay(2, policy)).toBe(300);
    expect(calculateDelay(10, policy)).toBe(1000); // capped
  });

  it("should handle constant backoff", () => {
    const policy = {
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 5000,
      backoffType: "constant" as const
    };

    expect(calculateDelay(0, policy)).toBe(500);
    expect(calculateDelay(5, policy)).toBe(500);
    expect(calculateDelay(10, policy)).toBe(500);
  });
});

describe("Timeout Policies", () => {
  it("should complete promise before timeout", async () => {
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve("success"), 10);
    });

    const result = await withTimeout(promise, 100, "Timeout");
    expect(result).toBe("success");
  });

  it("should timeout slow promises", async () => {
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve("too late"), 200);
    });

    await expect(withTimeout(promise, 50, "Operation timed out")).rejects.toThrow(
      "Operation timed out"
    );
  });

  it("should propagate promise rejections", async () => {
    const promise = Promise.reject(new Error("Promise failed"));

    await expect(withTimeout(promise, 100)).rejects.toThrow("Promise failed");
  });
});
