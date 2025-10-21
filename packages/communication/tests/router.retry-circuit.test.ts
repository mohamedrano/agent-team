import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MemoryBus, Router, MemoryIdemStore } from "../src/index.js";
import { newId } from "../src/utils/id.js";
import { nowMs } from "../src/utils/time.js";

const buildMessage = () => ({
  id: newId(),
  ts: nowMs(),
  type: "TASK" as const,
  qos: "exactly-once" as const,
  from: "origin",
  to: "agent-1",
  payload: { ok: true },
});

describe("Router retry & circuit breaker", () => {
  let bus: MemoryBus;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers();
    bus = new MemoryBus();
    router = new Router(bus, {
      idempotency: { store: new MemoryIdemStore(), ttlSeconds: 60 },
      maxAttempts: 6,
    });
    await router.start();
  });

  afterEach(async () => {
    await router.stop();
    await bus.close();
    vi.useRealTimers();
  });

  it("retries handler until it succeeds", async () => {
    let attempts = 0;
    router.registerAgent("agent-1", async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("fail");
      }
    });

    const publishPromise = bus.publish(buildMessage());

    await vi.runAllTimersAsync();
    await publishPromise;

    expect(attempts).toBe(3);
  });

  it("opens the circuit after repeated failures", async () => {
    let attempts = 0;
    router.registerAgent("agent-1", async () => {
      attempts += 1;
      throw new Error("boom");
    });

    const publishPromise = bus.publish(buildMessage());
    await vi.runAllTimersAsync();
    await publishPromise.catch(() => undefined);

    expect(attempts).toBeLessThanOrEqual(5);
    expect(attempts).toBeGreaterThanOrEqual(5);

    vi.advanceTimersByTime(61_000);

    const secondMessage = buildMessage();
    const publishPromise2 = bus.publish(secondMessage);
    await vi.runAllTimersAsync();
    await publishPromise2.catch(() => undefined);

    expect(attempts).toBeGreaterThan(5);
  });

  it("skips duplicate messages when idempotency enabled", async () => {
    let calls = 0;
    router.registerAgent("agent-1", async () => {
      calls += 1;
    });

    const message = buildMessage();
    await bus.publish(message);
    await vi.runAllTimersAsync();

    await bus.publish(message);
    await vi.runAllTimersAsync();

    expect(calls).toBe(1);
  });
});
