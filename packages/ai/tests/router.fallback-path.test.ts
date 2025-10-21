import { describe, it, expect } from "vitest";
import { pickModel, getFallbackModel, estimateCost, MODELS } from "../src/router/ModelRouter.js";
import type { RouteCtx } from "../src/router/ModelRouter.js";

describe("ModelRouter - Fallback Path", () => {
  it("should select pro model for complex tasks", () => {
    const ctx: RouteCtx = {
      taskType: "complex-reasoning",
      complexityHint: "high"
    };

    const model = pickModel(ctx);
    expect(model).toBe("gemini-1.5-pro");
  });

  it("should select flash model for cost-sensitive tasks", () => {
    const ctx: RouteCtx = {
      taskType: "simple-generation",
      costHint: "low"
    };

    const model = pickModel(ctx);
    expect(model).toBe("gemini-1.5-flash");
  });

  it("should select fast model for speed-critical tasks", () => {
    const ctx: RouteCtx = {
      taskType: "quick-response",
      speedHint: "high"
    };

    const model = pickModel(ctx);
    expect(model).toBe("gemini-2.0-flash-exp");
  });

  it("should provide fallback for pro model", () => {
    const fallback = getFallbackModel("gemini-1.5-pro");
    expect(fallback).toBe("gemini-1.5-flash");
  });

  it("should provide fallback for flash models", () => {
    const fallback1 = getFallbackModel("gemini-1.5-flash");
    expect(fallback1).toBe("gemini-2.0-flash-exp");

    const fallback2 = getFallbackModel("gemini-2.0-flash-exp");
    expect(fallback2).toBe("gemini-1.5-flash");
  });

  it("should return null for unknown model fallback", () => {
    const fallback = getFallbackModel("unknown-model");
    expect(fallback).toBeNull();
  });

  it("should implement fallback chain on failure", () => {
    const initialModel = "gemini-1.5-pro";
    const fallbackChain: string[] = [initialModel];

    let current = initialModel;
    let fallback = getFallbackModel(current);

    while (fallback && fallbackChain.length < 5) {
      fallbackChain.push(fallback);
      current = fallback;
      fallback = getFallbackModel(current);
    }

    expect(fallbackChain.length).toBeGreaterThan(1);
    expect(fallbackChain[0]).toBe("gemini-1.5-pro");
    expect(fallbackChain[1]).toBe("gemini-1.5-flash");
  });

  it("should estimate cost correctly for different models", () => {
    const tokens = 1000;

    const costPro = estimateCost("gemini-1.5-pro", tokens);
    const costFlash = estimateCost("gemini-1.5-flash", tokens);
    const costFlashExp = estimateCost("gemini-2.0-flash-exp", tokens);

    expect(costPro).toBeGreaterThan(costFlash);
    expect(costFlash).toBeGreaterThanOrEqual(costFlashExp);
  });

  it("should scale cost with token count", () => {
    const model = "gemini-1.5-pro";

    const cost1k = estimateCost(model, 1000);
    const cost2k = estimateCost(model, 2000);
    const cost10k = estimateCost(model, 10000);

    expect(cost2k).toBeCloseTo(cost1k * 2, 1);
    expect(cost10k).toBeCloseTo(cost1k * 10, 1);
  });

  it("should return 0 cost for unknown model", () => {
    const cost = estimateCost("unknown-model", 1000);
    expect(cost).toBe(0);
  });

  it("should have correct model capabilities", () => {
    expect(MODELS["gemini-1.5-pro"].capabilities).toContain("long-context");
    expect(MODELS["gemini-2.0-flash-exp"].capabilities).toContain("reasoning");
    expect(MODELS["gemini-1.5-flash"].capabilities).toContain("code");
  });

  it("should classify models by speed correctly", () => {
    expect(MODELS["gemini-2.0-flash-exp"].speed).toBe("high");
    expect(MODELS["gemini-1.5-flash"].speed).toBe("high");
    expect(MODELS["gemini-1.5-pro"].speed).toBe("med");
  });

  it("should classify models by cost correctly", () => {
    expect(MODELS["gemini-1.5-pro"].cost).toBe("med");
    expect(MODELS["gemini-1.5-flash"].cost).toBe("low");
    expect(MODELS["gemini-2.0-flash-exp"].cost).toBe("low");
  });

  it("should route complex task by name pattern", () => {
    const ctx: RouteCtx = {
      taskType: "complex-code-generation",
    };

    const model = pickModel(ctx);
    expect(model).toBe("gemini-1.5-pro");
  });

  it("should handle multiple hints with priority", () => {
    // Complexity should take precedence
    const ctx1: RouteCtx = {
      taskType: "task",
      complexityHint: "high",
      costHint: "low"
    };
    expect(pickModel(ctx1)).toBe("gemini-1.5-pro");

    // Cost should be checked before speed
    const ctx2: RouteCtx = {
      taskType: "task",
      costHint: "low",
      speedHint: "high"
    };
    expect(pickModel(ctx2)).toBe("gemini-1.5-flash");

    // Speed should be checked if no other hints
    const ctx3: RouteCtx = {
      taskType: "task",
      speedHint: "high"
    };
    expect(pickModel(ctx3)).toBe("gemini-2.0-flash-exp");
  });

  it("should simulate fallback on model failure", () => {
    // Simulate: trying gemini-1.5-pro, it fails, fallback to flash
    let currentModel = "gemini-1.5-pro";
    let attempts = 0;
    const maxAttempts = 3;

    const tryGenerate = (model: string): boolean => {
      attempts++;
      // Simulate: pro fails, flash succeeds
      return model === "gemini-1.5-flash";
    };

    while (attempts < maxAttempts) {
      const success = tryGenerate(currentModel);
      if (success) break;

      const fallback = getFallbackModel(currentModel);
      if (!fallback) break;
      
      currentModel = fallback;
    }

    expect(currentModel).toBe("gemini-1.5-flash");
    expect(attempts).toBe(2);
  });
});
