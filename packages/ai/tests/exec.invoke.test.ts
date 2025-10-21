import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InvokeContext, InvokeOptions } from "../src/exec/Invoke.js";

// Mock the gemini client and router
const mockGenerate = vi.fn();
const mockPickModel = vi.fn();
const mockGetFallbackModel = vi.fn();

vi.mock("../src/clients/gemini.js", () => ({
  generate: mockGenerate
}));

vi.mock("../src/router/ModelRouter.js", () => ({
  pickModel: mockPickModel,
  getFallbackModel: mockGetFallbackModel
}));

describe("LLM Invocation", () => {
  let invokeLLM: (ctx: InvokeContext, options: InvokeOptions) => Promise<any>;
  let batchInvoke: (requests: any[]) => Promise<any[]>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamically import after mocks are set up
    const invokeModule = await import("../src/exec/Invoke.js");
    invokeLLM = invokeModule.invokeLLM;
    batchInvoke = invokeModule.batchInvoke;
  });

  it("should invoke LLM with model selection", async () => {
    mockPickModel.mockReturnValue("gemini-1.5-pro");
    mockGenerate.mockResolvedValue({
      output: "Generated response",
      model: "gemini-1.5-pro"
    });

    const ctx: InvokeContext = {
      taskType: "code_generation",
      complexityHint: "high"
    };

    const options: InvokeOptions = {
      input: "Write a function"
    };

    const result = await invokeLLM(ctx, options);

    expect(result.output).toBe("Generated response");
    expect(result.modelUsed).toBe("gemini-1.5-pro");
    expect(result.attempts).toBe(1);
    expect(mockPickModel).toHaveBeenCalledWith({
      taskType: "code_generation",
      costHint: undefined,
      speedHint: undefined,
      complexityHint: "high"
    });
  });

  it("should fallback to another model on failure", async () => {
    mockPickModel.mockReturnValue("gemini-1.5-pro");
    mockGetFallbackModel.mockReturnValue("gemini-1.5-flash");

    let callCount = 0;
    mockGenerate.mockImplementation(async (req) => {
      callCount++;
      if (req.model === "gemini-1.5-pro") {
        throw new Error("Model unavailable");
      }
      return {
        output: "Fallback response",
        model: "gemini-1.5-flash"
      };
    });

    const ctx: InvokeContext = {
      taskType: "simple_task"
    };

    const options: InvokeOptions = {
      input: "Simple request"
    };

    const result = await invokeLLM(ctx, options);

    expect(result.output).toBe("Fallback response");
    expect(result.modelUsed).toBe("gemini-1.5-flash");
    expect(result.attempts).toBe(2);
    expect(mockGetFallbackModel).toHaveBeenCalledWith("gemini-1.5-pro");
  });

  it("should fail after exhausting fallback options", async () => {
    mockPickModel.mockReturnValue("gemini-1.5-pro");
    mockGetFallbackModel.mockReturnValue(null);
    mockGenerate.mockRejectedValue(new Error("Service unavailable"));

    const ctx: InvokeContext = {
      taskType: "test"
    };

    const options: InvokeOptions = {
      input: "Test input",
      maxRetries: 1
    };

    await expect(invokeLLM(ctx, options)).rejects.toThrow("LLM invocation failed");
  });

  it("should batch invoke multiple requests", async () => {
    mockPickModel.mockReturnValue("gemini-1.5-flash");
    mockGenerate.mockImplementation(async (req) => ({
      output: `Response for: ${req.input}`,
      model: req.model
    }));

    const requests = [
      {
        ctx: { taskType: "task1" },
        options: { input: "Request 1" }
      },
      {
        ctx: { taskType: "task2" },
        options: { input: "Request 2" }
      }
    ];

    const results = await batchInvoke(requests);

    expect(results).toHaveLength(2);
    expect(results[0].output).toBe("Response for: Request 1");
    expect(results[1].output).toBe("Response for: Request 2");
  });

  it("should pass through all options to generate", async () => {
    mockPickModel.mockReturnValue("gemini-1.5-pro");
    mockGenerate.mockResolvedValue({
      output: "Result",
      model: "gemini-1.5-pro"
    });

    const ctx: InvokeContext = {
      taskType: "test",
      costHint: "low",
      speedHint: "high"
    };

    const options: InvokeOptions = {
      input: "Test",
      system: "You are helpful",
      json: true,
      temperature: 0.9,
      maxTokens: 2000
    };

    await invokeLLM(ctx, options);

    expect(mockGenerate).toHaveBeenCalledWith({
      model: "gemini-1.5-pro",
      input: "Test",
      system: "You are helpful",
      json: true,
      temperature: 0.9,
      maxTokens: 2000
    });
  });
});
