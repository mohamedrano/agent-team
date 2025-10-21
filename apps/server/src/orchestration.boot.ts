/**
 * Orchestration Bootstrap
 * Initialize orchestration layer with communication adapter
 */

import { CommAdapter, Orchestrator } from "@agent-team/orchestration";

let adapter: CommAdapter | null = null;
let orchestrator: Orchestrator | null = null;

export async function bootstrap(): Promise<{
  adapter: CommAdapter;
  orchestrator: Orchestrator;
}> {
  console.log("🚀 Bootstrapping orchestration layer...");

  // Initialize communication adapter
  adapter = new CommAdapter();
  await adapter.start();

  console.log("✅ Communication adapter started");

  // Initialize orchestrator
  orchestrator = new Orchestrator({
    emit: async (event: any) => {
      // Emit orchestration events to communication bus
      await adapter!.publish("orchestration::decision", event, "orchestrator");
      
      // Log events for debugging
      if (process.env.DEBUG === "true") {
        console.log(`[ORCH] ${event.type}:`, event);
      }
    },
    now: () => Date.now()
  });

  console.log("✅ Orchestrator initialized");

  // Subscribe to orchestration topics
  adapter.subscribe("orchestration::request", async (msg) => {
    console.log("[ORCH] Received request:", msg.payload);
  });

  console.log("✅ Orchestration layer ready");

  return { adapter, orchestrator };
}

export async function shutdown(): Promise<void> {
  if (adapter) {
    await adapter.stop();
    console.log("✅ Communication adapter stopped");
  }
}

export function getAdapter(): CommAdapter | null {
  return adapter;
}

export function getOrchestrator(): Orchestrator | null {
  return orchestrator;
}
