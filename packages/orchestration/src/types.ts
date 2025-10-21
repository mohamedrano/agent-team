export type TaskStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED" | "CANCELLED";

export interface TaskContext {
  runId: string;
  traceId: string;
  vars: Record<string, unknown>;
}

export interface Task<I = unknown, O = unknown> {
  id: string;
  run(ctx: TaskContext, input: I): Promise<O>;
}

export interface Step {
  id: string;
  task: Task<any, any>;
  onFail?: "RETRY" | "SKIP" | "ABORT";
  maxAttempts?: number;
}

export interface WorkflowPlan {
  id: string;
  steps: Step[];
}

export interface WorkflowResult {
  planId: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  output?: unknown;
  error?: string;
  completedSteps: string[];
  failedStep?: string;
}
