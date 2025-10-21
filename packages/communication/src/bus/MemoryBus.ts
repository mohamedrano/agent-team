import type { MessageBus, Handler, SubscribeOptions } from "./MessageBus.js";
import { MessageEnvelopeSchema, type MessageEnvelope } from "../schemas.js";

export class MemoryBus implements MessageBus {
  private subs = new Map<string, Array<{h: Handler; f?: (m: MessageEnvelope)=>boolean}>>();
  async publish(msg: MessageEnvelope): Promise<void> {
    const envelope = MessageEnvelopeSchema.parse(msg) as MessageEnvelope;
    const topic = envelope.topic ?? "*";
    const targets = [
      ...(this.subs.get(topic) ?? []),
      ...(this.subs.get("*") ?? []),
    ];
    await Promise.all(targets.map(({h,f}) => (f && !f(envelope)) ? undefined : Promise.resolve(h(envelope))));
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
