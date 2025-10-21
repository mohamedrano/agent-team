/* eslint-disable no-undef */
import { describe, it, expect } from "vitest";
import { CommAdapter } from "../src/adapters/CommAdapter.js";
import type { MessageEnvelope } from "@agent-team/communication";

describe("CommAdapter - Schema Validation", () => {
  it("should successfully send a valid message envelope", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const validEnvelope: MessageEnvelope = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      topic: "test::topic",
      from: "agent-1",
      payload: { data: "test" },
    };

    await expect(adapter.send(validEnvelope)).resolves.not.toThrow();

    await adapter.stop();
  });

  it("should reject envelope with missing required id field", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const invalidEnvelope = {
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      topic: "test::topic",
      from: "agent-1",
      payload: { data: "test" },
    } as any;

    await expect(adapter.send(invalidEnvelope)).rejects.toThrow();

    await adapter.stop();
  });

  it("should reject envelope with invalid type", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const invalidEnvelope = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "INVALID_TYPE",
      qos: "at-least-once",
      topic: "test::topic",
      from: "agent-1",
      payload: { data: "test" },
    } as any;

    await expect(adapter.send(invalidEnvelope)).rejects.toThrow();

    await adapter.stop();
  });

  it("should reject envelope with invalid qos", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const invalidEnvelope = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "invalid-qos",
      topic: "test::topic",
      from: "agent-1",
      payload: { data: "test" },
    } as any;

    await expect(adapter.send(invalidEnvelope)).rejects.toThrow();

    await adapter.stop();
  });

  it("should accept envelope with missing optional topic", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const envelopeWithoutTopic = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      from: "agent-1",
      payload: { data: "test" },
    } as any;

    // Topic is optional, so this should succeed
    await expect(adapter.send(envelopeWithoutTopic)).resolves.not.toThrow();

    await adapter.stop();
  });

  it("should reject envelope with invalid timestamp type", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const invalidEnvelope = {
      id: crypto.randomUUID(),
      ts: "not-a-number",
      type: "TASK",
      qos: "at-least-once",
      topic: "test::topic",
      from: "agent-1",
      payload: { data: "test" },
    } as any;

    await expect(adapter.send(invalidEnvelope)).rejects.toThrow();

    await adapter.stop();
  });

  it("should successfully publish via convenience method", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const messages: MessageEnvelope[] = [];
    adapter.subscribe("test::publish", async (msg) => {
      messages.push(msg);
    });

    await adapter.publish("test::publish", { value: 42 }, "agent-1");

    // Wait a bit for message to be delivered
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(messages).toHaveLength(1);
    expect(messages[0].topic).toBe("test::publish");
    expect(messages[0].from).toBe("agent-1");
    expect(messages[0].payload).toEqual({ value: 42 });

    await adapter.stop();
  });

  it("should handle subscription and message routing", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const receivedMessages: MessageEnvelope[] = [];

    adapter.subscribe("routing::test", async (msg) => {
      receivedMessages.push(msg);
    });

    const envelope: MessageEnvelope = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      topic: "routing::test",
      from: "sender-1",
      payload: { action: "process" },
    };

    await adapter.send(envelope);

    const envId = envelope.id;

    // Wait for message to be routed
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].id).toBe(envId);

    await adapter.stop();
  });

  it("should accept envelope with all valid message types", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const types: Array<MessageEnvelope["type"]> = ["TASK", "TOOL_CALL", "DEBATE_PROPOSAL", "DEBATE_CRITIQUE", "DEBATE_DECISION"];

    for (const type of types) {
      const envelope: MessageEnvelope = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        type,
        qos: "at-least-once",
        topic: "test::types",
        from: "agent-1",
        payload: { type },
      };

      await expect(adapter.send(envelope)).resolves.not.toThrow();
    }

    await adapter.stop();
  });

  it("should accept envelope with all valid qos levels", async () => {
    const adapter = new CommAdapter();
    await adapter.start();

    const qosLevels: Array<MessageEnvelope["qos"]> = ["at-most-once", "at-least-once", "exactly-once"];

    for (const qos of qosLevels) {
      const envelope: MessageEnvelope = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        type: "TASK",
        qos,
        topic: "test::qos",
        from: "agent-1",
        payload: { qos },
      };

      await expect(adapter.send(envelope)).resolves.not.toThrow();
    }

    await adapter.stop();
  });
});
