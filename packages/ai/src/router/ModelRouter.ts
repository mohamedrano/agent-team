import { AI } from "../env.js";

/**
 * Routing context for model selection
 */
export type RouteCtx = {
  taskType: string;
  costHint?: "low" | "med" | "high";
  speedHint?: "low" | "med" | "high";
  complexityHint?: "low" | "med" | "high";
};

/**
 * Model configuration
 */
export interface ModelConfig {
  name: string;
  cost: "low" | "med" | "high";
  speed: "low" | "med" | "high";
  capabilities: string[];
}

/**
 * Available models registry
 */
export const MODELS: Record<string, ModelConfig> = {
  "gemini-2.0-flash-exp": {
    name: "gemini-2.0-flash-exp",
    cost: "low",
    speed: "high",
    capabilities: ["text", "code", "reasoning"]
  },
  "gemini-1.5-pro": {
    name: "gemini-1.5-pro",
    cost: "med",
    speed: "med",
    capabilities: ["text", "code", "reasoning", "long-context"]
  },
  "gemini-1.5-flash": {
    name: "gemini-1.5-flash",
    cost: "low",
    speed: "high",
    capabilities: ["text", "code"]
  }
};

/**
 * Pick the best model based on routing context
 */
export function pickModel(ctx: RouteCtx): string {
  // Simple routing logic
  // Complex tasks → Pro model
  if (ctx.complexityHint === "high" || ctx.taskType.includes("complex")) {
    return "gemini-1.5-pro";
  }

  // Cost-sensitive tasks → Flash model
  if (ctx.costHint === "low") {
    return "gemini-1.5-flash";
  }

  // Speed-critical tasks → Flash model
  if (ctx.speedHint === "high") {
    return "gemini-2.0-flash-exp";
  }

  // Default to configured model
  return AI.MODEL;
}

/**
 * Get fallback model for a given model
 */
export function getFallbackModel(currentModel: string): string | null {
  const fallbacks: Record<string, string> = {
    "gemini-1.5-pro": "gemini-1.5-flash",
    "gemini-1.5-flash": "gemini-2.0-flash-exp",
    "gemini-2.0-flash-exp": "gemini-1.5-flash"
  };

  return fallbacks[currentModel] ?? null;
}

/**
 * Estimate cost for a model (relative scale)
 */
export function estimateCost(model: string, tokens: number): number {
  const config = MODELS[model];
  if (!config) return 0;

  const costMultiplier = {
    low: 1,
    med: 3,
    high: 10
  }[config.cost];

  // Very simplified cost estimation
  return (tokens / 1000) * costMultiplier;
}
