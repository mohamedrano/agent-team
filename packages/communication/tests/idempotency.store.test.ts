import { describe, expect, it, vi } from "vitest";
import { MemoryIdemStore } from "../src/index.js";

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
