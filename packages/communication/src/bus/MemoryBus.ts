import type { MessageBus, Handler, SubscribeOptions } from "./MessageBus.js";
import { MessageEnvelopeSchema, type MessageEnvelope } from "../schemas.js";

export class MemoryBus implements MessageBus {
  private subs = new Map<string, Array<{h: Handler; f?: (m: MessageEnvelope)=>boolean}>>();
  async publish(msg: MessageEnvelope): Promise<void> {
    const envelope = MessageEnvelopeSchema.parse(msg) as MessageEnvelope;
    const topic = envelope.topic ?? "*";
    const entries = [
      ...(this.subs.get(topic) ?? []),
      ...(topic === "*" ? [] : this.subs.get("*") ?? []),
    ];

    const seen = new Set<Handler>();
    const tasks: Promise<void>[] = [];
    for (const { h, f } of entries) {
      if (f && !f(envelope)) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      tasks.push(Promise.resolve(h(envelope)));
    }

    await Promise.all(tasks);
  }
  async subscribe(topic: string, handler: Handler, opts?: SubscribeOptions) {
    const list = this.subs.get(topic) ?? [];
    list.push({ h: handler, f: opts?.filter });
    this.subs.set(topic, list);
    return async () => {
      const arr = this.subs.get(topic) ?? [];
      this.subs.set(topic, arr.filter(x => x.h !== handler));
    };
  }
  async close(): Promise<void> { this.subs.clear(); }
}
