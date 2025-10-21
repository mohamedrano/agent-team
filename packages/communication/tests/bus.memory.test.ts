import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { MemoryBus, type MessageEnvelope } from "../src/index.js";
import { newId } from "../src/utils/id.js";
import { nowMs } from "../src/utils/time.js";

const baseMessage = (): MessageEnvelope => ({
  id: newId(),
  ts: nowMs(),
  type: "TASK",
  qos: "at-least-once",
  from: "tester",
  topic: "demo",
  payload: { data: "ok" },
});

describe("MemoryBus", () => {
  let bus: MemoryBus;

  beforeEach(() => {
    bus = new MemoryBus();
  });

  afterEach(async () => {
    await bus.close();
  });

  it("delivers published messages to subscribers", async () => {
    const received: MessageEnvelope[] = [];
    await bus.subscribe("demo", (msg) => {
      received.push(msg);
    });

    await bus.publish(baseMessage());

    expect(received).toHaveLength(1);
    expect(received[0]?.topic).toBe("demo");
  });

  it("supports wildcard subscribers", async () => {
    const received: MessageEnvelope[] = [];
    await bus.subscribe("*", (msg) => {
      received.push(msg);
    });

    await bus.publish(baseMessage());

    expect(received).toHaveLength(1);
  });

  it("applies subscription filters", async () => {
    let count = 0;
    await bus.subscribe("demo", () => {
      count += 1;
    }, {
      filter: (msg) => msg.payload && (msg.payload as any).allow === true,
    });

    await bus.publish({ ...baseMessage(), payload: { allow: false } });
    await bus.publish({ ...baseMessage(), payload: { allow: true } });

    expect(count).toBe(1);
  });

  it("handles multiple handlers per topic", async () => {
    const calls: string[] = [];
    await bus.subscribe("demo", () => {
      calls.push("a");
    });
    await bus.subscribe("demo", () => {
      calls.push("b");
    });

    await bus.publish(baseMessage());

    expect(calls).toEqual(["a", "b"]);
  });
});
