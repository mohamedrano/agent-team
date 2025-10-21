import type { MessageBus } from "../bus/MessageBus.js";
import { MessageEnvelopeSchema, type MessageEnvelope } from "../schemas.js";
import type { IdempotencyStore } from "../idempotency/Store.js";
import type { KeyProvider } from "../security/keys.js";
import { verify as verifySignature } from "../security/signing.js";
import { expoBackoff } from "./policies/backoff.js";
import { CircuitBreaker } from "./policies/circuitBreaker.js";

type AgentHandler = (msg: MessageEnvelope) => Promise<void>;

export class Router {
  private registry = new Map<string, AgentHandler>();
  private cb = new CircuitBreaker();
  private unsubscribe?: () => Promise<void>;
  private maxAttempts: number;
  constructor(private bus: MessageBus, private options: RouterOptions = {}) {
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 6);
  }

  registerAgent(id: string, handler: AgentHandler) { this.registry.set(id, handler); }

  async start() {
    this.unsubscribe = await this.bus.subscribe("*", (msg) => this.dispatch(msg));
  }

  async stop() {
    if (this.unsubscribe) {
      await this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private async dispatch(raw: MessageEnvelope) {
    const parsed = MessageEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return;
    }
    const msg = parsed.data as MessageEnvelope;

    const { idempotency, signing } = this.options;
    if (signing) {
      const sig = msg.sig;
      if (!sig) {
        if (signing.required) {
          return;
        }
      } else {
        const keyIdField = signing.keyIdMetaKey ?? "keyId";
        const keyIdValue =
          typeof msg.meta?.[keyIdField] === "string"
            ? (msg.meta?.[keyIdField] as string)
            : signing.provider.getActiveKey().id;
        const key =
          signing.provider.getById(keyIdValue) ??
          (keyIdValue === signing.provider.getActiveKey().id
            ? signing.provider.getActiveKey()
            : null);
        if (!key) {
          return;
        }
        const signedEnvelope = msg as MessageEnvelope & { sig: string };
        if (!verifySignature(signedEnvelope, key.secret)) {
          return;
        }
      }
    }

    if (idempotency && msg.qos !== "at-most-once") {
      const ttl = Math.max(1, idempotency.ttlSeconds ?? 86_400);
      const alreadySeen = await idempotency.store.seen(msg.id);
      if (alreadySeen) {
        return;
      }
      await idempotency.store.mark(msg.id, ttl);
    }

    const targets = Array.isArray(msg.to) ? msg.to : (msg.to ? [msg.to] : []);
    const list = targets.length ? targets : [msg.topic ?? "*"];
    for (const t of list) {
      const h = this.registry.get(t);
      if (!h) continue;
      let attempt = 0;
      while (attempt < this.maxAttempts) {
        if (this.cb.isOpen) break;
        try { await h(msg); this.cb.markSuccess(); break; }
        catch {
          this.cb.markFailure();
          await new Promise(r => setTimeout(r, expoBackoff(attempt++)));
        }
      }
    }
  }
}

export interface RouterOptions {
  idempotency?: {
    store: IdempotencyStore;
    ttlSeconds?: number;
  };
  maxAttempts?: number;
  signing?: {
    provider: KeyProvider;
    required?: boolean;
    keyIdMetaKey?: string;
  };
}
