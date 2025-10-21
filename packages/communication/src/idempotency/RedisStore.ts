import type { IdempotencyStore } from "./Store.js";

const KEY_PREFIX = "idem::";

type RedisLike = {
  set(key: string, value: string, mode: string, ttl: number, flag: string): Promise<string | null>;
  exists(key: string): Promise<number>;
};

export class RedisIdemStore implements IdempotencyStore {
  constructor(private client: RedisLike) {}

  async seen(id: string): Promise<boolean> {
    const exists = await this.client.exists(KEY_PREFIX + id);
    return exists > 0;
  }

  async mark(id: string, ttlSec: number): Promise<void> {
    await this.client.set(KEY_PREFIX + id, "1", "EX", Math.max(1, ttlSec), "NX");
  }
}
