import {
  MemoryBus,
  Router,
  MemoryIdemStore,
  DebateCoordinator,
  newId,
  nowMs,
  type MessageEnvelope,
} from "@agent-team/communication";

async function main() {
  const bus = new MemoryBus();
  const router = new Router(bus, {
    idempotency: { store: new MemoryIdemStore(), ttlSeconds: 3_600 },
  });

  router.registerAgent("researcher", async (msg) => {
    console.log("[researcher] analyzing", msg.payload);
    await bus.publish({
      ...createEnvelope("TOOL_CALL", "researcher", "architect"),
      payload: { action: "summarize findings", input: msg.payload },
    });
  });

  router.registerAgent("architect", async (msg) => {
    console.log("[architect] received", msg.payload);
  });

  await router.start();

  const task: MessageEnvelope = {
    ...createEnvelope("TASK", "team_leader", "researcher"),
    payload: { brief: "Evaluate messaging approaches" },
  };

  await bus.publish(task);

  const debate = new DebateCoordinator();
  debate.collectProposal({
    id: "p1",
    text: "Adopt modular monolith with async work queues",
    confidence: 0.8,
    cost: 0.3,
    risk: 0.3,
    evidence: 0.85,
  });
  debate.collectProposal({
    id: "p2",
    text: "Go full microservices",
    confidence: 0.6,
    cost: 0.6,
    risk: 0.5,
    evidence: 0.7,
  });
  debate.collectCritique("p2", "Operational burden is high for MVP");
  debate.collectCritique("p1", "Requires clear module contracts");

  const outcome = debate.decide();
  console.log("Debate outcome:", outcome.winner?.text);
  outcome.ranked.forEach(({ p, s }) => {
    console.log(` - ${p.id}: score=${s.toFixed(2)} (${p.text})`);
  });

  await router.stop();
  await bus.close();
}

function createEnvelope(
  type: MessageEnvelope["type"],
  from: string,
  to: string,
): MessageEnvelope {
  return {
    id: newId(),
    ts: nowMs(),
    type,
    qos: "at-least-once",
    from,
    to,
    payload: {},
  };
}

main().catch((err) => {
  console.error("Communication demo failed", err);
});
