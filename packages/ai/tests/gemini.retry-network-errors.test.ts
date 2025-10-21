import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { GenReq, GenRes } from "../src/clients/gemini.js";

// Mock the Google Generative AI SDK
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

// Set environment variable
process.env.GEMINI_API_KEY = "test-api-key";

describe("Gemini - Retry Network Errors", () => {
  let generate: (req: GenReq) => Promise<GenRes>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Dynamically import to get fresh module after mocking
    const geminiModule = await import("../src/clients/gemini.js");
    generate = geminiModule.generate;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should retry on network error and eventually succeed", async () => {
    let callCount = 0;

    mockGenerateContent.mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error("Network error: ECONNRESET");
      }
      return {
        response: {
          text: () => "Success after retries"
        }
      };
    });

    const result = await generate({
      input: "test prompt",
      model: "gemini-2.0-flash-exp"
    });

    expect(result.output).toBe("Success after retries");
    expect(callCount).toBe(3);
  });

  it("should fail after exhausting retries", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Network timeout"));

    await expect(
      generate({
        input: "test prompt",
        model: "gemini-2.0-flash-exp"
      })
    ).rejects.toThrow();

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it("should not retry on API key errors", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Invalid API key"));

    await expect(
      generate({
        input: "test prompt",
        model: "gemini-2.0-flash-exp"
      })
    ).rejects.toThrow("Invalid API key");

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("should not retry on permission errors", async () => {
    let callCount = 0;
    mockGenerateContent.mockImplementation(async () => {
      callCount++;
      throw new Error("API key permission denied");
    });

    await expect(
      generate({
        input: "test prompt",
        model: "gemini-2.0-flash-exp"
      })
    ).rejects.toThrow();

    // Should only be called once (no retries for permission errors)
    expect(callCount).toBe(1);
  });

  it("should use exponential backoff between retries", async () => {
    const timestamps: number[] = [];

    mockGenerateContent.mockImplementation(async () => {
      timestamps.push(Date.now());
      if (timestamps.length < 3) {
        throw new Error("Temporary network error");
      }
      return {
        response: {
          text: () => "Success"
        }
      };
    });

    await generate({
      input: "test prompt",
      model: "gemini-2.0-flash-exp"
    });

    // Check that delays increase (exponential backoff)
    expect(timestamps).toHaveLength(3);
    const delay1 = timestamps[1] - timestamps[0];
    const delay2 = timestamps[2] - timestamps[1];
    
    // Second delay should be longer than first (exponential backoff)
    expect(delay2).toBeGreaterThan(delay1);
  });

  it("should parse JSON response when requested", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '{"result": "success", "count": 42}'
      }
    });

    const result = await generate({
      input: "test prompt",
      model: "gemini-2.0-flash-exp",
      json: true
    });

    expect(result.output).toBe('{"result": "success", "count": 42}');
    expect(result.raw).toEqual({ result: "success", count: 42 });
  });

  it("should handle invalid JSON gracefully", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "This is not JSON"
      }
    });

    const result = await generate({
      input: "test prompt",
      model: "gemini-2.0-flash-exp",
      json: true
    });

    expect(result.output).toBe("This is not JSON");
    expect(result.raw).toBeUndefined();
  });

  it("should pass through custom temperature and maxTokens", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Response"
      }
    });

    await generate({
      input: "test prompt",
      model: "gemini-2.0-flash-exp",
      temperature: 0.9,
      maxTokens: 2000
    });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.generationConfig.temperature).toBe(0.9);
    expect(callArgs.generationConfig.maxOutputTokens).toBe(2000);
  });

  it("should include system instruction when provided", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Response"
      }
    });

    await generate({
      input: "test prompt",
      model: "gemini-2.0-flash-exp",
      system: "You are a helpful assistant"
    });

    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-2.0-flash-exp",
      systemInstruction: "You are a helpful assistant"
    });
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    
    // Re-import to pick up changed env
    vi.resetModules();
    const geminiModule = await import("../src/clients/gemini.js");
    const generateNoKey = geminiModule.generate;

    await expect(
      generateNoKey({
        input: "test prompt",
        model: "gemini-2.0-flash-exp"
      })
    ).rejects.toThrow("GEMINI_API_KEY missing");

    // Restore for other tests
    process.env.GEMINI_API_KEY = "test-api-key";
  });
});
