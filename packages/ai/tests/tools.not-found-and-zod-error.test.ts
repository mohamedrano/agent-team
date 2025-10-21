import { describe, it, expect } from "vitest";
import { ToolRuntime } from "../src/tools/ToolRuntime.js";
import { z } from "zod";
import type { ToolDef } from "../src/tools/ToolDefinition.js";

describe("ToolRuntime - Not Found & Zod Errors", () => {
  it("should return tool_not_found error for unregistered tool", async () => {
    const runtime = new ToolRuntime();

    const result = await runtime.invoke("non-existent-tool", {});

    expect(result.success).toBe(false);
    expect(result.error).toContain("tool_not_found");
    expect(result.error).toContain("non-existent-tool");
  });

  it("should successfully invoke a registered tool", async () => {
    const runtime = new ToolRuntime();

    const addTool: ToolDef<{ a: number; b: number }, number> = {
      name: "add",
      desc: "Add two numbers",
      input: z.object({ a: z.number(), b: z.number() }),
      output: z.number(),
      run: async (args) => args.a + args.b
    };

    runtime.register(addTool);

    const result = await runtime.invoke("add", { a: 5, b: 3 });

    expect(result.success).toBe(true);
    expect(result.output).toBe(8);
  });

  it("should reject invalid input with Zod error", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<{ count: number }, string> = {
      name: "repeat",
      desc: "Repeat a string",
      input: z.object({ count: z.number().positive() }),
      output: z.string(),
      run: async (args) => "x".repeat(args.count)
    };

    runtime.register(tool);

    const result = await runtime.invoke("repeat", { count: "not-a-number" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject missing required fields", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<{ name: string; age: number }, string> = {
      name: "greet",
      desc: "Greet a person",
      input: z.object({
        name: z.string(),
        age: z.number()
      }),
      output: z.string(),
      run: async (args) => `Hello ${args.name}, age ${args.age}`
    };

    runtime.register(tool);

    const result = await runtime.invoke("greet", { name: "Alice" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject invalid data types", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<{ email: string }, boolean> = {
      name: "validate-email",
      desc: "Validate email format",
      input: z.object({ email: z.string().email() }),
      output: z.boolean(),
      run: async () => true
    };

    runtime.register(tool);

    const result = await runtime.invoke("validate-email", { email: "not-an-email" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should validate output schema", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<{ input: string }, { result: string; code: number }> = {
      name: "process",
      desc: "Process input",
      input: z.object({ input: z.string() }),
      output: z.object({ result: z.string(), code: z.number() }),
      run: async (args) => ({ result: args.input, code: 200 })
    };

    runtime.register(tool);

    const result = await runtime.invoke("process", { input: "test" });

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ result: "test", code: 200 });
  });

  it("should reject invalid output from tool", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<{ input: string }, { result: string; code: number }> = {
      name: "bad-tool",
      desc: "Tool that returns invalid output",
      input: z.object({ input: z.string() }),
      output: z.object({ result: z.string(), code: z.number() }),
      run: async () => ({ result: "ok" } as any) // Missing 'code'
    };

    runtime.register(tool);

    const result = await runtime.invoke("bad-tool", { input: "test" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should list registered tools", () => {
    const runtime = new ToolRuntime();

    const tool1: ToolDef<any, any> = {
      name: "tool1",
      desc: "First tool",
      input: z.any(),
      output: z.any(),
      run: async () => null
    };

    const tool2: ToolDef<any, any> = {
      name: "tool2",
      desc: "Second tool",
      input: z.any(),
      output: z.any(),
      run: async () => null
    };

    runtime.register(tool1);
    runtime.register(tool2);

    const tools = runtime.list();
    expect(tools).toHaveLength(2);
    expect(tools).toContain("tool1");
    expect(tools).toContain("tool2");
  });

  it("should unregister tools", () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<any, any> = {
      name: "temp-tool",
      desc: "Temporary tool",
      input: z.any(),
      output: z.any(),
      run: async () => null
    };

    runtime.register(tool);
    expect(runtime.list()).toContain("temp-tool");

    const unregistered = runtime.unregister("temp-tool");
    expect(unregistered).toBe(true);
    expect(runtime.list()).not.toContain("temp-tool");
  });

  it("should return false when unregistering non-existent tool", () => {
    const runtime = new ToolRuntime();
    const result = runtime.unregister("non-existent");
    expect(result).toBe(false);
  });

  it("should get tool definition", () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<any, any> = {
      name: "my-tool",
      desc: "My tool description",
      input: z.object({ x: z.number() }),
      output: z.string(),
      run: async () => "result"
    };

    runtime.register(tool);

    const retrieved = runtime.getTool("my-tool");
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("my-tool");
    expect(retrieved?.desc).toBe("My tool description");
  });

  it("should return undefined for non-existent tool definition", () => {
    const runtime = new ToolRuntime();
    const tool = runtime.getTool("non-existent");
    expect(tool).toBeUndefined();
  });

  it("should get tool schemas for LLM", () => {
    const runtime = new ToolRuntime();

    const tool1: ToolDef<any, any> = {
      name: "tool1",
      desc: "First tool",
      input: z.object({ param: z.string() }),
      output: z.any(),
      run: async () => null
    };

    const tool2: ToolDef<any, any> = {
      name: "tool2",
      desc: "Second tool",
      input: z.object({ count: z.number() }),
      output: z.any(),
      run: async () => null
    };

    runtime.register(tool1);
    runtime.register(tool2);

    const schemas = runtime.getSchemas();
    expect(schemas).toHaveLength(2);
    expect(schemas[0].name).toBe("tool1");
    expect(schemas[0].description).toBe("First tool");
    expect(schemas[1].name).toBe("tool2");
  });

  it("should clear all tools", () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<any, any> = {
      name: "tool",
      desc: "A tool",
      input: z.any(),
      output: z.any(),
      run: async () => null
    };

    runtime.register(tool);
    expect(runtime.list()).toHaveLength(1);

    runtime.clear();
    expect(runtime.list()).toHaveLength(0);
  });

  it("should handle tool execution errors", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<{ input: string }, string> = {
      name: "failing-tool",
      desc: "Tool that throws error",
      input: z.object({ input: z.string() }),
      output: z.string(),
      run: async () => {
        throw new Error("Tool execution failed");
      }
    };

    runtime.register(tool);

    const result = await runtime.invoke("failing-tool", { input: "test" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tool execution failed");
  });

  it("should handle complex nested schemas", async () => {
    const runtime = new ToolRuntime();

    const tool: ToolDef<any, any> = {
      name: "complex",
      desc: "Complex nested schema",
      input: z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
          emails: z.array(z.string().email())
        })
      }),
      output: z.boolean(),
      run: async () => true
    };

    runtime.register(tool);

    const validResult = await runtime.invoke("complex", {
      user: {
        name: "Alice",
        age: 30,
        emails: ["alice@example.com", "alice2@example.com"]
      }
    });

    expect(validResult.success).toBe(true);

    const invalidResult = await runtime.invoke("complex", {
      user: {
        name: "Bob",
        age: "invalid",
        emails: ["not-an-email"]
      }
    });

    expect(invalidResult.success).toBe(false);
  });
});
