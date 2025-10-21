import { generate, type GenReq, type GenRes } from "../clients/gemini.js";
import { pickModel, getFallbackModel } from "../router/ModelRouter.js";

export interface InvokeContext {
  taskType: string;
  costHint?: "low" | "med" | "high";
  speedHint?: "low" | "med" | "high";
  complexityHint?: "low" | "med" | "high";
}

export interface InvokeOptions {
  input: string;
  system?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

/**
 * Invoke LLM with automatic model selection and fallback
 */
export async function invokeLLM(
  ctx: InvokeContext,
  options: InvokeOptions
): Promise<GenRes & { modelUsed: string; attempts: number }> {
  const model = pickModel({
    taskType: ctx.taskType,
    costHint: ctx.costHint,
    speedHint: ctx.speedHint,
    complexityHint: ctx.complexityHint
  });

  const maxRetries = options.maxRetries ?? 2;
  let currentModel = model;
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      attempts++;

      const req: GenReq = {
        model: currentModel,
        input: options.input,
        system: options.system,
        json: options.json,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      };

      const result = await generate(req);

      return {
        ...result,
        modelUsed: currentModel,
        attempts
      };

    } catch (error: any) {
      // Try fallback model on error
      const fallback = getFallbackModel(currentModel);

      if (fallback && attempts < maxRetries) {
        console.warn(`Model ${currentModel} failed, trying fallback ${fallback}`);
        currentModel = fallback;
      } else {
        throw new Error(
          `LLM invocation failed after ${attempts} attempts: ${error.message}`
        );
      }
    }
  }

  throw new Error("model_fallback_unavailable");
}

/**
 * Batch invoke multiple LLM requests
 */
export async function batchInvoke(
  requests: Array<{ ctx: InvokeContext; options: InvokeOptions }>
): Promise<Array<GenRes & { modelUsed: string; attempts: number }>> {
  return Promise.all(
    requests.map(({ ctx, options }) => invokeLLM(ctx, options))
  );
}
