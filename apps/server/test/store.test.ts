import { describe, it, expect, beforeEach } from "vitest";
import { computeEtag, MemoryStateStore } from "../src/state/store.js";

describe("State Store", () => {
  describe("computeEtag", () => {
    it("should compute a consistent ETag for the same value and version", () => {
      const value = { a: 1, b: "hello" };
      const version = 1;
      const etag1 = computeEtag(value, version);
      const etag2 = computeEtag(value, version);
      expect(etag1).toBe(etag2);
    });

    it("should compute a different ETag for a different value", () => {
      const value1 = { a: 1, b: "hello" };
      const value2 = { a: 2, b: "world" };
      const version = 1;
      const etag1 = computeEtag(value1, version);
      const etag2 = computeEtag(value2, version);
      expect(etag1).not.toBe(etag2);
    });

    it("should compute a different ETag for a different version", () => {
      const value = { a: 1, b: "hello" };
      const version1 = 1;
      const version2 = 2;
      const etag1 = computeEtag(value, version1);
      const etag2 = computeEtag(value, version2);
      expect(etag1).not.toBe(etag2);
    });
  });

  describe("MemoryStateStore", () => {
    let store: MemoryStateStore;

    beforeEach(() => {
      store = new MemoryStateStore();
    });

    it("should set and get a value", async () => {
      const value = { a: 1, b: "hello" };
      await store.set("my-key", value);
      const artifact = await store.get("my-key");
      expect(artifact?.value).toEqual(value);
    });

    it("should merge a value", async () => {
      const value1 = { a: 1, b: "hello" };
      const value2 = { b: "world", c: 2 };
      await store.set("my-key", value1);
      await store.merge("my-key", value2);
      const artifact = await store.get("my-key");
      expect(artifact?.value).toEqual({ a: 1, b: "world", c: 2 });
    });

    it("should delete a value", async () => {
      const value = { a: 1, b: "hello" };
      await store.set("my-key", value);
      await store.delete("my-key");
      const artifact = await store.get("my-key");
      expect(artifact).toBeNull();
    });

    it("should list all values", async () => {
      await store.set("key1", { a: 1 });
      await store.set("key2", { b: 2 });
      const list = await store.list();
      expect(list.length).toBe(2);
      expect(list.map((item) => item.key)).toEqual(["key1", "key2"]);
    });

    it("should create a snapshot", async () => {
      await store.set("key1", { a: 1 });
      await store.set("key2", { b: 2 });
      const snapshot = await store.snapshot();
      expect(snapshot.data["key1"]).toEqual({ a: 1 });
      expect(snapshot.data["key2"]).toEqual({ b: 2 });
    });

    it("should clear the store", async () => {
      await store.set("key1", { a: 1 });
      await store.set("key2", { b: 2 });
      await store.clear();
      const list = await store.list();
      expect(list.length).toBe(0);
    });

    describe("snapshot redaction", () => {
      it("should redact common secret-like fields", async () => {
        const value = {
          a: 1,
          b: "hello",
          secret: "my-secret",
          token: "my-token",
          apiKey: "my-api-key",
          password: "my-password",
          credentials: {
            username: "user",
            password: "my-password",
          },
        };
        await store.set("my-key", value);
        const snapshot = await store.snapshot(true);
        const redacted = snapshot.data["my-key"] as any;
        expect(redacted.secret).toBe("***REDACTED***");
        expect(redacted.token).toBe("***REDACTED***");
        expect(redacted.apiKey).toBe("***REDACTED***");
        expect(redacted.password).toBe("***REDACTED***");
        expect(redacted.credentials).toBe("***REDACTED***");
      });

      it("should not redact non-secret fields", async () => {
        const value = {
          a: 1,
          b: "hello",
          name: "Jules",
        };
        await store.set("my-key", value);
        const snapshot = await store.snapshot(true);
        const redacted = snapshot.data["my-key"] as any;
        expect(redacted.a).toBe(1);
        expect(redacted.b).toBe("hello");
        expect(redacted.name).toBe("Jules");
      });

      it("should not redact if redact is false", async () => {
        const value = {
          a: 1,
          b: "hello",
          secret: "my-secret",
        };
        await store.set("my-key", value);
        const snapshot = await store.snapshot(false);
        const redacted = snapshot.data["my-key"] as any;
        expect(redacted.secret).toBe("my-secret");
      });
    });
  });
});
