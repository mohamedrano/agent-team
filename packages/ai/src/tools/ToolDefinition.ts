import { z } from "zod";

/**
 * Tool definition with Zod schemas
 */
export interface ToolDef<I = unknown, O = unknown> {
  name: string;
  desc: string;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  run: (args: I) => Promise<O>;
}

/**
 * Create a tool definition
 */
export function defineTool<I, O>(
  name: string,
  desc: string,
  input: z.ZodType<I>,
  output: z.ZodType<O>,
  run: (args: I) => Promise<O>
): ToolDef<I, O> {
  return { name, desc, input, output, run };
}
