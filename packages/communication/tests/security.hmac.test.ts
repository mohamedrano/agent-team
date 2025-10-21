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

  it("supports key rotation with multiple active keys", () => {
    // Simple key provider implementation for testing
    class RotatingKeyProvider {
      private keys: Map<string, string>;
      private activeKeyId: string;

      constructor() {
        this.keys = new Map([
          ["key-v1", "secret-v1"],
          ["key-v2", "secret-v2"],
          ["key-v3", "secret-v3"]
        ]);
        this.activeKeyId = "key-v1";
      }

      getActiveKey(): { id: string; secret: string } {
        return {
          id: this.activeKeyId,
          secret: this.keys.get(this.activeKeyId)!
        };
      }

      getById(id: string): { id: string; secret: string } | null {
        const secret = this.keys.get(id);
        return secret ? { id, secret } : null;
      }

      rotateToKey(keyId: string): void {
        if (!this.keys.has(keyId)) {
          throw new Error(`Key ${keyId} not found`);
        }
        this.activeKeyId = keyId;
      }
    }

    const provider = new RotatingKeyProvider();

    // Sign with key-v1
    const activeKey1 = provider.getActiveKey();
    const envelope1 = { ...envelope, id: "msg-1" };
    const sig1 = sign(envelope1, activeKey1.secret);
    expect(verify({ ...envelope1, sig: sig1 }, activeKey1.secret)).toBe(true);

    // Rotate to key-v2
    provider.rotateToKey("key-v2");
    const activeKey2 = provider.getActiveKey();
    expect(activeKey2.id).toBe("key-v2");

    // New messages signed with key-v2
    const envelope2 = { ...envelope, id: "msg-2" };
    const sig2 = sign(envelope2, activeKey2.secret);
    expect(verify({ ...envelope2, sig: sig2 }, activeKey2.secret)).toBe(true);

    // Old messages signed with key-v1 still verifiable via getById
    const oldKey = provider.getById("key-v1");
    expect(oldKey).not.toBeNull();
    expect(verify({ ...envelope1, sig: sig1 }, oldKey!.secret)).toBe(true);

    // Rotate to key-v3
    provider.rotateToKey("key-v3");
    const activeKey3 = provider.getActiveKey();
    expect(activeKey3.id).toBe("key-v3");

    // All old messages still verifiable
    const key1 = provider.getById("key-v1");
    const key2 = provider.getById("key-v2");
    expect(verify({ ...envelope1, sig: sig1 }, key1!.secret)).toBe(true);
    expect(verify({ ...envelope2, sig: sig2 }, key2!.secret)).toBe(true);
  });

  it("handles graceful key deprecation", () => {
    class DeprecatingKeyProvider {
      private keys: Map<string, { secret: string; deprecated: boolean }>;
      private activeKeyId: string;

      constructor() {
        this.keys = new Map([
          ["key-old", { secret: "secret-old", deprecated: false }],
          ["key-new", { secret: "secret-new", deprecated: false }]
        ]);
        this.activeKeyId = "key-old";
      }

      getActiveKey(): { id: string; secret: string } {
        return {
          id: this.activeKeyId,
          secret: this.keys.get(this.activeKeyId)!.secret
        };
      }

      getById(id: string): { id: string; secret: string } | null {
        const key = this.keys.get(id);
        // Even deprecated keys can still verify old messages
        return key ? { id, secret: key.secret } : null;
      }

      deprecateKey(keyId: string): void {
        const key = this.keys.get(keyId);
        if (key) {
          key.deprecated = true;
        }
      }

      rotateToKey(keyId: string): void {
        this.activeKeyId = keyId;
      }

      removeKey(keyId: string): void {
        this.keys.delete(keyId);
      }
    }

    const provider = new DeprecatingKeyProvider();

    // Sign with old key
    const oldKey = provider.getActiveKey();
    const oldEnvelope = { ...envelope, id: "old-msg" };
    const oldSig = sign(oldEnvelope, oldKey.secret);

    // Rotate to new key
    provider.rotateToKey("key-new");
    
    // Deprecate old key (but keep it for verification)
    provider.deprecateKey("key-old");

    // Old messages still verifiable
    const retrievedOldKey = provider.getById("key-old");
    expect(retrievedOldKey).not.toBeNull();
    expect(verify({ ...oldEnvelope, sig: oldSig }, retrievedOldKey!.secret)).toBe(true);

    // After grace period, remove old key
    provider.removeKey("key-old");
    expect(provider.getById("key-old")).toBeNull();
  });
});
