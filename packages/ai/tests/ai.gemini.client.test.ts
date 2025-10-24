import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { generate, generateStream, type GenReq } from "../src/clients/gemini.js";

// Mock the Google Generative AI
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();
const mockGetGenerativeModel = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

describe("Gemini Client", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.GEMINI_API_KEY = "test-key";

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock model
    const mockModel = {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream
    };

    mockGetGenerativeModel.mockReturnValue(mockModel);

    // Setup default successful response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Generated response"
      }
    });

    mockGenerateContentStream.mockResolvedValue({
      stream: [
        { text: () => "Chunk 1" },
        { text: () => "Chunk 2" },
        { text: () => "" },
        { text: () => "Chunk 3" }
      ]
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("generate", () => {
    it("should throw error when API key is missing", async () => {
      delete process.env.GEMINI_API_KEY;

      const req: GenReq = {
        input: "Hello"
      };

      await expect(generate(req)).rejects.toThrow("GEMINI_API_KEY missing");
    });

    it("should generate text response successfully", async () => {
      const req: GenReq = {
        input: "Hello world",
        temperature: 0.5,
        maxTokens: 100
      };

      const result = await generate(req);

      expect(result.output).toBe("Generated response");
      expect(result.model).toBe("gemini-2.0-flash-exp"); // default model

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-2.0-flash-exp",
        systemInstruction: undefined
      });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: [{
          role: "user",
          parts: [{ text: "Hello world" }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 100
        },
        safetySettings: expect.any(Array)
      });
    });

    it("should use custom model when specified", async () => {
      const req: GenReq = {
        input: "Hello",
        model: "gemini-1.5-flash"
      };

      await generate(req);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-1.5-flash",
        systemInstruction: undefined
      });
    });

    it("should use system instruction when provided", async () => {
      const req: GenReq = {
        input: "Hello",
        system: "You are a helpful assistant"
      };

      await generate(req);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-2.0-flash-exp",
        systemInstruction: "You are a helpful assistant"
      });
    });

    it("should use default temperature and maxTokens from config", async () => {
      const req: GenReq = {
        input: "Hello"
      };

      await generate(req);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: expect.any(Array),
        generationConfig: {
          temperature: 0.2, // from AI.TEMP
          maxOutputTokens: 4096 // from AI.MAX_TOKENS
        },
        safetySettings: expect.any(Array)
      });
    });

    it("should parse JSON response when json flag is true", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"answer": 42, "status": "success"}'
        }
      });

      const req: GenReq = {
        input: "Return JSON",
        json: true
      };

      const result = await generate(req);

      expect(result.output).toBe('{"answer": 42, "status": "success"}');
      expect(result.raw).toEqual({ answer: 42, status: "success" });
    });

    it("should handle invalid JSON gracefully when json flag is true", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const req: GenReq = {
        input: "Return invalid JSON",
        json: true
      };

      const result = await generate(req);

      expect(result.output).toBe("Invalid JSON response");
      expect(result.raw).toBeUndefined();
    });

    it("should retry on transient errors", async () => {
      let callCount = 0;
      mockGenerateContent.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Temporary network error");
        }
        return {
          response: {
            text: () => "Success after retry"
          }
        };
      });

      const req: GenReq = {
        input: "Test retry"
      };

      const result = await generate(req);

      expect(result.output).toBe("Success after retry");
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it("should not retry on authentication errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API key not valid"));

      const req: GenReq = {
        input: "Test auth error"
      };

      await expect(generate(req)).rejects.toThrow("API key not valid");
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("should not retry on permission errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("Permission denied"));

      const req: GenReq = {
        input: "Test permission error"
      };

      await expect(generate(req)).rejects.toThrow("Permission denied");
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("should fail after max retries", async () => {
      mockGenerateContent.mockRejectedValue(new Error("Persistent error"));

      const req: GenReq = {
        input: "Test max retries"
      };

      await expect(generate(req)).rejects.toThrow("Persistent error");
      expect(mockGenerateContent).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should implement rate limiting", async () => {
      // This is harder to test directly due to the token bucket implementation
      // We can verify that the function doesn't throw and completes
      const req: GenReq = {
        input: "Test rate limiting"
      };

      const result = await generate(req);
      expect(result.output).toBeDefined();
    });
  });

  describe("generateStream", () => {
    it("should throw error when API key is missing", async () => {
      delete process.env.GEMINI_API_KEY;

      const req: GenReq = {
        input: "Hello"
      };

      await expect(async () => {
        const stream = generateStream(req);
        await stream.next();
      }).rejects.toThrow("GEMINI_API_KEY missing");
    });

    it("should stream text chunks", async () => {
      const req: GenReq = {
        input: "Stream this"
      };

      const chunks: string[] = [];
      for await (const chunk of generateStream(req)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["Chunk 1", "Chunk 2", "Chunk 3"]);
    });

    it("should filter out empty chunks", async () => {
      mockGenerateContentStream.mockResolvedValue({
        stream: [
          { text: () => "Valid chunk" },
          { text: () => "" },
          { text: () => "   " },
          { text: () => "Another valid chunk" }
        ]
      });

      const req: GenReq = {
        input: "Test filtering"
      };

      const chunks: string[] = [];
      for await (const chunk of generateStream(req)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["Valid chunk", "Another valid chunk"]);
    });

    it("should use streaming model configuration", async () => {
      const req: GenReq = {
        input: "Stream test",
        model: "gemini-1.5-flash",
        temperature: 0.8,
        system: "Streaming system"
      };

      const stream = generateStream(req);
      await stream.next(); // Trigger the setup

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-1.5-flash",
        systemInstruction: "Streaming system"
      });

      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        contents: [{
          role: "user",
          parts: [{ text: "Stream test" }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096 // default
        }
      });
    });
  });
});
