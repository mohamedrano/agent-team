import { describe, it, expect, vi } from "vitest";
import { SimpleTask, createTask } from "../src/Task.js";
import type { TaskContext } from "../src/types.js";

describe("Task", () => {
  describe("SimpleTask", () => {
    it("should create task with id and handler", () => {
      const handler = vi.fn().mockResolvedValue("result");
      const task = new SimpleTask("test-task", handler);

      expect(task.id).toBe("test-task");
    });

    it("should execute handler with context and input", async () => {
      const handler = vi.fn().mockResolvedValue("processed-result");
      const task = new SimpleTask("test-task", handler);

      const context: TaskContext = {
        workflowId: "wf-123",
        stepId: "step-1",
        attempt: 1,
        timeout: 30000
      };

      const input = { data: "test-input" };
      const result = await task.run(context, input);

      expect(result).toBe("processed-result");
      expect(handler).toHaveBeenCalledWith(context, input);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle different input and output types", async () => {
      interface CustomInput {
        value: number;
        name: string;
      }

      interface CustomOutput {
        result: string;
        processed: boolean;
      }

      const handler = vi.fn().mockImplementation(async (ctx: TaskContext, input: CustomInput): Promise<CustomOutput> => {
        return {
          result: `${input.name}-${input.value}`,
          processed: true
        };
      });

      const task = new SimpleTask<CustomInput, CustomOutput>("typed-task", handler);

      const context: TaskContext = {
        workflowId: "wf-456",
        stepId: "step-2",
        attempt: 1,
        timeout: 60000
      };

      const input: CustomInput = { value: 42, name: "test" };
      const result = await task.run(context, input);

      expect(result).toEqual({
        result: "test-42",
        processed: true
      });
    });

    it("should propagate handler errors", async () => {
      const error = new Error("Task failed");
      const handler = vi.fn().mockRejectedValue(error);
      const task = new SimpleTask("failing-task", handler);

      const context: TaskContext = {
        workflowId: "wf-error",
        stepId: "step-error",
        attempt: 1,
        timeout: 10000
      };

      await expect(task.run(context, {})).rejects.toThrow("Task failed");
      expect(handler).toHaveBeenCalledWith(context, {});
    });

    it("should support async handlers", async () => {
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return "async-result";
      });

      const task = new SimpleTask("async-task", handler);

      const context: TaskContext = {
        workflowId: "wf-async",
        stepId: "step-async",
        attempt: 1,
        timeout: 5000
      };

      const result = await task.run(context, null);
      expect(result).toBe("async-result");
    });

    it("should handle undefined input", async () => {
      const handler = vi.fn().mockResolvedValue("handled-undefined");
      const task = new SimpleTask("undefined-input-task", handler);

      const context: TaskContext = {
        workflowId: "wf-undefined",
        stepId: "step-undefined",
        attempt: 1,
        timeout: 10000
      };

      const result = await task.run(context, undefined);
      expect(result).toBe("handled-undefined");
      expect(handler).toHaveBeenCalledWith(context, undefined);
    });
  });

  describe("createTask", () => {
    it("should create a SimpleTask instance", () => {
      const handler = vi.fn().mockResolvedValue("result");
      const task = createTask("created-task", handler);

      expect(task).toBeInstanceOf(SimpleTask);
      expect(task.id).toBe("created-task");
    });

    it("should create executable task", async () => {
      const handler = vi.fn().mockResolvedValue("created-result");
      const task = createTask("created-executable", handler);

      const context: TaskContext = {
        workflowId: "wf-created",
        stepId: "step-created",
        attempt: 1,
        timeout: 20000
      };

      const result = await task.run(context, "input");
      expect(result).toBe("created-result");
    });

    it("should support generic types through createTask", () => {
      const handler = vi.fn().mockResolvedValue({ output: "typed" });
      const task = createTask<{ input: string }, { output: string }>("typed-created", handler);

      expect(task.id).toBe("typed-created");
    });
  });
});
