import type { TaskContext } from "./types.js";

/**
 * Compensating action for saga pattern
 */
export type CompensatingAction<I = unknown> = (ctx: TaskContext, input: I) => Promise<void>;

/**
 * Saga step with compensation
 */
export interface SagaStep<I = unknown, O = unknown> {
  id: string;
  forward: (ctx: TaskContext, input: I) => Promise<O>;
  compensate?: CompensatingAction<I>;
}

/**
 * Saga execution result
 */
export interface SagaResult<O = unknown> {
  success: boolean;
  output?: O;
  error?: string;
  compensated: string[];
}

/**
 * Saga orchestrator for distributed transactions
 */
export class Saga<I = unknown, O = unknown> {
  private steps: SagaStep<any, any>[] = [];

  constructor(public id: string) {}

  /**
   * Add a step to the saga
   */
  addStep<SI = unknown, SO = unknown>(
    id: string,
    forward: (ctx: TaskContext, input: SI) => Promise<SO>,
    compensate?: CompensatingAction<SI>
  ): this {
    this.steps.push({ id, forward, compensate });
    return this;
  }

  /**
   * Execute the saga
   */
  async execute(ctx: TaskContext, input: I): Promise<SagaResult<O>> {
    const executedSteps: Array<{ step: SagaStep; input: any }> = [];
    let curr: any = input;

    try {
      // Forward execution
      for (const step of this.steps) {
        const stepInput = curr;
        curr = await step.forward(ctx, stepInput);
        executedSteps.push({ step, input: stepInput });
      }

      return {
        success: true,
        output: curr,
        compensated: []
      };

    } catch (error: any) {
      // Backward compensation
      const compensated: string[] = [];

      // Compensate in reverse order
      for (let i = executedSteps.length - 1; i >= 0; i--) {
        const { step, input } = executedSteps[i];

        if (step.compensate) {
          try {
            await step.compensate(ctx, input);
            compensated.push(step.id);
          } catch (compError) {
            // Log compensation failure but continue
            console.error(`Compensation failed for step ${step.id}:`, compError);
          }
        }
      }

      return {
        success: false,
        error: error.message,
        compensated
      };
    }
  }
}

/**
 * Create a new saga
 */
export function createSaga<I = unknown, O = unknown>(id: string): Saga<I, O> {
  return new Saga<I, O>(id);
}
