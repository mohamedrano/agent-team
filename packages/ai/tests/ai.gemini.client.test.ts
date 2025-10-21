import { describe, it, expect, beforeEach } from "vitest";
import { generate, type GenReq } from "../src/clients/gemini.js";

describe("Gemini Client", () => {
  describe("generate", () => {
    it("should throw error when API key is missing", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const req: GenReq = {
        input: "Hello"
      };

      await expect(generate(req)).rejects.toThrow("GEMINI_API_KEY missing");

      process.env.GEMINI_API_KEY = originalKey;
    });

    // Real API tests - skip in CI
    it.skip("should generate text response", async () => {
      const req: GenReq = {
        input: "What is 2+2? Answer with just the number.",
        temperature: 0
      };

      const result = await generate(req);

      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.model).toBeDefined();
    });

    it.skip("should generate JSON response when requested", async () => {
      const req: GenReq = {
        input: 'Return this JSON: {"answer": 4}',
        json: true,
        temperature: 0
      };

      const result = await generate(req);

      expect(result.output).toBeDefined();
      expect(result.raw).toBeDefined();
      expect(result.raw).toHaveProperty("answer");
    });

    it.skip("should respect temperature parameter", async () => {
      const req: GenReq = {
        input: "Generate a random number between 1 and 100",
        temperature: 1.0
      };

      const result = await generate(req);

      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });

    it.skip("should use custom model when specified", async () => {
      const req: GenReq = {
        input: "Hello",
        model: "gemini-1.5-flash"
      };

      const result = await generate(req);

      expect(result.model).toBe("gemini-1.5-flash");
    });

    it.skip("should use system instruction", async () => {
      const req: GenReq = {
        input: "What's your role?",
        system: "You are a helpful math tutor.",
        temperature: 0
      };

      const result = await generate(req);

      expect(result.output).toBeDefined();
      expect(result.output.toLowerCase()).toMatch(/math|tutor/);
    });
  });
});
