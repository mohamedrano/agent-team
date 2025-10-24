import { describe, expect, it, vi } from "vitest";
import { MemoryIdemStore, RedisIdemStore } from "../src/index.js";

describe("MemoryIdemStore", () => {
  it("marks and detects seen ids", async () => {
    const store = new MemoryIdemStore();
    const id = "abc";
    await store.mark(id, 1);
    expect(await store.seen(id)).toBe(true);
  });

  it("expires entries after ttl and sweep", async () => {
    vi.useFakeTimers();
    const store = new MemoryIdemStore();
    const id = "late";
    await store.mark(id, 1);
    vi.advanceTimersByTime(1_500);
    await store.sweep?.();
    expect(await store.seen(id)).toBe(false);
    vi.useRealTimers();
  });
});

describe("RedisIdemStore", () => {
  let mockRedis: any;
  let store: RedisIdemStore;

  beforeEach(() => {
    mockRedis = {
      set: vi.fn(),
      exists: vi.fn()
    };
    store = new RedisIdemStore(mockRedis);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should check if id has been seen", async () => {
    mockRedis.exists.mockResolvedValue(0); // Key doesn't exist

    const result = await store.seen("test-id");

    expect(result).toBe(false);
    expect(mockRedis.exists).toHaveBeenCalledWith("idem::test-id");
  });

  it("should return true if id exists", async () => {
    mockRedis.exists.mockResolvedValue(1); // Key exists

    const result = await store.seen("existing-id");

    expect(result).toBe(true);
    expect(mockRedis.exists).toHaveBeenCalledWith("idem::existing-id");
  });

  it("should mark id with TTL", async () => {
    mockRedis.set.mockResolvedValue("OK");

    await store.mark("new-id", 300);

    expect(mockRedis.set).toHaveBeenCalledWith(
      "idem::new-id",
      "1",
      "EX",
      300,
      "NX"
    );
  });

  it("should enforce minimum TTL of 1 second", async () => {
    mockRedis.set.mockResolvedValue("OK");

    await store.mark("short-ttl", 0);

    expect(mockRedis.set).toHaveBeenCalledWith(
      "idem::short-ttl",
      "1",
      "EX",
      1, // Should be clamped to 1
      "NX"
    );
  });

  it("should handle negative TTL", async () => {
    mockRedis.set.mockResolvedValue("OK");

    await store.mark("negative-ttl", -5);

    expect(mockRedis.set).toHaveBeenCalledWith(
      "idem::negative-ttl",
      "1",
      "EX",
      1, // Should be clamped to 1
      "NX"
    );
  });

  it("should use key prefix for all operations", async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.set.mockResolvedValue("OK");

    await store.seen("test-key");
    await store.mark("test-key", 60);

    expect(mockRedis.exists).toHaveBeenCalledWith("idem::test-key");
    expect(mockRedis.set).toHaveBeenCalledWith(
      "idem::test-key",
      "1",
      "EX",
      60,
      "NX"
    );
  });

  it("should handle Redis errors gracefully", async () => {
    mockRedis.exists.mockRejectedValue(new Error("Redis connection failed"));

    await expect(store.seen("failing-key")).rejects.toThrow("Redis connection failed");
  });

  it("should handle mark Redis errors gracefully", async () => {
    mockRedis.set.mockRejectedValue(new Error("Redis write failed"));

    await expect(store.mark("failing-mark", 60)).rejects.toThrow("Redis write failed");
  });

  it("should support large TTL values", async () => {
    mockRedis.set.mockResolvedValue("OK");

    await store.mark("long-ttl", 86400); // 24 hours

    expect(mockRedis.set).toHaveBeenCalledWith(
      "idem::long-ttl",
      "1",
      "EX",
      86400,
      "NX"
    );
  });
});
