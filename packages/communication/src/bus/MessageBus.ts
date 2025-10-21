import type { MessageEnvelope } from "../schemas.js";
export type Handler = (msg: MessageEnvelope) => Promise<void> | void;

export interface SubscribeOptions {
  filter?: (msg: MessageEnvelope) => boolean;
  concurrent?: number; // handlers parallelism
}

export interface MessageBus {
  publish(msg: MessageEnvelope): Promise<void>;
  subscribe(topic: string, handler: Handler, opts?: SubscribeOptions): Promise<() => Promise<void>>;
  close(): Promise<void>;
}
