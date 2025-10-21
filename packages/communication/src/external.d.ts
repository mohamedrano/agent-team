declare module "ioredis" {
  export interface RedisOptions {
    retryStrategy?: (times: number) => number | null;
    lazyConnect?: boolean;
    maxRetriesPerRequest?: number;
  }
  export default class Redis {
    constructor(url?: string, options?: RedisOptions);
    constructor(options?: RedisOptions);
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string): Promise<number>;
    unsubscribe(channel: string): Promise<number>;
    psubscribe(pattern: string): Promise<number>;
    punsubscribe(pattern: string): Promise<number>;
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    quit(): Promise<void>;
    disconnect(): void;
    set(key: string, value: string, mode: string, ttl: number, flag: string): Promise<string | null>;
    exists(key: string): Promise<number>;
  }
}

declare module "@google-cloud/pubsub" {
  export interface PublishOptions {
    orderingKey?: string;
  }
  export interface SubscriptionOptions {
    deadLetterPolicy?: { deadLetterTopic: string; maxDeliveryAttempts?: number };
    ackDeadlineSeconds?: number;
  }
  export interface Message {
    data: Buffer;
    ack(): void;
    nack(): void;
  }
  export class Topic {
    name: string;
    publishMessage(message: { data: Buffer; attributes?: Record<string, string> }): Promise<string>;
    exists(): Promise<[boolean]>;
    create(): Promise<[Topic]>;
  }
  export class Subscription {
    name: string;
    on(event: "message", listener: (message: Message) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    removeListener(event: "message" | "error", listener: (...args: any[]) => void): this;
    exists(): Promise<[boolean]>;
    create(options?: SubscriptionOptions): Promise<[Subscription]>;
    close(): Promise<void>;
  }
  export class PubSub {
    constructor(options?: { projectId?: string });
    topic(name: string): Topic;
    subscription(name: string): Subscription;
  }
}
