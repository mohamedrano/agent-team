/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest";
import { Orchestrator } from "../src/Orchestrator.js";
import type { WorkflowPlan, TaskContext } from "../src/types.js";

describe("Orchestrator - Retry & Timeout", () => {
  it("should retry and eventually succeed", async () => {
    const events: any[] = [];
    let attemptCount = 0;

    const orchestrator = new Orchestrator({
      emit: async (event) => { events.push(event); },
      now: () => Date.now(),
    });

    const plan: WorkflowPlan = {
      id: "retry-success",
      steps: [
        {
          id: "flaky-task",
          task: {
            run: async (_ctx, input) => {
              attemptCount++;
              if (attemptCount < 3) {
                throw new Error("Temporary failure");
              }
              return `success-${input}`;
            },
          },
          maxAttempts: 5,
          onFail: "RETRY",
        },
      ],
    };

    const ctx: TaskContext = {
      runId: "run-1",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await orchestrator.run(plan, ctx, "input");

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe("success-input");
    expect(attemptCount).toBe(3);
    expect(events.filter(e => e.type === "step_retrying")).toHaveLength(2);
  });

  it("should fail after exhausting max attempts", async () => {
    const events: any[] = [];
    let attemptCount = 0;

    const orchestrator = new Orchestrator({
      emit: async (event) => { events.push(event); },
      now: () => Date.now(),
    });

    const plan: WorkflowPlan = {
      id: "retry-exhaust",
      steps: [
        {
          id: "always-fails",
          task: {
            run: async () => {
              attemptCount++;
              throw new Error("Persistent failure");
            },
          },
          maxAttempts: 3,
          onFail: "RETRY",
        },
      ],
    };

    const ctx: TaskContext = {
      runId: "run-2",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await orchestrator.run(plan, ctx, "input");

    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("Persistent failure");
    expect(attemptCount).toBe(3);
    expect(result.failedStep).toBe("always-fails");
  });

  it("should timeout a long-running task", async () => {
    const events: any[] = [];

    const orchestrator = new Orchestrator({
      emit: async (event) => { events.push(event); },
      now: () => Date.now(),
      timeoutPolicy: { taskTimeout: 100, workflowTimeout: 5000 },
    });

    const plan: WorkflowPlan = {
      id: "timeout-test",
      steps: [
        {
          id: "slow-task",
          task: {
            run: async () => {
              await new Promise(resolve => setTimeout(resolve, 500));
              return "should-not-complete";
            },
          },
          maxAttempts: 1,
          onFail: "ABORT",
        },
      ],
    };

    const ctx: TaskContext = {
      runId: "run-3",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await orchestrator.run(plan, ctx, "input");

    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("timed out");
  });

  it("should skip a failed step with SKIP policy", async () => {
    const events: any[] = [];

    const orchestrator = new Orchestrator({
      emit: async (event) => { events.push(event); },
      now: () => Date.now(),
    });

    const plan: WorkflowPlan = {
      id: "skip-test",
      steps: [
        {
          id: "step-1",
          task: { run: async (_ctx, input) => `${input}-1` },
          maxAttempts: 1,
          onFail: "ABORT",
        },
        {
          id: "step-2-fails",
          task: {
            run: async () => {
              throw new Error("Expected failure");
            },
          },
          maxAttempts: 1,
          onFail: "SKIP",
        },
        {
          id: "step-3",
          task: { run: async (_ctx, input) => `${input}-3` },
          maxAttempts: 1,
          onFail: "ABORT",
        },
      ],
    };

    const ctx: TaskContext = {
      runId: "run-4",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await orchestrator.run(plan, ctx, "input");

    expect(result.status).toBe("SUCCESS");
    expect(result.completedSteps).toContain("step-1");
    expect(result.completedSteps).toContain("step-3");
    expect(events.filter(e => e.type === "step_skipped")).toHaveLength(1);
  });

  it("should timeout entire workflow", async () => {
    const events: any[] = [];

    const orchestrator = new Orchestrator({
      emit: async (event) => { events.push(event); },
      now: () => Date.now(),
      timeoutPolicy: { taskTimeout: 5000, workflowTimeout: 150 },
    });

    const plan: WorkflowPlan = {
      id: "workflow-timeout",
      steps: [
        {
          id: "step-1",
          task: {
            run: async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
              return "ok";
            },
          },
          maxAttempts: 1,
          onFail: "ABORT",
        },
        {
          id: "step-2",
          task: {
            run: async () => {
              await new Promise(resolve => setTimeout(resolve, 200));
              return "should-not-complete";
            },
          },
          maxAttempts: 1,
          onFail: "ABORT",
        },
      ],
    };

    const ctx: TaskContext = {
      runId: "run-5",
      agentId: "agent-1",
      metadata: {},
    };

    await expect(
      orchestrator.runWithTimeout(plan, ctx, "input")
    ).rejects.toThrow("timed out");
  });
});
