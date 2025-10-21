import { describe, it, expect, vi } from "vitest";
import { createSaga } from "../src/Saga.js";
import type { TaskContext } from "../src/types.js";

describe("Saga Pattern", () => {
  it("should execute saga successfully", async () => {
    const saga = createSaga("test-saga");

    saga.addStep(
      "step1",
      async (ctx: TaskContext, input: number) => input + 1
    );

    saga.addStep(
      "step2",
      async (ctx: TaskContext, input: number) => input * 2
    );

    const ctx: TaskContext = {
      runId: "run-1",
      traceId: "trace-1",
      vars: {}
    };

    const result = await saga.execute(ctx, 5);

    expect(result.success).toBe(true);
    expect(result.output).toBe(12); // (5 + 1) * 2
    expect(result.compensated).toEqual([]);
  });

  it("should compensate on failure", async () => {
    const compensations: string[] = [];

    const saga = createSaga("test-saga");

    saga.addStep(
      "step1",
      async (ctx: TaskContext, input: number) => input + 1,
      async (ctx: TaskContext, input: number) => {
        compensations.push("step1-compensated");
      }
    );

    saga.addStep(
      "step2",
      async () => {
        throw new Error("Step 2 failed");
      },
      async () => {
        compensations.push("step2-compensated");
      }
    );

    const ctx: TaskContext = {
      runId: "run-1",
      traceId: "trace-1",
      vars: {}
    };

    const result = await saga.execute(ctx, 5);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Step 2 failed");
    expect(result.compensated).toEqual(["step1"]);
    expect(compensations).toContain("step1-compensated");
  });

  it("should handle multiple compensations", async () => {
    const compensations: string[] = [];

    const saga = createSaga("test-saga");

    saga.addStep(
      "step1",
      async (ctx: TaskContext, input: number) => input + 1,
      async () => {
        compensations.push("step1");
      }
    );

    saga.addStep(
      "step2",
      async (ctx: TaskContext, input: number) => input * 2,
      async () => {
        compensations.push("step2");
      }
    );

    saga.addStep(
      "step3",
      async () => {
        throw new Error("Step 3 failed");
      },
      async () => {
        compensations.push("step3");
      }
    );

    const ctx: TaskContext = {
      runId: "run-1",
      traceId: "trace-1",
      vars: {}
    };

    const result = await saga.execute(ctx, 5);

    expect(result.success).toBe(false);
    expect(result.compensated).toEqual(["step2", "step1"]);
    expect(compensations).toEqual(["step2", "step1"]);
  });
});
