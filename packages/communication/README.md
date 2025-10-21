# @agent-team/communication

Unified communication primitives for the Agent Team platform. The package bundles
message envelope validation, message buses, routing, idempotency guards,
cryptographic signing, and a lightweight debate coordinator so that agents can
exchange work safely across memory, Redis, or Google Pub/Sub transports.

## Features

- **Typed envelopes** powered by [`zod`](https://zod.dev) for runtime validation
  and strong TypeScript types.
- **Pluggable transports** with a shared `MessageBus` interface. Memory is the
  default, Redis and Google Pub/Sub are available when their environments are
  configured.
- **Router with reliability controls** including exponential backoff retries,
  QoS-aware idempotency, and a circuit breaker to prevent cascading failures.
- **Optional HMAC signing** using environment-provided keys to authenticate
  envelopes between agents.
- **Debate coordinator** that aggregates proposals, critiques, and deterministic
  scoring for collaborative decision making.

## Installation

```bash
pnpm add @agent-team/communication
```

Inside the monorepo the package is available through the workspace, so you can
import it from any app:

```ts
import { MemoryBus, Router, MemoryIdemStore } from "@agent-team/communication";
```

## Quick Start

```ts
import {
  MemoryBus,
  Router,
  MemoryIdemStore,
  newId,
  nowMs,
  type MessageEnvelope,
} from "@agent-team/communication";

async function bootstrap() {
  const bus = new MemoryBus();
  const router = new Router(bus, {
    idempotency: { store: new MemoryIdemStore(), ttlSeconds: 86_400 },
  });

  router.registerAgent("architect", async (msg) => {
    console.log("Architect received", msg.payload);
  });

  await router.start();

  const envelope: MessageEnvelope = {
    id: newId(),
    ts: nowMs(),
    type: "TASK",
    qos: "at-least-once",
    from: "team_lead",
    to: "architect",
    payload: { objective: "Design async messaging layer" },
  };

  await bus.publish(envelope);
}
```

## Debate Messaging Examples

### Architectural Style Deliberation

```ts
const debateStream = [
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_PROPOSAL",
    qos: "at-least-once",
    topic: "architecture",
    from: "architect_amira",
    payload: { proposal: "Event-driven microservices" },
  },
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_CRITIQUE",
    qos: "at-least-once",
    topic: "architecture",
    from: "devops_engineer",
    payload: { critique: "Operational overhead is high" },
  },
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_PROPOSAL",
    qos: "at-least-once",
    topic: "architecture",
    from: "architect_amira",
    payload: { proposal: "Modular monolith with async boundaries" },
  },
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_DECISION",
    qos: "exactly-once",
    topic: "architecture",
    from: "team_leader_awsa",
    payload: { winner: "Modular monolith" },
  },
];
```

### Technology Selection

```ts
const techChoice = [
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_PROPOSAL",
    qos: "at-least-once",
    topic: "data-store",
    from: "data_analyst_samra",
    payload: { option: "PostgreSQL", evidence: "Strong OLTP + analytics" },
  },
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_CRITIQUE",
    qos: "at-least-once",
    topic: "data-store",
    from: "performance_engineer",
    payload: { concern: "Need read replicas to meet latency" },
  },
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_PROPOSAL",
    qos: "at-least-once",
    topic: "data-store",
    from: "architect_amira",
    payload: { option: "CockroachDB", evidence: "Built-in geo-replication" },
  },
  {
    id: newId(),
    ts: nowMs(),
    type: "DEBATE_DECISION",
    qos: "exactly-once",
    topic: "data-store",
    from: "team_leader_awsa",
    payload: { winner: "PostgreSQL with replicas" },
  },
];
```

## Environment Variables

- `AGENT_BUS_PROVIDER`: `memory` (default), `redis`, or `pubsub`.
- `COMM_IDEMPOTENCY_TTL_SEC`: retention window for deduplication keys.
- `COMM_HMAC_DEFAULT_SECRET` / `COMM_HMAC_ACTIVE_KEY_ID`: enable HMAC signing.
- `REDIS_URL`: Redis connection string when using the Redis transport.
- `GCP_PROJECT_ID`: Google Cloud project for Pub/Sub.

Refer to [`examples/comm-demo.ts`](../../examples/comm-demo.ts) for an
end-to-end demonstration that wires the bus, router, signing, and debate
coordinator together.
