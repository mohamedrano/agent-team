// ═══════════════════════════════════════════════════════════════════════════════
// State Store - Session State Management with Validation
// ═══════════════════════════════════════════════════════════════════════════════

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { SCHEMA_REGISTRY, StateKey } from "./schemas.js";

export type Dict<T = any> = Record<string, T>;

/**
 * Artifact metadata
 */
export interface ArtifactMeta {
  id: string;                // stable per version
  key: StateKey;             // canonical key
  version: number;           // optimistic concurrency
  updated_at: string;        // ISO timestamp
  updated_by: string;        // agent name
  etag: string;              // sha256 hash over value+version
  schema_ref?: string;       // informational
  size_bytes: number;
}

/**
 * Artifact with value
 */
export interface Artifact<T = unknown> extends ArtifactMeta {
  value: T;
}

/**
 * Options for setting state
 */
export interface SetOptions<T = unknown> {
  expectedEtag?: string;           // CAS (Compare-And-Swap)
  schema?: z.ZodTypeAny | null;    // override default schema
  redactor?: (v: T) => T;          // remove secrets pre-store
  updatedBy?: string;              // agent name
  maxBytes?: number;               // per-artifact guard
}

/**
 * Options for merging state
 */
export interface MergeOptions<T = unknown> extends SetOptions<T> {
  deep?: boolean; // if true, deep-merge objects
}

/**
 * State snapshot for export/backup
 */
export interface StateSnapshot {
  version: number;     // global snapshot version
  taken_at: string;    // ISO timestamp
  entries: ArtifactMeta[];
  data: Dict<unknown>; // key → value
}

/**
 * State store interface
 */
export interface StateStore {
  get<T = unknown>(key: StateKey): Promise<Artifact<T> | null>;
  set<T = unknown>(key: StateKey, value: T, opts?: SetOptions<T>): Promise<Artifact<T>>;
  merge<T = unknown>(key: StateKey, patch: Partial<T>, opts?: MergeOptions<T>): Promise<Artifact<T>>;
  delete(key: StateKey, expectedEtag?: string): Promise<void>;
  list(): Promise<ArtifactMeta[]>;
  snapshot(redact?: boolean): Promise<StateSnapshot>;
  clear(): Promise<void>;
}

/**
 * Compute ETag for artifact
 */
export function computeEtag(value: unknown, version: number): string {
  const h = createHash("sha256");
  h.update(JSON.stringify(value));
  h.update(String(version));
  return h.digest("base64url");
}

/**
 * Default redactor - removes common secret-like fields
 */
function defaultRedactor<T>(v: T): T {
  if (v && typeof v === "object") {
    const clone: any = JSON.parse(JSON.stringify(v));
    const redact = (obj: any) => {
      for (const k of Object.keys(obj)) {
        const lower = k.toLowerCase();
        const isSecret =
          lower.includes("secret") ||
          lower.includes("token") ||
          lower.includes("apikey") ||
          lower.includes("api_key") ||
          lower.includes("password") ||
          lower.includes("credential");
        if (isSecret) {
          obj[k] = "***REDACTED***";
        } else if (obj[k] && typeof obj[k] === "object") {
          redact(obj[k]);
        }
      }
    };
    redact(clone);
    return clone;
  }
  return v;
}

/**
 * In-memory state store implementation
 */
export class MemoryStateStore implements StateStore {
  private data = new Map<StateKey, Artifact<any>>();
  private globalVersion = 0;

  async get<T>(key: StateKey): Promise<Artifact<T> | null> {
    return (this.data.get(key) as Artifact<T>) || null;
  }

