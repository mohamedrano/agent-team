import { performance } from "node:perf_hooks";
import type { MessageBus, Handler, SubscribeOptions } from "./MessageBus.js";
import { MessageEnvelopeSchema, type MessageEnvelope } from "../schemas.js";

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

interface PubSubLike {
  topic(name: string): TopicLike;
  subscription(name: string): SubscriptionLike;
}

interface TopicLike {
  name: string;
  publishMessage(message: { data: Buffer; attributes?: Record<string, string> }): Promise<string>;
  exists(): Promise<[boolean]>;
  create(): Promise<[TopicLike]>;
}

interface SubscriptionLike {
  name: string;
  on(event: "message", listener: (message: MessageLike) => void): SubscriptionLike;
  on(event: "error", listener: (error: Error) => void): SubscriptionLike;
  removeListener(event: "message" | "error", listener: (...args: any[]) => void): SubscriptionLike;
  exists(): Promise<[boolean]>;
  create(options?: SubscriptionOptionsLike): Promise<[SubscriptionLike]>;
  close(): Promise<void>;
}

interface MessageLike {
  data: Buffer;
  ack(): void;
  nack(): void;
}

interface SubscriptionOptionsLike {
  deadLetterPolicy?: { deadLetterTopic: string; maxDeliveryAttempts?: number };
  ackDeadlineSeconds?: number;
}

export interface GcpPubSubBusOptions {
  projectId?: string;
  topicPrefix?: string;
  subscriptionPrefix?: string;
  pubsub?: PubSubLike;
  deadLetterTopic?: string;
  ackDeadlineSeconds?: number;
  onTiming?: (event: TimingEvent) => void;
  logger?: LoggerLike;
}

type PubSubModule = typeof import("@google-cloud/pubsub");

type SubscriptionEntry = { handler: Handler; filter?: SubscribeOptions["filter"] };

export class GcpPubSubBus implements MessageBus {
  private pubsub?: PubSubLike;
  private readonly topicPrefix: string;
  private readonly subscriptionPrefix: string;
  private readonly onTiming?: (event: TimingEvent) => void;
  private readonly logger?: LoggerLike;
  private readonly deadLetterTopic?: string;
  private readonly ackDeadlineSeconds?: number;
  private readonly handlers = new Map<string, SubscriptionEntry[]>();
  private readonly subscriptions = new Map<string, SubscriptionLike>();
  private readonly messageListeners = new Map<string, (message: MessageLike) => void>();
  private readonly errorListeners = new Map<string, (error: Error) => void>();

  constructor(private readonly options: GcpPubSubBusOptions = {}) {
    this.topicPrefix = options.topicPrefix ?? "topic-";
    this.subscriptionPrefix = options.subscriptionPrefix ?? "sub-";
    this.onTiming = options.onTiming;
    this.logger = options.logger;
    this.deadLetterTopic = options.deadLetterTopic;
    this.ackDeadlineSeconds = options.ackDeadlineSeconds;
  }

  async publish(msg: MessageEnvelope): Promise<void> {
    const envelope = MessageEnvelopeSchema.parse(msg);
    await this.ensureClient();
    const topicName = this.topicName(envelope.topic ?? "*");
    const topic = this.pubsub!.topic(topicName);
    await this.ensureTopic(topic);
    const started = performance.now();
    await topic.publishMessage({ data: Buffer.from(JSON.stringify(envelope)) });
    this.emitTiming({ phase: "publish", topic: envelope.topic ?? "*", durationMs: performance.now() - started });
  }

