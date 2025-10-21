import {
  MemoryBus,
  RedisBus,
  GcpPubSubBus,
  MemoryIdemStore,
  RedisIdemStore,
  Router,
  type RouterOptions,
  type MessageBus,
  type MessageEnvelope,
  sign,
} from "@agent-team/communication";
import type { KeyProvider } from "@agent-team/communication";

type Teardown = () => Promise<void>;

class EnvKeyProvider implements KeyProvider {
  private readonly keys = new Map<string, string>();
  constructor(private activeId: string, activeSecret: string) {
    this.keys.set(activeId, activeSecret);
  }
  getActiveKey() {
    const secret = this.keys.get(this.activeId);
    if (!secret) {
      throw new Error("Active HMAC key is not configured");
    }
    return { id: this.activeId, secret };
  }
  getById(id: string) {
    const secret = this.keys.get(id);
    return secret ? { id, secret } : null;
  }
}

export interface CommunicationLayer {
  bus: MessageBus;
  router: Router;
  signMessage<P>(msg: MessageEnvelope<P>): MessageEnvelope<P>;
  shutdown(): Promise<void>;
}

export async function createCommunicationLayer(): Promise<CommunicationLayer> {
  const provider = (process.env.AGENT_BUS_PROVIDER ?? "memory").toLowerCase();
  const ttl = Number.parseInt(process.env.COMM_IDEMPOTENCY_TTL_SEC ?? "86400", 10);
  const teardowns: Teardown[] = [];

  let bus: MessageBus;
  let store = new MemoryIdemStore();

  if (provider === "redis" && process.env.REDIS_URL) {
    try {
      bus = new RedisBus({ url: process.env.REDIS_URL });
      const redisModule = await import("ioredis");
      const redis = new redisModule.default(process.env.REDIS_URL);
      store = new RedisIdemStore(redis as any);
      teardowns.push(async () => {
        await redis.quit().catch(() => redis.disconnect());
      });
    } catch (err) {
      console.warn("Redis bus initialization failed, falling back to memory", err);
      bus = new MemoryBus();
    }
  } else if (provider === "pubsub" && process.env.GCP_PROJECT_ID) {
    try {
      bus = new GcpPubSubBus({ projectId: process.env.GCP_PROJECT_ID });
    } catch (err) {
      console.warn("GCP Pub/Sub initialization failed, falling back to memory", err);
      bus = new MemoryBus();
    }
  } else {
    bus = new MemoryBus();
  }

  const signingSecret = process.env.COMM_HMAC_DEFAULT_SECRET;
  const activeKeyId = process.env.COMM_HMAC_ACTIVE_KEY_ID ?? "default";
  const keyProvider = signingSecret ? new EnvKeyProvider(activeKeyId, signingSecret) : null;

  const routerOptions: RouterOptions = {
    idempotency: {
      store,
      ttlSeconds: Number.isFinite(ttl) ? Math.max(1, ttl) : 86400,
    },
  };

  if (keyProvider) {
    routerOptions.signing = {
      provider: keyProvider,
      required: false,
    };
  }

  const router = new Router(bus, routerOptions);
  await router.start();

  const signMessage = <P,>(message: MessageEnvelope<P>): MessageEnvelope<P> => {
    if (!keyProvider) {
      return message;
    }
    const key = keyProvider.getActiveKey();
    const meta = { ...(message.meta ?? {}), keyId: key.id };
    const toSign = { ...message, meta } as MessageEnvelope<P> & { sig?: string };
    const signature = sign(toSign, key.secret);
    return { ...toSign, sig: signature };
  };

  const shutdown = async () => {
    await router.stop();
    await bus.close();
    for (const fn of teardowns) {
      await fn();
    }
  };

  return { bus, router, signMessage, shutdown };
}
