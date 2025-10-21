# @agent-team/ai

AI integration package for Agent Team platform with Google Gemini support, tool calling, and model routing.

## Features

- **Google Gemini Integration**: Full support for gemini-2.5-pro and 1.5 models
- **Rate Limiting**: Token bucket rate limiter for API quota management
- **Tool Calling**: Define and execute tools with Zod schema validation
- **Model Router**: Automatic model selection based on task requirements
- **Prompt Engineering**: Pre-built system prompts and formatters
- **Few-Shot Learning**: Examples library for common tasks
- **Retry & Fallback**: Automatic retry with exponential backoff and model fallback

## Installation

```bash
pnpm add @agent-team/ai
```

## Configuration

Set environment variables:

```bash
GEMINI_API_KEY=your_api_key_here
AI_MODEL_DEFAULT=gemini-2.5-pro
AI_TEMPERATURE=0.2
AI_MAX_TOKENS=4096
AI_RATE_QPS=3
```

## Quick Start

### Basic Text Generation

```typescript
import { generate } from "@agent-team/ai";

const result = await generate({
  input: "What is TypeScript?",
  temperature: 0.2
});

console.log(result.output);
```

### JSON Output

```typescript
const result = await generate({
  input: "Return user data: name is John, age is 30",
  json: true,
  system: "Extract information and return as JSON"
});

console.log(result.raw); // { name: "John", age: 30 }
```

### Model Selection

```typescript
import { invokeLLM } from "@agent-team/ai";

const result = await invokeLLM(
  {
    taskType: "code_generation",
    complexityHint: "high",
    speedHint: "med"
  },
  {
    input: "Write a TypeScript function to sort an array",
    system: SYSTEM_CODE_GEN
  }
);
```

### Tool Calling

```typescript
import { ToolRuntime, defineTool } from "@agent-team/ai";
import { z } from "zod";

// Define a custom tool
const searchTool = defineTool(
  "search",
  "Search the web",
  z.object({ query: z.string() }),
  z.object({ results: z.array(z.string()) }),
  async (args) => {
    // Implement search logic
    return { results: ["result 1", "result 2"] };
  }
);

// Create runtime and register tools
const runtime = new ToolRuntime();
runtime.register(searchTool);

// Invoke tool
const result = await runtime.invoke("search", {
  query: "TypeScript best practices"
});

console.log(result.output);
```

### Built-in Tools

```typescript
import { builtInTools, ToolRuntime } from "@agent-team/ai";

const runtime = new ToolRuntime();

// Register all built-in tools
for (const tool of builtInTools) {
  runtime.register(tool);
}

// Available tools: echo, readFile, httpGet, calculate
const result = await runtime.invoke("calculate", {
  expression: "2 + 2 * 3"
});

console.log(result.output); // { result: 8 }
```

### Prompt Engineering

```typescript
import { asJson, withContext, forCodeTask, SYSTEM_CODE_GEN } from "@agent-team/ai";

// JSON extraction
const prompt1 = asJson("UserSchema", "Extract name and age from text");

// Code generation
const prompt2 = forCodeTask("TypeScript", "Create a merge sort function", [
  "Use generics",
  "Add JSDoc comments"
]);

// With context
const prompt3 = withContext(
  "The user is logged in as admin",
  "What are the user's permissions?"
);
```

## API Reference

### Gemini Client

```typescript
function generate(req: GenReq): Promise<GenRes>
function* generateStream(req: GenReq): AsyncGenerator<string>
```

### Tool Runtime

```typescript
class ToolRuntime {
  register(tool: ToolDef): void;
  invoke(name: string, args: any): Promise<ToolResult>;
  list(): string[];
  getSchemas(): Array<ToolSchema>;
}
```

### Model Router

```typescript
function pickModel(ctx: RouteCtx): string
function getFallbackModel(model: string): string | null
function estimateCost(model: string, tokens: number): number
```

### Rate Limiter

```typescript
class TokenBucket {
  constructor(capacity: number, refillPerSec: number);
  take(n?: number): boolean;
  waitForTokens(n?: number): Promise<void>;
}
```

## System Prompts

Pre-built system prompts for common tasks:

- `SYSTEM_BASE`: Base prompt for structured outputs
- `SYSTEM_CODE_GEN`: Code generation
- `SYSTEM_CODE_REVIEW`: Code review
- `SYSTEM_DEBUG`: Debugging assistance
- `SYSTEM_CLASSIFY`: Text classification
- `SYSTEM_JSON_EXTRACT`: JSON extraction

## Testing

```bash
pnpm test
pnpm test --coverage
```

Note: Real API tests are skipped by default. Set `GEMINI_API_KEY` to run them.

## License

MIT