  async subscribe(topic: string, handler: Handler, opts?: SubscribeOptions): Promise<() => Promise<void>> {
    await this.ensureClient();
    const key = topic;
    const entries = this.handlers.get(key) ?? [];
    entries.push({ handler, filter: opts?.filter });
    this.handlers.set(key, entries);

    if (!this.subscriptions.has(key)) {
      const subscription = await this.ensureSubscription(key);
      this.subscriptions.set(key, subscription);
      const messageListener = async (message: MessageLike) => {
        try {
          const payload = message.data.toString();
          const parsed = JSON.parse(payload);
          const envelope = MessageEnvelopeSchema.parse(parsed);
          const started = performance.now();
          await Promise.all(
            (this.handlers.get(key) ?? []).map(async ({ handler: h, filter }) => {
              if (filter && !filter(envelope)) {
                return;
              }
              await h(envelope);
            }),
          );
          this.emitTiming({ phase: "consume", topic: key, durationMs: performance.now() - started });
          message.ack();
        } catch (err) {
          this.logger?.error?.(err instanceof Error ? err : { err }, "PubSub handler error");
          message.nack();
        }
      };
      const errorListener = (error: Error) => {
        this.logger?.error?.(error, "PubSub subscription error");
      };
      subscription.on("message", messageListener);
      subscription.on("error", errorListener);
      this.messageListeners.set(key, messageListener);
      this.errorListeners.set(key, errorListener);
    }

    return async () => {
      const list = this.handlers.get(key) ?? [];
      this.handlers.set(key, list.filter((entry) => entry.handler !== handler));
      if (this.handlers.get(key)?.length) {
        return;
      }
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        const messageListener = this.messageListeners.get(key);
        const errorListener = this.errorListeners.get(key);
        if (messageListener) {
          subscription.removeListener("message", messageListener);
          this.messageListeners.delete(key);
        }
        if (errorListener) {
          subscription.removeListener("error", errorListener);
          this.errorListeners.delete(key);
        }
        await subscription.close();
        this.subscriptions.delete(key);
      }
    };
  }

  async close(): Promise<void> {
    const closures = Array.from(this.subscriptions.values()).map((sub) => sub.close().catch((err) => {
      this.logger?.error?.(err instanceof Error ? err : { err }, "Failed to close subscription");
    }));
    await Promise.all(closures);
    this.subscriptions.clear();
    this.messageListeners.clear();
    this.errorListeners.clear();
  }

  private emitTiming(event: TimingEvent) {
    this.onTiming?.(event);
  }

  private topicName(topic: string) {
    return `${this.topicPrefix}${topic}`;
  }

  private subscriptionName(topic: string) {
    return `${this.subscriptionPrefix}${topic}`;
  }

  private async ensureTopic(topic: TopicLike) {
    const [exists] = await topic.exists();
    if (!exists) {
      await topic.create();
    }
  }

  private async ensureSubscription(topic: string): Promise<SubscriptionLike> {
    const topicName = this.topicName(topic);
    const subscriptionName = this.subscriptionName(topic);
    const topicRef = this.pubsub!.topic(topicName);
    await this.ensureTopic(topicRef);
    const subscriptionRef = this.pubsub!.subscription(subscriptionName);
    const [exists] = await subscriptionRef.exists();
    if (!exists) {
      const options: SubscriptionOptionsLike = {};
      if (this.deadLetterTopic) {
        options.deadLetterPolicy = {
          deadLetterTopic: this.deadLetterTopic,
          maxDeliveryAttempts: 10,
        };
      }
      if (this.ackDeadlineSeconds) {
        options.ackDeadlineSeconds = this.ackDeadlineSeconds;
      }
      await subscriptionRef.create(options);
    }
    return subscriptionRef;
  }

  private async ensureClient() {
    if (!this.pubsub) {
      this.pubsub = this.options.pubsub ?? (await this.createClient());
    }
  }

  private async createClient(): Promise<PubSubLike> {
    const mod = (await import("@google-cloud/pubsub")) as PubSubModule;
    const projectId = this.options.projectId ?? process.env.GCP_PROJECT_ID;
    if (!projectId) {
      throw new Error("GCP_PROJECT_ID is required to instantiate GcpPubSubBus");
    }
    return new mod.PubSub({ projectId });
  }
}
