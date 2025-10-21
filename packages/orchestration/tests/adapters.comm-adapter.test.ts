import { describe, it, expect, vi } from "vitest";
import { CommAdapter } from "../src/adapters/CommAdapter.js";

describe("CommAdapter", () => {
  it("should initialize bus and router", () => {
    const adapter = new CommAdapter();

    expect(adapter.bus).toBeDefined();
    expect(adapter.router).toBeDefined();
  });

  it("should start and stop router", async () => {
    const adapter = new CommAdapter();

    // Just verify start/stop don't throw errors
    await expect(adapter.start()).resolves.toBeUndefined();
    await expect(adapter.stop()).resolves.toBeUndefined();
  });

  it("should send messages through the bus", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const received: any[] = [];
    adapter.subscribe("test-topic", async (msg) => {
      received.push(msg);
    });

    await adapter.send({
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      topic: "test-topic",
      from: "test-sender",
      payload: { message: "Hello" }
    });

    // Wait for message processing
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(received.length).toBe(1);
    expect(received[0].payload.message).toBe("Hello");

    await adapter.stop();
  });

  it("should validate message schema", async () => {
    const adapter = new CommAdapter();

    await expect(
      adapter.send({
        id: "invalid-uuid",
        ts: Date.now(),
        type: "TASK",
        qos: "at-least-once",
        from: "test",
        payload: {}
      } as any)
    ).rejects.toThrow();
  });

  it("should publish messages with auto-generated ID", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const received: any[] = [];
    adapter.subscribe("events", async (msg) => {
      received.push(msg);
    });

    await adapter.publish("events", { data: "test" }, "publisher");

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(received.length).toBe(1);
    expect(received[0].payload.data).toBe("test");

    await adapter.stop();
  });
});
