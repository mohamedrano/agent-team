import type { WorkflowPlan, Step, Task } from "./types.js";

/**
 * Workflow builder for creating workflow plans
 */
export class WorkflowBuilder {
  private steps: Step[] = [];

  constructor(private id: string) {}

  /**
   * Add a step to the workflow
   */
  addStep(
    id: string,
    task: Task<any, any>,
    options?: {
      onFail?: "RETRY" | "SKIP" | "ABORT";
      maxAttempts?: number;
    }
  ): this {
    this.steps.push({
      id,
      task,
      onFail: options?.onFail ?? "ABORT",
      maxAttempts: options?.maxAttempts ?? 3
    });
    return this;
  }

  /**
   * Build the workflow plan
   */
  build(): WorkflowPlan {
    if (this.steps.length === 0) {
      throw new Error("Workflow must have at least one step");
    }

    return {
      id: this.id,
      steps: [...this.steps]
    };
  }
}

/**
 * Create a new workflow builder
 */
export function createWorkflow(id: string): WorkflowBuilder {
  return new WorkflowBuilder(id);
}
