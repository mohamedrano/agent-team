import { describe, it, expect } from "vitest";
import {
  SYSTEM_BASE,
  SYSTEM_CODE_GEN,
  SYSTEM_CODE_REVIEW,
  SYSTEM_DEBUG,
  SYSTEM_CLASSIFY,
  SYSTEM_JSON_EXTRACT
} from "../src/prompts/system.js";
import {
  asJson,
  withContext,
  withExamples,
  forCodeTask,
  forExtraction
} from "../src/prompts/formatters.js";
import { FEWSHOTS, getFewShots } from "../src/prompts/fewshot.js";

describe("Prompt Templates", () => {
  describe("System Prompts", () => {
    it("should have base system prompt", () => {
      expect(SYSTEM_BASE).toBeDefined();
      expect(SYSTEM_BASE.length).toBeGreaterThan(0);
    });

    it("should have code generation prompt", () => {
      expect(SYSTEM_CODE_GEN).toBeDefined();
      expect(SYSTEM_CODE_GEN).toContain(SYSTEM_BASE);
    });

    it("should have code review prompt", () => {
      expect(SYSTEM_CODE_REVIEW).toBeDefined();
      expect(SYSTEM_CODE_REVIEW).toContain(SYSTEM_BASE);
    });

    it("should have debug prompt", () => {
      expect(SYSTEM_DEBUG).toBeDefined();
      expect(SYSTEM_DEBUG).toContain(SYSTEM_BASE);
    });

    it("should have classify prompt", () => {
      expect(SYSTEM_CLASSIFY).toBeDefined();
      expect(SYSTEM_CLASSIFY).toContain("JSON");
    });

    it("should have JSON extract prompt", () => {
      expect(SYSTEM_JSON_EXTRACT).toBeDefined();
      expect(SYSTEM_JSON_EXTRACT).toContain("JSON");
    });
  });

  describe("Formatters", () => {
    it("should format JSON request", () => {
      const prompt = asJson("UserSchema", "Extract user data");

      expect(prompt).toContain("UserSchema");
      expect(prompt).toContain("Extract user data");
      expect(prompt).toContain("JSON");
    });

    it("should format with context", () => {
      const prompt = withContext("The sky is blue", "What color is the sky?");

      expect(prompt).toContain("السياق");
      expect(prompt).toContain("The sky is blue");
      expect(prompt).toContain("What color is the sky?");
    });

    it("should format with examples", () => {
      const examples = [
        { input: "2+2", output: "4" },
        { input: "3+3", output: "6" }
      ];

      const prompt = withExamples("Calculate", examples);

      expect(prompt).toContain("Calculate");
      expect(prompt).toContain("2+2");
      expect(prompt).toContain("4");
    });

    it("should format code task", () => {
      const prompt = forCodeTask("TypeScript", "Create a function", [
        "Use arrow function",
        "Add type annotations"
      ]);

      expect(prompt).toContain("TypeScript");
      expect(prompt).toContain("Create a function");
      expect(prompt).toContain("arrow function");
    });

    it("should format extraction task", () => {
      const prompt = forExtraction("John is 30 years old", ["name", "age"]);

      expect(prompt).toContain("name");
      expect(prompt).toContain("age");
      expect(prompt).toContain("John is 30");
    });
  });

  describe("Few-shot Examples", () => {
    it("should have classification examples", () => {
      expect(FEWSHOTS.classify).toBeDefined();
      expect(FEWSHOTS.classify.length).toBeGreaterThan(0);
    });

    it("should have code generation examples", () => {
      expect(FEWSHOTS.code_gen).toBeDefined();
      expect(FEWSHOTS.code_gen.length).toBeGreaterThan(0);
    });

    it("should have JSON extraction examples", () => {
      expect(FEWSHOTS.json_extract).toBeDefined();
      expect(FEWSHOTS.json_extract.length).toBeGreaterThan(0);
    });

    it("should get few-shots by task type", () => {
      const examples = getFewShots("classify");

      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown task", () => {
      const examples = getFewShots("unknown_task");

      expect(examples).toEqual([]);
    });
  });
});
