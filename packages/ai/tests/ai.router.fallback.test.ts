import { describe, it, expect } from "vitest";
import { pickModel, getFallbackModel, estimateCost, MODELS } from "../src/router/ModelRouter.js";

describe("Model Router", () => {
  describe("pickModel", () => {
    it("should select pro model for complex tasks", () => {
      const model = pickModel({
        taskType: "complex_reasoning",
        complexityHint: "high"
      });

      expect(model).toBe("gemini-1.5-pro");
    });

    it("should select flash model for cost-sensitive tasks", () => {
      const model = pickModel({
        taskType: "simple_task",
        costHint: "low"
      });

      expect(model).toBe("gemini-1.5-flash");
    });

    it("should select fast model for speed-critical tasks", () => {
      const model = pickModel({
        taskType: "quick_response",
        speedHint: "high"
      });

      expect(model).toBe("gemini-2.0-flash-exp");
    });

    it("should use default model for standard tasks", () => {
      const model = pickModel({
        taskType: "standard"
      });

      expect(model).toBeDefined();
      expect(MODELS[model]).toBeDefined();
    });
  });

  describe("getFallbackModel", () => {
    it("should return fallback for pro model", () => {
      const fallback = getFallbackModel("gemini-1.5-pro");
      expect(fallback).toBe("gemini-1.5-flash");
    });

    it("should return fallback for flash model", () => {
      const fallback = getFallbackModel("gemini-1.5-flash");
      expect(fallback).toBe("gemini-2.0-flash-exp");
    });

    it("should return null for unknown model", () => {
      const fallback = getFallbackModel("unknown-model");
      expect(fallback).toBeNull();
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost for pro model", () => {
      const cost = estimateCost("gemini-1.5-pro", 1000);
      expect(cost).toBeGreaterThan(0);
    });

    it("should estimate lower cost for flash model", () => {
      const proCost = estimateCost("gemini-1.5-pro", 1000);
      const flashCost = estimateCost("gemini-1.5-flash", 1000);
      expect(flashCost).toBeLessThan(proCost);
    });

    it("should return 0 for unknown model", () => {
      const cost = estimateCost("unknown-model", 1000);
      expect(cost).toBe(0);
    });

    it("should scale with token count", () => {
      const cost1k = estimateCost("gemini-1.5-flash", 1000);
      const cost2k = estimateCost("gemini-1.5-flash", 2000);
      expect(cost2k).toBe(cost1k * 2);
    });
  });
});
