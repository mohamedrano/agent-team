import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { MemoryBus, Router } from "@agent-team/communication";
import { CommAdapter } from "@agent-team/orchestration";
import { Orchestrator } from "@agent-team/orchestration";
import type { WorkflowPlan, TaskContext } from "@agent-team/orchestration";
import type { MessageEnvelope } from "@agent-team/communication";

/**
 * End-to-End Integration Test
 * Tests the full flow: Orchestration → Communication → AI
 */
describe("E2E: Orchestration ↔ AI ↔ Communication", () => {
  let commAdapter: CommAdapter;
  let orchestrator: Orchestrator;
  let receivedResults: any[] = [];

  beforeAll(async () => {
    // Initialize communication adapter
    commAdapter = new CommAdapter();
    await commAdapter.start();

    // Initialize orchestrator
    const events: any[] = [];
    orchestrator = new Orchestrator({
      emit: async (event) => {
        events.push(event);
      },
      now: () => Date.now(),
    });

    // Set up result consumer
    commAdapter.subscribe("ai::result", async (msg: MessageEnvelope) => {
      receivedResults.push(msg.payload);
    });
  });

  afterAll(async () => {
    await commAdapter.stop();
  });

  it("should complete full orchestration → AI workflow within 2s", async () => {
    const startTime = Date.now();
    
    // Mock AI generation response
    const mockAIGenerate = vi.fn(async (input: any) => {
      return {
        output: `Generated response for: ${input.prompt}`,
        model: "gemini-2.5-pro",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        }
      };
    });

    // Create workflow plan that sends task to AI
    const plan: WorkflowPlan = {
      id: "e2e-workflow",
      steps: [
        {
          id: "prepare-task",
          task: {
            run: async (_ctx, input: any) => {
              return {
                kind: "generate",
                prompt: input.prompt,
                model: "gemini-2.5-pro"
              };
            }
          },
          maxAttempts: 1,
          onFail: "ABORT"
        },
        {
          id: "send-to-ai",
          task: {
            run: async (_ctx, input: any) => {
              // Publish task to AI topic
              await commAdapter.publish("ai::task", input, "orchestrator");
              
              // Mock AI processing and response
              const aiResult = await mockAIGenerate(input);
              
              // Publish result
              await commAdapter.publish("ai::result", {
                taskId: "e2e-task-1",
                result: aiResult,
                metadata: {
                  executionTime: Date.now() - startTime,
                  modelSelected: "gemini-2.5-pro",
                  timestamp: Date.now()
                }
              }, "ai-agent");
              
              return aiResult;
            }
          },
          maxAttempts: 1,
          onFail: "ABORT"
        }
      ]
    };

    const ctx: TaskContext = {
      runId: "e2e-run-1",
      agentId: "orchestrator",
      metadata: {}
    };

    // Execute workflow
    const result = await orchestrator.run(plan, ctx, {
      prompt: "Generate a test response"
    });

    const executionTime = Date.now() - startTime;

    // Assertions
    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBeDefined();
    expect(result.output.output).toContain("Generated response for");
    expect(result.output.model).toBe("gemini-2.5-pro");
    
    // Verify execution time is within 2 seconds
    expect(executionTime).toBeLessThan(2000);

    // Wait for message to be delivered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify result was received on ai::result topic
    expect(receivedResults).toHaveLength(1);
    expect(receivedResults[0].taskId).toBe("e2e-task-1");
    expect(receivedResults[0].metadata.modelSelected).toBe("gemini-2.5-pro");
    expect(receivedResults[0].metadata.executionTime).toBeLessThan(2000);
  });

  it("should handle AI generation with metadata tracking", async () => {
    const startTime = Date.now();
    const taskMetadata = {
      requestId: "req-123",
      priority: "high",
      source: "user-request"
    };

    const mockAIProcess = vi.fn(async (task: any) => {
      return {
        output: `Processed: ${task.input}`,
        model: task.model || "gemini-2.5-pro",
        metadata: {
          ...task.metadata,
          processingTime: 50,
          tokensUsed: 100
        }
      };
    });

    const plan: WorkflowPlan = {
      id: "metadata-tracking-workflow",
      steps: [
        {
          id: "ai-task-with-metadata",
          task: {
            run: async (_ctx, input: any) => {
              const task = {
                input: input.text,
                model: "gemini-2.5-pro",
                metadata: taskMetadata
              };

              const result = await mockAIProcess(task);

              await commAdapter.publish("ai::result", {
                taskId: input.taskId,
                result,
                executionTime: Date.now() - startTime,
                modelSelection: {
                  selected: result.model,
                  reason: "default",
                  alternatives: ["gemini-1.5-pro", "gemini-1.5-flash"]
                }
              }, "ai-agent");

              return result;
            }
          },
          maxAttempts: 1,
          onFail: "ABORT"
        }
      ]
    };

    const ctx: TaskContext = {
      runId: "metadata-run",
      agentId: "orchestrator",
      metadata: taskMetadata
    };

    const result = await orchestrator.run(plan, ctx, {
      taskId: "task-meta-1",
      text: "Test input"
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.output.metadata.requestId).toBe("req-123");
    expect(result.output.metadata.priority).toBe("high");
  });

  it("should handle task failure and retry through communication layer", async () => {
    let attemptCount = 0;

    const plan: WorkflowPlan = {
      id: "retry-workflow",
      steps: [
        {
          id: "flaky-ai-task",
          task: {
            run: async (_ctx, input: any) => {
              attemptCount++;
              
              if (attemptCount < 2) {
                throw new Error("AI service temporarily unavailable");
              }

              await commAdapter.publish("ai::result", {
                taskId: input.taskId,
                result: { output: "Success after retry", model: "gemini-2.5-pro" }
              }, "ai-agent");

              return { output: "Success after retry" };
            }
          },
          maxAttempts: 3,
          onFail: "RETRY"
        }
      ]
    };

    const ctx: TaskContext = {
      runId: "retry-run",
      agentId: "orchestrator",
      metadata: {}
    };

    const result = await orchestrator.run(plan, ctx, {
      taskId: "retry-task-1"
    });

    expect(result.status).toBe("SUCCESS");
    expect(attemptCount).toBe(2);
  });

  it("should verify message bus integrity during workflow", async () => {
    const messages: MessageEnvelope[] = [];

    // Subscribe to all topics
    commAdapter.subscribe("test::integrity", async (msg) => {
      messages.push(msg);
    });

    // Send multiple messages
    await commAdapter.publish("test::integrity", { seq: 1 }, "sender");
    await commAdapter.publish("test::integrity", { seq: 2 }, "sender");
    await commAdapter.publish("test::integrity", { seq: 3 }, "sender");

    // Wait for messages to be delivered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify all messages received
    expect(messages).toHaveLength(3);
    expect(messages[0].payload.seq).toBe(1);
    expect(messages[1].payload.seq).toBe(2);
    expect(messages[2].payload.seq).toBe(3);

    // Verify message structure
    messages.forEach(msg => {
      expect(msg.id).toBeDefined();
      expect(msg.ts).toBeDefined();
      expect(msg.type).toBeDefined();
      expect(msg.topic).toBe("test::integrity");
      expect(msg.from).toBe("sender");
    });
  });

  it("should complete complex multi-step AI workflow", async () => {
    const startTime = Date.now();
    const workflowId = "complex-workflow-1";

    const plan: WorkflowPlan = {
      id: workflowId,
      steps: [
        {
          id: "step-1-analyze",
          task: {
            run: async (_ctx, input: any) => {
              return {
                analysis: `Analyzed: ${input.text}`,
                nextAction: "generate"
              };
            }
          },
          maxAttempts: 1,
          onFail: "ABORT"
        },
        {
          id: "step-2-generate",
          task: {
            run: async (_ctx, input: any) => {
              await commAdapter.publish("ai::task", {
                kind: "generate",
                context: input.analysis
              }, "orchestrator");

              return {
                ...input,
                generated: "AI generated content",
                model: "gemini-2.5-pro"
              };
            }
          },
          maxAttempts: 1,
          onFail: "ABORT"
        },
        {
          id: "step-3-validate",
          task: {
            run: async (_ctx, input: any) => {
              const result = {
                ...input,
                validated: true,
                executionTime: Date.now() - startTime
              };

              await commAdapter.publish("ai::result", {
                workflowId,
                result,
                metadata: {
                  modelSelected: "gemini-2.5-pro",
                  timestamp: Date.now()
                }
              }, "orchestrator");

              return result;
            }
          },
          maxAttempts: 1,
          onFail: "ABORT"
        }
      ]
    };

    const ctx: TaskContext = {
      runId: "complex-run-1",
      agentId: "orchestrator",
      metadata: { workflowType: "complex" }
    };

    const result = await orchestrator.run(plan, ctx, {
      text: "Complex input requiring multi-step processing"
    });

    const totalTime = Date.now() - startTime;

    expect(result.status).toBe("SUCCESS");
    expect(result.completedSteps).toHaveLength(3);
    expect(result.output.validated).toBe(true);
    expect(result.output.model).toBe("gemini-2.5-pro");
    expect(totalTime).toBeLessThan(2000);
  });
});
