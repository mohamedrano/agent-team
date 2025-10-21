import type { Task, TaskContext } from "./types.js";

/**
 * Simple task implementation
 */
export class SimpleTask<I = unknown, O = unknown> implements Task<I, O> {
  constructor(
    public id: string,
    private handler: (ctx: TaskContext, input: I) => Promise<O>
  ) {}

  async run(ctx: TaskContext, input: I): Promise<O> {
    return this.handler(ctx, input);
  }
}

/**
 * Create a simple task
 */
export function createTask<I = unknown, O = unknown>(
  id: string,
  handler: (ctx: TaskContext, input: I) => Promise<O>
): Task<I, O> {
  return new SimpleTask(id, handler);
}
