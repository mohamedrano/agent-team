#!/usr/bin/env tsx

/**
 * AI Demo - Test AI integration with orchestration
 */

import { CommAdapter } from "@agent-team/orchestration";
import { handleTask, handleToolCall } from "./agents/ai.js";
import type { MessageEnvelope } from "@agent-team/communication";

async function demo() {
  console.log("🤖 Starting AI Demo...\n");

  // Initialize communication adapter
  const adapter = new CommAdapter();
  await adapter.start();

  console.log("✅ Communication adapter started\n");

  // Subscribe to AI result topic
  const results: any[] = [];
  adapter.subscribe("ai::result", async (msg) => {
    results.push(msg.payload);
    console.log("📨 Received result:", JSON.stringify(msg.payload, null, 2));
  });

  // Demo 1: Generate text
  console.log("Demo 1: Text Generation");
  console.log("=" .repeat(50));

  const generateTask: MessageEnvelope = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    type: "TASK",
    qos: "at-least-once",
    topic: "ai::task",
    from: "demo",
    payload: {
      kind: "generate",
      prompt: "What is 2+2? Answer with just the number and a brief explanation.",
      temperature: 0.2
    }
  };

  const result1 = await handleTask(generateTask);
  await adapter.publish("ai::result", result1, "ai-agent");

  await new Promise(resolve => setTimeout(resolve, 100));

  // Demo 2: Tool calling
  console.log("\nDemo 2: Tool Calling - Echo");
  console.log("=".repeat(50));

  const toolCallMsg: MessageEnvelope = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    type: "TOOL_CALL",
    qos: "at-least-once",
    topic: "ai::tool",
    from: "demo",
    payload: {
      name: "echo",
      args: { message: "Hello from AI tool!" }
    }
  };

  const result2 = await handleToolCall(toolCallMsg);
  await adapter.publish("ai::result", result2, "ai-agent");

  await new Promise(resolve => setTimeout(resolve, 100));

  // Demo 3: Calculate tool
  console.log("\nDemo 3: Tool Calling - Calculate");
  console.log("=".repeat(50));

  const calcToolMsg: MessageEnvelope = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    type: "TOOL_CALL",
    qos: "at-least-once",
    topic: "ai::tool",
    from: "demo",
    payload: {
      name: "calculate",
      args: { expression: "10 * 5 + 3" }
    }
  };

  const result3 = await handleToolCall(calcToolMsg);
  await adapter.publish("ai::result", result3, "ai-agent");

  await new Promise(resolve => setTimeout(resolve, 100));

  // Demo 4: Classification (if API key available)
  if (process.env.GEMINI_API_KEY) {
    console.log("\nDemo 4: Text Classification");
    console.log("=".repeat(50));

    const classifyTask: MessageEnvelope = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: "TASK",
      qos: "at-least-once",
      topic: "ai::task",
      from: "demo",
      payload: {
        kind: "classify",
        text: "Fix the bug in the login function"
      }
    };

    const result4 = await handleTask(classifyTask);
    await adapter.publish("ai::result", result4, "ai-agent");

    await new Promise(resolve => setTimeout(resolve, 100));
  } else {
    console.log("\n⚠️  Skipping LLM demos - GEMINI_API_KEY not set");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Demo Summary:");
  console.log("=".repeat(50));
  console.log(`Total results received: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  // Cleanup
  await adapter.stop();
  console.log("\n✅ Demo completed successfully!");
}

// Run demo
demo().catch((error) => {
  console.error("❌ Demo failed:", error);
  process.exit(1);
});
