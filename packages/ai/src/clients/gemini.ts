import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI } from "../env.js";
import { TokenBucket } from "../rate/TokenBucket.js";

export type GenReq = {
  model?: string;
  input: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  json?: boolean;
};

export type GenRes = {
  output: string;
  raw?: unknown;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

// Global rate limiter
const bucket = new TokenBucket(Math.max(1, AI.QPS), Math.max(1, AI.QPS));

/**
 * Generate content using Google Gemini
 */
export async function generate(req: GenReq): Promise<GenRes> {
  if (!AI.GEMINI_KEY) {
    throw new Error("GEMINI_API_KEY missing - set it in environment variables");
  }

  // Rate limiting
  while (!bucket.take()) {
    await new Promise(r => setTimeout(r, 50));
  }

  const genAI = new GoogleGenerativeAI(AI.GEMINI_KEY);
  const modelName = req.model ?? AI.MODEL;
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: req.system
  });

  const maxRetries = 2;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: req.input }]
        }],
        generationConfig: {
          temperature: req.temperature ?? AI.TEMP,
          maxOutputTokens: req.maxTokens ?? AI.MAX_TOKENS
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT" as any,
            threshold: "BLOCK_ONLY_HIGH" as any
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH" as any,
            threshold: "BLOCK_ONLY_HIGH" as any
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
            threshold: "BLOCK_ONLY_HIGH" as any
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
            threshold: "BLOCK_ONLY_HIGH" as any
          }
        ]
      });

      const text = result.response.text();

      // Parse JSON if requested
      if (req.json) {
        try {
          return {
            output: text,
            raw: JSON.parse(text),
            model: modelName
          };
        } catch {
          // Return as text if JSON parsing fails
          return { output: text, model: modelName };
        }
      }

      return { output: text, model: modelName };

    } catch (err: any) {
      lastError = err;

      // Don't retry on certain errors
      if (err.message?.includes("API key") || err.message?.includes("permission")) {
        throw err;
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 200 * (2 ** attempt)));
      }
    }
  }

  throw lastError ?? new Error("Generation failed after retries");
}

/**
 * Generate with streaming (simplified)
 */
export async function* generateStream(req: GenReq): AsyncGenerator<string> {
  if (!AI.GEMINI_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  while (!bucket.take()) {
    await new Promise(r => setTimeout(r, 50));
  }

  const genAI = new GoogleGenerativeAI(AI.GEMINI_KEY);
  const model = genAI.getGenerativeModel({
    model: req.model ?? AI.MODEL,
    systemInstruction: req.system
  });

  const result = await model.generateContentStream({
    contents: [{
      role: "user",
      parts: [{ text: req.input }]
    }],
    generationConfig: {
      temperature: req.temperature ?? AI.TEMP,
      maxOutputTokens: req.maxTokens ?? AI.MAX_TOKENS
    }
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}
