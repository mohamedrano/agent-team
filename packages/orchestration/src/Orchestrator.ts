import type { WorkflowPlan, TaskContext, WorkflowResult } from "./types.js";
import { calculateDelay, sleep } from "./policies/retry.js";
import { withTimeout, DEFAULT_TIMEOUT_POLICY, type TimeoutPolicy } from "./policies/timeouts.js";

export interface OrchestratorOptions {
  emit: (event: any) => Promise<void>;
  now: () => number;
  timeoutPolicy?: TimeoutPolicy;
}

export class Orchestrator {
  private timeoutPolicy: TimeoutPolicy;

  constructor(private opts: OrchestratorOptions) {
    this.timeoutPolicy = opts.timeoutPolicy ?? DEFAULT_TIMEOUT_POLICY;
  }

  async run(plan: WorkflowPlan, ctx: TaskContext, input: unknown): Promise<WorkflowResult> {
    const completedSteps: string[] = [];
    let curr = input;
    let failedStep: string | undefined;
    let errorMessage: string | undefined;

    try {
      await this.opts.emit({
        type: "workflow_started",
        planId: plan.id,
        runId: ctx.runId,
        timestamp: this.opts.now()
      });

      for (const step of plan.steps) {
        let attempt = 0;
        const maxAttempts = step.maxAttempts ?? 3;

        // Retry loop for each step
        while (true) {
          try {
            await this.opts.emit({
              type: "step_started",
              planId: plan.id,
              stepId: step.id,
              attempt,
              timestamp: this.opts.now()
            });

            // Execute task with timeout
            curr = await withTimeout(
              step.task.run(ctx, curr),
              this.timeoutPolicy.taskTimeout,
              `Task ${step.id} timed out after ${this.timeoutPolicy.taskTimeout}ms`
            );

            await this.opts.emit({
              type: "step_completed",
              planId: plan.id,
              stepId: step.id,
              attempt,
              timestamp: this.opts.now()
            });

            completedSteps.push(step.id);
            break; // Success, exit retry loop

          } catch (e: any) {
            const error = e as Error;

            await this.opts.emit({
              type: "step_failed",
              planId: plan.id,
              stepId: step.id,
              attempt,
              error: error.message,
              timestamp: this.opts.now()
            });

            // Determine failure strategy
            if (step.onFail === "SKIP") {
              await this.opts.emit({
                type: "step_skipped",
                planId: plan.id,
                stepId: step.id,
                reason: error.message,
                timestamp: this.opts.now()
              });
              break; // Skip to next step
            }

            if (step.onFail !== "RETRY" || attempt >= maxAttempts - 1) {
              // Abort workflow
              failedStep = step.id;
              errorMessage = error.message;
              throw error;
            }

            // Retry with exponential backoff
            attempt++;
            const delay = calculateDelay(attempt);
            await this.opts.emit({
              type: "step_retrying",
              planId: plan.id,
              stepId: step.id,
              attempt,
              delayMs: delay,
              timestamp: this.opts.now()
            });

            await sleep(delay);
          }
        }
      }

      await this.opts.emit({
        type: "workflow_completed",
        planId: plan.id,
        runId: ctx.runId,
        status: "SUCCESS",
        timestamp: this.opts.now()
      });

      return {
        planId: plan.id,
        status: "SUCCESS",
        output: curr,
        completedSteps
      };

    } catch (error: any) {
      await this.opts.emit({
        type: "workflow_failed",
        planId: plan.id,
        runId: ctx.runId,
        error: error.message,
        timestamp: this.opts.now()
      });

      return {
        planId: plan.id,
        status: "FAILED",
        error: errorMessage ?? error.message,
        completedSteps,
        failedStep
      };
    }
  }

  /**
   * Run workflow with overall timeout
   */
  async runWithTimeout(
    plan: WorkflowPlan,
    ctx: TaskContext,
    input: unknown
  ): Promise<WorkflowResult> {
    return withTimeout(
      this.run(plan, ctx, input),
      this.timeoutPolicy.workflowTimeout,
      `Workflow ${plan.id} timed out after ${this.timeoutPolicy.workflowTimeout}ms`
    );
  }
}
