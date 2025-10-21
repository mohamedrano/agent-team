import { describe, expect, it } from "vitest";
import { sign, verify } from "../src/security/signing.js";
import { MessageEnvelopeSchema } from "../src/schemas.js";

const envelope = MessageEnvelopeSchema.parse({
  id: "00000000-0000-4000-8000-000000000001",
  ts: Date.now(),
  type: "TASK",
  qos: "at-least-once",
  from: "agent-a",
  topic: "alpha",
  payload: { value: 1 },
});

describe("HMAC signing", () => {
  it("produces verifiable signatures", () => {
    const secret = "secret-key";
    const sig = sign(envelope, secret);
    expect(sig).toBeTypeOf("string");
    expect(verify({ ...envelope, sig }, secret)).toBe(true);
  });

  it("fails verification with wrong secret", () => {
    const sig = sign(envelope, "secret-key");
    expect(verify({ ...envelope, sig }, "other-secret")).toBe(false);
  });
});
