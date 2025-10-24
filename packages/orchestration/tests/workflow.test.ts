import { describe, it, expect } from "vitest";
import { WorkflowBuilder, createWorkflow } from "../src/Workflow.js";
import type { Task } from "../src/types.js";

describe("Workflow", () => {
  describe("WorkflowBuilder", () => {
    it("should create workflow with given id", () => {
      const builder = new WorkflowBuilder("test-workflow");
      expect(builder).toBeDefined();
    });

    it("should add steps to workflow", () => {
      const builder = new WorkflowBuilder("test-workflow");

      const mockTask: Task<any, any> = {
        id: "task1",
        run: async (input: any) => ({ result: "success" }),
        validate: (input: any) => true
      };

      builder.addStep("step1", mockTask);

      const workflow = builder.build();

      expect(workflow.steps).toHaveLength(1);
      expect(workflow.steps[0].id).toBe("step1");
      expect(workflow.steps[0].task).toBe(mockTask);
      expect(workflow.steps[0].onFail).toBe("ABORT");
      expect(workflow.steps[0].maxAttempts).toBe(3);
    });

    it("should add multiple steps", () => {
      const builder = new WorkflowBuilder("multi-step-workflow");

      const task1: Task<any, any> = {
        id: "task1",
        run: async () => ({ result: "task1" }),
        validate: () => true
      };

      const task2: Task<any, any> = {
        id: "task2",
        run: async () => ({ result: "task2" }),
        validate: () => true
      };

      builder
        .addStep("step1", task1)
        .addStep("step2", task2);

      const workflow = builder.build();

      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].id).toBe("step1");
      expect(workflow.steps[1].id).toBe("step2");
    });

    it("should support custom failure handling", () => {
      const builder = new WorkflowBuilder("failure-workflow");

      const mockTask: Task<any, any> = {
        id: "retry-task",
        run: async () => ({ result: "retry" }),
        validate: () => true
      };

      builder.addStep("retry-step", mockTask, {
        onFail: "RETRY",
        maxAttempts: 5
      });

      const workflow = builder.build();

      expect(workflow.steps[0].onFail).toBe("RETRY");
      expect(workflow.steps[0].maxAttempts).toBe(5);
    });

    it("should support skip on failure", () => {
      const builder = new WorkflowBuilder("skip-workflow");

      const mockTask: Task<any, any> = {
        id: "skip-task",
        run: async () => ({ result: "skip" }),
        validate: () => true
      };

      builder.addStep("skip-step", mockTask, {
        onFail: "SKIP"
      });

      const workflow = builder.build();

      expect(workflow.steps[0].onFail).toBe("SKIP");
      expect(workflow.steps[0].maxAttempts).toBe(3); // default
    });

    it("should build workflow with correct id", () => {
      const builder = new WorkflowBuilder("my-workflow");

      const mockTask: Task<any, any> = {
        id: "task",
        run: async () => ({}),
        validate: () => true
      };

      builder.addStep("step", mockTask);

      const workflow = builder.build();

      expect(workflow.id).toBe("my-workflow");
    });

    it("should throw error when building empty workflow", () => {
      const builder = new WorkflowBuilder("empty-workflow");

      expect(() => builder.build()).toThrow("Workflow must have at least one step");
    });

    it("should return new steps array on each build", () => {
      const builder = new WorkflowBuilder("test-workflow");

      const mockTask: Task<any, any> = {
        id: "task",
        run: async () => ({}),
        validate: () => true
      };

      builder.addStep("step1", mockTask);

      const workflow1 = builder.build();
      const workflow2 = builder.build();

      expect(workflow1.steps).not.toBe(workflow2.steps);
      expect(workflow1.steps).toEqual(workflow2.steps);
    });

    it("should allow building after adding steps", () => {
      const builder = new WorkflowBuilder("build-test");

      const mockTask: Task<any, any> = {
        id: "task",
        run: async () => ({}),
        validate: () => true
      };

      builder.addStep("step1", mockTask);

      // Should not throw
      expect(() => builder.build()).not.toThrow();

      // Can add more steps
      builder.addStep("step2", mockTask);

      const workflow = builder.build();
      expect(workflow.steps).toHaveLength(2);
    });

    it("should handle undefined options", () => {
      const builder = new WorkflowBuilder("undefined-options");

      const mockTask: Task<any, any> = {
        id: "task",
        run: async () => ({}),
        validate: () => true
      };

      builder.addStep("step", mockTask, undefined);

      const workflow = builder.build();

      expect(workflow.steps[0].onFail).toBe("ABORT");
      expect(workflow.steps[0].maxAttempts).toBe(3);
    });
  });

  describe("createWorkflow", () => {
    it("should create a new workflow builder", () => {
      const builder = createWorkflow("created-workflow");

      expect(builder).toBeInstanceOf(WorkflowBuilder);
    });

    it("should support fluent API", () => {
      const mockTask: Task<any, any> = {
        id: "task",
        run: async () => ({}),
        validate: () => true
      };

      const workflow = createWorkflow("fluent-api")
        .addStep("step1", mockTask)
        .addStep("step2", mockTask)
        .build();

      expect(workflow.id).toBe("fluent-api");
      expect(workflow.steps).toHaveLength(2);
    });
  });
});
