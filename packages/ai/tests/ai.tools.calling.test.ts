import { describe, it, expect, beforeEach } from "vitest";
import { ToolRuntime } from "../src/tools/ToolRuntime.js";
import { defineTool } from "../src/tools/ToolDefinition.js";
import { echoTool, readFileTool, calculateTool } from "../src/tools/zodTools.js";
import { z } from "zod";

describe("Tool Calling", () => {
  let runtime: ToolRuntime;

  beforeEach(() => {
    runtime = new ToolRuntime();
  });

  describe("ToolRuntime", () => {
    it("should register and list tools", () => {
      runtime.register(echoTool);
      runtime.register(readFileTool);

      const tools = runtime.list();
      expect(tools).toContain("echo");
      expect(tools).toContain("readFile");
      expect(tools.length).toBe(2);
    });

    it("should unregister tools", () => {
      runtime.register(echoTool);
      expect(runtime.list()).toContain("echo");

      runtime.unregister("echo");
      expect(runtime.list()).not.toContain("echo");
    });

    it("should get tool definition", () => {
      runtime.register(echoTool);

      const tool = runtime.getTool("echo");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("echo");
    });

    it("should invoke echo tool successfully", async () => {
      runtime.register(echoTool);

      const result = await runtime.invoke("echo", { message: "Hello" });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: "Hello" });
    });

    it("should invoke calculate tool successfully", async () => {
      runtime.register(calculateTool);

      const result = await runtime.invoke("calculate", { expression: "2 + 2" });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: 4 });
    });

    it("should validate input schema", async () => {
      runtime.register(echoTool);

      const result = await runtime.invoke("echo", { wrong: "field" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle tool not found", async () => {
      const result = await runtime.invoke("nonexistent", {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("tool_not_found");
    });

    it("should handle tool execution errors", async () => {
      const failingTool = defineTool(
        "fail",
        "Always fails",
        z.object({}),
        z.object({}),
        async () => {
          throw new Error("Tool failed");
        }
      );

      runtime.register(failingTool);

      const result = await runtime.invoke("fail", {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Tool failed");
    });

    it("should get tool schemas", () => {
      runtime.register(echoTool);
      runtime.register(readFileTool);

      const schemas = runtime.getSchemas();

      expect(schemas.length).toBe(2);
      expect(schemas[0]).toHaveProperty("name");
      expect(schemas[0]).toHaveProperty("description");
      expect(schemas[0]).toHaveProperty("schema");
    });

    it("should clear all tools", () => {
      runtime.register(echoTool);
      runtime.register(readFileTool);

      expect(runtime.list().length).toBe(2);

      runtime.clear();

      expect(runtime.list().length).toBe(0);
    });
  });

  describe("Custom Tools", () => {
    it("should create and execute custom tool", async () => {
      const upperCaseTool = defineTool(
        "upperCase",
        "Convert text to uppercase",
        z.object({ text: z.string() }),
        z.object({ result: z.string() }),
        async (args) => {
          return { result: args.text.toUpperCase() };
        }
      );

      runtime.register(upperCaseTool);

      const result = await runtime.invoke("upperCase", { text: "hello" });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: "HELLO" });
    });

    it("should validate output schema", async () => {
      const invalidOutputTool = defineTool(
        "invalid",
        "Returns invalid output",
        z.object({}),
        z.object({ required: z.string() }),
        async () => {
          return {} as any; // Missing required field
        }
      );

      runtime.register(invalidOutputTool);

      const result = await runtime.invoke("invalid", {});

      expect(result.success).toBe(false);
    });
  });
});
