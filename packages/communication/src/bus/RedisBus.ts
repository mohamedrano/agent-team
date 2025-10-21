import { performance } from "node:perf_hooks";
import type { MessageBus, Handler, SubscribeOptions } from "./MessageBus.js";
import { MessageEnvelopeSchema, type MessageEnvelope } from "../schemas.js";

const CHANNEL_PREFIX = "topic::";

interface TimingEvent {
  phase: "publish" | "consume";
  topic: string;
  durationMs: number;
}

interface LoggerLike {
  debug?(obj: Record<string, unknown>, msg?: string): void;
  error?(obj: Record<string, unknown> | Error, msg?: string): void;
  warn?(obj: Record<string, unknown>, msg?: string): void;
}

type RedisLike = {
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<number>;
  unsubscribe(channel: string): Promise<number>;
  psubscribe(pattern: string): Promise<number>;
  punsubscribe(pattern: string): Promise<number>;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  quit(): Promise<void>;
  disconnect(): void;
};

export interface RedisBusOptions {
  url?: string;
  publisher?: RedisLike;
  subscriber?: RedisLike;
  channelPrefix?: string;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onTiming?: (event: TimingEvent) => void;
  logger?: LoggerLike;
}

type SubscriptionEntry = { handler: Handler; filter?: SubscribeOptions["filter"] };

type RedisConstructor = {
  new (url: string, options?: any): RedisLike;
  new (options?: any): RedisLike;
};
type RedisModule = { default: RedisConstructor };

export class RedisBus implements MessageBus {
  private publisher?: RedisLike;
  private subscriber?: RedisLike;
  private readonly handlers = new Map<string, SubscriptionEntry[]>();
  private readonly prefix: string;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly onTiming?: (event: TimingEvent) => void;
  private readonly logger?: LoggerLike;

  constructor(private readonly options: RedisBusOptions = {}) {
    this.prefix = options.channelPrefix ?? CHANNEL_PREFIX;
    this.baseDelay = options.baseDelayMs ?? 100;
    this.maxDelay = options.maxDelayMs ?? 5_000;
    this.onTiming = options.onTiming;
    this.logger = options.logger;
  }

  async publish(msg: MessageEnvelope): Promise<void> {
    const envelope = MessageEnvelopeSchema.parse(msg) as MessageEnvelope;
    await this.ensureClients();
    const channel = this.channel(envelope.topic ?? "*");
    const payload = JSON.stringify(envelope);
    const started = performance.now();
    await this.publisher!.publish(channel, payload);
    this.emitTiming({ phase: "publish", topic: envelope.topic ?? "*", durationMs: performance.now() - started });
  }

  async subscribe(topic: string, handler: Handler, opts?: SubscribeOptions): Promise<() => Promise<void>> {
    await this.ensureClients();
    const key = topic;
    const list = this.handlers.get(key) ?? [];
    list.push({ handler, filter: opts?.filter });
    this.handlers.set(key, list);

    if (list.length === 1) {
      if (key === "*") {
        await this.subscriber!.psubscribe(this.channel("*"));
      } else {
        await this.subscriber!.subscribe(this.channel(key));
      }
    }

    return async () => {
      const arr = this.handlers.get(key) ?? [];
      this.handlers.set(key, arr.filter((entry) => entry.handler !== handler));
      if (this.handlers.get(key)?.length) {
        return;
      }
      if (key === "*") {
        await this.subscriber!.punsubscribe(this.channel("*"));
      } else {
        await this.subscriber!.unsubscribe(this.channel(key));
      }
    };
  }

  async close(): Promise<void> {
    this.handlers.clear();
    if (this.publisher) {
      await this.publisher.quit().catch(() => this.publisher?.disconnect());
    }
    if (this.subscriber) {
      this.subscriber.off("message", this.handleMessage);
      this.subscriber.off("pmessage", this.handlePatternMessage);
      await this.subscriber.quit().catch(() => this.subscriber?.disconnect());
    }
  }

  private channel(topic: string) {
    return `${this.prefix}${topic}`;
  }

  private emitTiming(event: TimingEvent) {
    this.onTiming?.(event);
  }

  private readonly handleMessage = async (channel: string, payload: string) => {
    const topic = channel.replace(this.prefix, "");
    await this.dispatch(topic, payload);
  };

  private readonly handlePatternMessage = async (
    _pattern: string,
    channel: string,
    payload: string,
  ) => {
    const topic = channel.replace(this.prefix, "");
    await this.dispatch(topic, payload);
  };

  private async dispatch(topic: string, payload: string) {
    const entries = [
      ...(this.handlers.get(topic) ?? []),
      ...(this.handlers.get("*") ?? []),
    ];
    if (!entries.length) {
      return;
    }
    try {
      const parsed = JSON.parse(payload);
      const envelope = MessageEnvelopeSchema.parse(parsed) as MessageEnvelope;
      const started = performance.now();
      await Promise.all(
        entries.map(async ({ handler, filter }) => {
          if (filter && !filter(envelope)) {
            return;
          }
          await handler(envelope);
        }),
      );
      this.emitTiming({ phase: "consume", topic, durationMs: performance.now() - started });
    } catch (err) {
      this.logger?.error?.(err instanceof Error ? err : { err }, "Failed to dispatch Redis message");
    }
  }

  private async ensureClients() {
    if (this.publisher && this.subscriber) {
      return;
    }
    const redis = await this.loadRedis();
    if (!this.publisher) {
      this.publisher = this.options.publisher ?? this.createClient(redis);
    }
    if (!this.subscriber) {
      this.subscriber = this.options.subscriber ?? this.createClient(redis);
      this.subscriber.on("message", this.handleMessage);
      this.subscriber.on("pmessage", this.handlePatternMessage);
    }
  }

  private createClient(redis: RedisModule) {
    const retryStrategy = (times: number) => {
      const delay = Math.min(this.maxDelay, this.baseDelay * 2 ** times);
      return delay;
    };
    const RedisClass = redis.default;
    const client = this.options.url
      ? new RedisClass(this.options.url, {
          lazyConnect: false,
          maxRetriesPerRequest: null,
          retryStrategy,
        })
      : new RedisClass({
          lazyConnect: false,
          maxRetriesPerRequest: null,
          retryStrategy,
        });
    return client as unknown as RedisLike;
  }

  private async loadRedis(): Promise<RedisModule> {
    if (this.options.publisher || this.options.subscriber) {
      return await import("ioredis") as RedisModule;
    }
    const url = this.options.url ?? process.env.REDIS_URL;
    if (!url) {
      throw new Error("REDIS_URL is required to instantiate RedisBus");
    }
    return (await import("ioredis")) as RedisModule;
  }
}