  async set<T>(key: StateKey, value: T, opts: SetOptions<T> = {}): Promise<Artifact<T>> {
    const schema = opts.schema ?? (SCHEMA_REGISTRY[key] || null);

    // Validate with Zod if schema exists
    if (schema) {
      const p = schema.safeParse(value);
      if (!p.success) {
        throw new Error(
          `Schema validation failed for '${key}': ${JSON.stringify(p.error.format())}`
        );
      }
    }

    const prev = this.data.get(key);

    // Check ETag for CAS
    if (prev && opts.expectedEtag && prev.etag !== opts.expectedEtag) {
      throw new Error(`ETAG_MISMATCH for key='${key}'`);
    }

    const version = (prev?.version ?? 0) + 1;
    const valueToStore = opts.redactor ? opts.redactor(value) : value;
    const json = JSON.stringify(valueToStore);
    const size = Buffer.byteLength(json, "utf8");
    const max = opts.maxBytes ?? 1_000_000; // 1MB per artifact guard

    if (size > max) {
      throw new Error(`PAYLOAD_TOO_LARGE: ${size} > ${max} bytes`);
    }

    const etag = computeEtag(valueToStore, version);
    const meta: ArtifactMeta = {
      id: prev?.id ?? randomUUID(),
      key,
      version,
      updated_at: new Date().toISOString(),
      updated_by: opts.updatedBy ?? "unknown_agent",
      etag,
      schema_ref: schema ? `[zod:${key}]` : undefined,
      size_bytes: size,
    };

    const art: Artifact<T> = { ...meta, value: valueToStore as T };
    this.data.set(key, art);
    this.globalVersion++;

    return art;
  }

  async merge<T>(key: StateKey, patch: Partial<T>, opts: MergeOptions<T> = {}): Promise<Artifact<T>> {
    const prev = await this.get<T>(key);
    const base = (prev?.value ?? {}) as any;
    const merged = opts.deep ? deepMerge(base, patch) : { ...base, ...(patch as any) };
    return this.set<T>(key, merged, { ...opts, expectedEtag: opts.expectedEtag ?? prev?.etag });
  }

  async delete(key: StateKey, expectedEtag?: string): Promise<void> {
    const prev = this.data.get(key);
    if (!prev) return;

    if (expectedEtag && prev.etag !== expectedEtag) {
      throw new Error(`ETAG_MISMATCH for key='${key}'`);
    }

    this.data.delete(key);
    this.globalVersion++;
  }

  async list(): Promise<ArtifactMeta[]> {
    return Array.from(this.data.values()).map(({ value, ...meta }) => meta);
  }

  async snapshot(redact = true): Promise<StateSnapshot> {
    const entries: ArtifactMeta[] = [];
    const data: Dict = {};

    for (const [k, v] of this.data.entries()) {
      const { value, ...meta } = v;
      entries.push(meta);
      data[k] = redact ? defaultRedactor(value) : value;
    }

    return {
      version: this.globalVersion,
      taken_at: new Date().toISOString(),
      entries,
      data,
    };
  }

  async clear(): Promise<void> {
    this.data.clear();
    this.globalVersion++;
  }
}

/**
 * Deep merge utility
 */
function deepMerge(a: any, b: any): any {
  if (Array.isArray(a) && Array.isArray(b)) {
    return [...a, ...b];
  }
  if (isObj(a) && isObj(b)) {
    const out: any = { ...a };
    for (const k of Object.keys(b)) {
      out[k] = deepMerge(a[k], b[k]);
    }
    return out;
  }
  return b === undefined ? a : b;
}

function isObj(x: any): boolean {
  return x && typeof x === "object" && !Array.isArray(x);
}

/**
 * Helper controller for tools/agents to persist outputs safely
 */
export class StateController {
  constructor(private store: StateStore) {}

  async write<T>(key: StateKey, value: T, updatedBy: string, schemaOverride?: z.ZodTypeAny) {
    return this.store.set<T>(key, value, { updatedBy, schema: schemaOverride });
  }

  async read<T>(key: StateKey) {
    return this.store.get<T>(key);
  }

  async cas<T>(key: StateKey, mutator: (cur: T | undefined) => T, updatedBy: string) {
    const cur = await this.store.get<T>(key);
    const next = mutator(cur?.value);
    return this.store.set<T>(key, next, { expectedEtag: cur?.etag, updatedBy });
  }
}
