import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AI } from "../src/env.js";

describe("AI Environment Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear AI-related environment variables
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_MODEL_DEFAULT;
    delete process.env.AI_TEMPERATURE;
    delete process.env.AI_MAX_TOKENS;
    delete process.env.AI_RATE_QPS;
    delete process.env.AI_SAFETY_LEVEL;
    delete process.env.AI_ROUTER_RULES;
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  it("should use default values when no environment variables are set", () => {
    expect(AI.GEMINI_KEY).toBe("");
    expect(AI.MODEL).toBe("gemini-2.0-flash-exp");
    expect(AI.TEMP).toBe(0.2);
    expect(AI.MAX_TOKENS).toBe(4096);
    expect(AI.QPS).toBe(3);
    expect(AI.SAFETY_LEVEL).toBe("standard");
    expect(AI.ROUTER_RULES).toBe("default");
  });

  it("should read GEMINI_API_KEY from environment", () => {
    process.env.GEMINI_API_KEY = "test-api-key-123";

    // Re-import to get updated values
    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.GEMINI_KEY).toBe("test-api-key-123");
  });

  it("should read AI_MODEL_DEFAULT from environment", () => {
    process.env.AI_MODEL_DEFAULT = "custom-model-v2";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.MODEL).toBe("custom-model-v2");
  });

  it("should parse AI_TEMPERATURE as number", () => {
    process.env.AI_TEMPERATURE = "0.7";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.TEMP).toBe(0.7);
  });

  it("should handle invalid AI_TEMPERATURE gracefully", () => {
    process.env.AI_TEMPERATURE = "invalid";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.TEMP).toBe(NaN);
  });

  it("should parse AI_MAX_TOKENS as number", () => {
    process.env.AI_MAX_TOKENS = "8192";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.MAX_TOKENS).toBe(8192);
  });

  it("should parse AI_RATE_QPS as number", () => {
    process.env.AI_RATE_QPS = "10";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.QPS).toBe(10);
  });

  it("should read AI_SAFETY_LEVEL from environment", () => {
    process.env.AI_SAFETY_LEVEL = "strict";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.SAFETY_LEVEL).toBe("strict");
  });

  it("should read AI_ROUTER_RULES from environment", () => {
    process.env.AI_ROUTER_RULES = "advanced";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.ROUTER_RULES).toBe("advanced");
  });

  it("should handle empty string environment variables", () => {
    process.env.GEMINI_API_KEY = "";
    process.env.AI_MODEL_DEFAULT = "";
    process.env.AI_SAFETY_LEVEL = "";
    process.env.AI_ROUTER_RULES = "";

    delete require.cache[require.resolve("../src/env.js")];
    const { AI: AIUpdated } = require("../src/env.js");

    expect(AIUpdated.GEMINI_KEY).toBe("");
    expect(AIUpdated.MODEL).toBe("");
    expect(AIUpdated.SAFETY_LEVEL).toBe("");
    expect(AIUpdated.ROUTER_RULES).toBe("");
  });

  it("should handle undefined environment variables", () => {
    // Environment variables are already cleared in beforeEach
    expect(AI.GEMINI_KEY).toBe("");
    expect(AI.MODEL).toBe("gemini-2.0-flash-exp");
    expect(AI.SAFETY_LEVEL).toBe("standard");
    expect(AI.ROUTER_RULES).toBe("default");
  });

  it("should provide all required configuration properties", () => {
    const config = AI;

    expect(config).toHaveProperty("GEMINI_KEY");
    expect(config).toHaveProperty("MODEL");
    expect(config).toHaveProperty("TEMP");
    expect(config).toHaveProperty("MAX_TOKENS");
    expect(config).toHaveProperty("QPS");
    expect(config).toHaveProperty("SAFETY_LEVEL");
    expect(config).toHaveProperty("ROUTER_RULES");

    // Check types
    expect(typeof config.GEMINI_KEY).toBe("string");
    expect(typeof config.MODEL).toBe("string");
    expect(typeof config.TEMP).toBe("number");
    expect(typeof config.MAX_TOKENS).toBe("number");
    expect(typeof config.QPS).toBe("number");
    expect(typeof config.SAFETY_LEVEL).toBe("string");
    expect(typeof config.ROUTER_RULES).toBe("string");
  });
});
