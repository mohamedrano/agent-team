import { describe, it, expect, vi } from "vitest";
import { Orchestrator } from "../src/Orchestrator.js";
import { createWorkflow } from "../src/Workflow.js";
import { createTask } from "../src/Task.js";
import type { TaskContext } from "../src/types.js";

describe("Orchestrator - Basic Functionality", () => {
  it("should execute a simple workflow successfully", async () => {
    const events: any[] = [];
    const emit = vi.fn(async (event: any) => {
      events.push(event);
    });

    const orchestrator = new Orchestrator({
      emit,
      now: () => Date.now()
    });

    const task1 = createTask("task1", async (ctx: TaskContext, input: number) => {
      return input + 1;
    });

    const task2 = createTask("task2", async (ctx: TaskContext, input: number) => {
      return input * 2;
    });

    const workflow = createWorkflow("test-workflow")
      .addStep("step1", task1)
      .addStep("step2", task2)
      .build();

    const ctx: TaskContext = {
      runId: "run-1",
      traceId: "trace-1",
      vars: {}
    };

    const result = await orchestrator.run(workflow, ctx, 5);

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(12); // (5 + 1) * 2
    expect(result.completedSteps).toEqual(["step1", "step2"]);
    expect(events.some(e => e.type === "workflow_started")).toBe(true);
    expect(events.some(e => e.type === "workflow_completed")).toBe(true);
  });

  it("should handle workflow failure", async () => {
    const events: any[] = [];
    const emit = vi.fn(async (event: any) => {
      events.push(event);
    });

    const orchestrator = new Orchestrator({
      emit,
      now: () => Date.now()
    });

    const task1 = createTask("task1", async (ctx: TaskContext, input: number) => {
      return input + 1;
    });

    const task2 = createTask("task2", async () => {
      throw new Error("Task failed");
    });

    const workflow = createWorkflow("test-workflow")
      .addStep("step1", task1)
      .addStep("step2", task2, { onFail: "ABORT" })
      .build();

    const ctx: TaskContext = {
      runId: "run-1",
      traceId: "trace-1",
      vars: {}
    };

    const result = await orchestrator.run(workflow, ctx, 5);

    expect(result.status).toBe("FAILED");
    expect(result.error).toBe("Task failed");
    expect(result.completedSteps).toEqual(["step1"]);
    expect(result.failedStep).toBe("step2");
  });

  it("should skip failed steps when configured", async () => {
    const events: any[] = [];
    const emit = vi.fn(async (event: any) => {
      events.push(event);
    });

    const orchestrator = new Orchestrator({
      emit,
      now: () => Date.now()
    });

    const task1 = createTask("task1", async (ctx: TaskContext, input: number) => {
      return input + 1;
    });

    const task2 = createTask("task2", async () => {
      throw new Error("Task failed");
    });

    const task3 = createTask("task3", async (ctx: TaskContext, input: number) => {
      return input * 3;
    });

    const workflow = createWorkflow("test-workflow")
      .addStep("step1", task1)
      .addStep("step2", task2, { onFail: "SKIP" })
      .addStep("step3", task3)
      .build();

    const ctx: TaskContext = {
      runId: "run-1",
      traceId: "trace-1",
      vars: {}
    };

    const result = await orchestrator.run(workflow, ctx, 5);

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(18); // (5 + 1) * 3
    expect(result.completedSteps).toEqual(["step1", "step3"]);
  });
});
