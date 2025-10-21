/* eslint-disable no-undef */
import { describe, it, expect, vi } from "vitest";
import { Saga } from "../src/Saga.js";
import type { TaskContext } from "../src/types.js";

describe("Saga - Compensation Order", () => {
  it("should execute all steps successfully without compensation", async () => {
    const executionLog: string[] = [];

    const saga = new Saga("test-saga");

    saga
      .addStep(
        "step-1",
        async (_ctx, input: string) => {
          executionLog.push("step-1-forward");
          return `${input}-1`;
        },
        async () => {
          executionLog.push("step-1-compensate");
        }
      )
      .addStep(
        "step-2",
        async (_ctx, input: string) => {
          executionLog.push("step-2-forward");
          return `${input}-2`;
        },
        async () => {
          executionLog.push("step-2-compensate");
        }
      )
      .addStep(
        "step-3",
        async (_ctx, input: string) => {
          executionLog.push("step-3-forward");
          return `${input}-3`;
        },
        async () => {
          executionLog.push("step-3-compensate");
        }
      );

    const ctx: TaskContext = {
      runId: "saga-1",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await saga.execute(ctx, "input");

    expect(result.success).toBe(true);
    expect(result.output).toBe("input-1-2-3");
    expect(result.compensated).toHaveLength(0);
    expect(executionLog).toEqual([
      "step-1-forward",
      "step-2-forward",
      "step-3-forward",
    ]);
  });

  it("should compensate in reverse order when step 3 fails", async () => {
    const executionLog: string[] = [];

    const saga = new Saga("compensation-saga");

    saga
      .addStep(
        "step-1",
        async (_ctx, input: string) => {
          executionLog.push("step-1-forward");
          return `${input}-1`;
        },
        async () => {
          executionLog.push("step-1-compensate");
        }
      )
      .addStep(
        "step-2",
        async (_ctx, input: string) => {
          executionLog.push("step-2-forward");
          return `${input}-2`;
        },
        async () => {
          executionLog.push("step-2-compensate");
        }
      )
      .addStep(
        "step-3",
        async () => {
          executionLog.push("step-3-forward");
          throw new Error("Step 3 failed");
        },
        async () => {
          executionLog.push("step-3-compensate");
        }
      );

    const ctx: TaskContext = {
      runId: "saga-2",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await saga.execute(ctx, "input");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Step 3 failed");
    expect(result.compensated).toEqual(["step-2", "step-1"]);
    expect(executionLog).toEqual([
      "step-1-forward",
      "step-2-forward",
      "step-3-forward",
      "step-2-compensate",
      "step-1-compensate",
    ]);
  });

  it("should compensate in reverse order when step 2 fails", async () => {
    const executionLog: string[] = [];

    const saga = new Saga("compensation-saga-2");

    saga
      .addStep(
        "step-1",
        async (_ctx, input: string) => {
          executionLog.push("step-1-forward");
          return `${input}-1`;
        },
        async () => {
          executionLog.push("step-1-compensate");
        }
      )
      .addStep(
        "step-2",
        async () => {
          executionLog.push("step-2-forward");
          throw new Error("Step 2 failed");
        },
        async () => {
          executionLog.push("step-2-compensate");
        }
      )
      .addStep(
        "step-3",
        async (_ctx, input: string) => {
          executionLog.push("step-3-forward");
          return `${input}-3`;
        },
        async () => {
          executionLog.push("step-3-compensate");
        }
      );

    const ctx: TaskContext = {
      runId: "saga-3",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await saga.execute(ctx, "input");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Step 2 failed");
    expect(result.compensated).toEqual(["step-1"]);
    expect(executionLog).toEqual([
      "step-1-forward",
      "step-2-forward",
      "step-1-compensate",
    ]);
  });

  it("should handle steps without compensation", async () => {
    const executionLog: string[] = [];

    const saga = new Saga("partial-compensation");

    saga
      .addStep(
        "step-1",
        async (_ctx, input: string) => {
          executionLog.push("step-1-forward");
          return `${input}-1`;
        }
        // No compensation for step 1
      )
      .addStep(
        "step-2",
        async (_ctx, input: string) => {
          executionLog.push("step-2-forward");
          return `${input}-2`;
        },
        async () => {
          executionLog.push("step-2-compensate");
        }
      )
      .addStep(
        "step-3",
        async () => {
          executionLog.push("step-3-forward");
          throw new Error("Step 3 failed");
        }
      );

    const ctx: TaskContext = {
      runId: "saga-4",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await saga.execute(ctx, "input");

    expect(result.success).toBe(false);
    expect(result.compensated).toEqual(["step-2"]);
    expect(executionLog).toEqual([
      "step-1-forward",
      "step-2-forward",
      "step-3-forward",
      "step-2-compensate",
    ]);
  });

  it("should continue compensation even if one compensation fails", async () => {
    const executionLog: string[] = [];
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const saga = new Saga("compensation-failure");

    saga
      .addStep(
        "step-1",
        async (_ctx, input: string) => {
          executionLog.push("step-1-forward");
          return `${input}-1`;
        },
        async () => {
          executionLog.push("step-1-compensate");
        }
      )
      .addStep(
        "step-2",
        async (_ctx, input: string) => {
          executionLog.push("step-2-forward");
          return `${input}-2`;
        },
        async () => {
          executionLog.push("step-2-compensate-attempt");
          throw new Error("Compensation failed");
        }
      )
      .addStep(
        "step-3",
        async () => {
          executionLog.push("step-3-forward");
          throw new Error("Step 3 failed");
        }
      );

    const ctx: TaskContext = {
      runId: "saga-5",
      agentId: "agent-1",
      metadata: {},
    };

    const result = await saga.execute(ctx, "input");

    expect(result.success).toBe(false);
    expect(result.compensated).toEqual(["step-1"]);
    expect(executionLog).toEqual([
      "step-1-forward",
      "step-2-forward",
      "step-3-forward",
      "step-2-compensate-attempt",
      "step-1-compensate",
    ]);

    consoleErrorSpy.mockRestore();
  });
});
