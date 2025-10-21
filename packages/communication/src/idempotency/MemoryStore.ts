import type { IdempotencyStore } from "./Store.js";

export class MemoryIdemStore implements IdempotencyStore {
  private m = new Map<string, number>();
  async seen(id: string){ const v = this.m.get(id); return !!v && v > Date.now(); }
  async mark(id: string, ttlSec: number){ this.m.set(id, Date.now()+ttlSec*1000); }
  sweep(){ const now=Date.now(); for (const [k,v] of this.m) if (v<=now) this.m.delete(k); }
}
