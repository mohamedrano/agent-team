/**
 * AI Environment Configuration
 */
export const AI = {
  GEMINI_KEY: process.env.GEMINI_API_KEY ?? "",
  MODEL: process.env.AI_MODEL_DEFAULT ?? "gemini-2.0-flash-exp",
  TEMP: Number(process.env.AI_TEMPERATURE ?? 0.2),
  MAX_TOKENS: Number(process.env.AI_MAX_TOKENS ?? 4096),
  QPS: Number(process.env.AI_RATE_QPS ?? 3),
  SAFETY_LEVEL: process.env.AI_SAFETY_LEVEL ?? "standard",
  ROUTER_RULES: process.env.AI_ROUTER_RULES ?? "default"
};
