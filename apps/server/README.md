# Agent Team Server

Main server application for the Agent Team platform with orchestration and AI integration.

## Features

- **Fastify HTTP Server**: High-performance REST API
- **Communication Layer**: Multi-agent message bus
- **Orchestration Layer**: Workflow and task management
- **AI Integration**: Google Gemini with tool calling
- **Health Monitoring**: Built-in health checks

## Quick Start

### Installation

```bash
pnpm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=8080
HOST=0.0.0.0
NODE_ENV=development

# Communication
COMM_QOS=at-least-once
AGENT_BUS_PROVIDER=memory

# AI
GEMINI_API_KEY=your_api_key_here
AI_MODEL_DEFAULT=gemini-2.0-flash-exp
AI_TEMPERATURE=0.2

# Orchestration
ORCH_ENABLED=true
ORCH_MAX_RETRIES=3
```

### Running the Server

```bash
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start
```

### API Endpoints

#### Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 123.45
}
```

#### Agents Registry

```bash
curl http://localhost:8080/api/agents
```

## AI Demo

Run the AI integration demo:

```bash
# Make sure GEMINI_API_KEY is set
export GEMINI_API_KEY=your_key_here

# Run demo
pnpm ai:demo
```

The demo will:
1. Initialize communication adapter
2. Send text generation task
3. Call tools (echo, calculate)
4. Perform classification (if API key available)

## Orchestration

The orchestration layer is automatically initialized on server startup if `ORCH_ENABLED=true`.

### Features

- Workflow execution with retry policies
- Saga pattern for distributed transactions
- Event emission to communication bus
- Integration with AI agents

### Example Workflow

```typescript
import { createWorkflow, createTask } from "@agent-team/orchestration";

const workflow = createWorkflow("deploy-app")
  .addStep("build", buildTask, { onFail: "RETRY", maxAttempts: 3 })
  .addStep("test", testTask, { onFail: "ABORT" })
  .addStep("deploy", deployTask)
  .build();

const result = await orchestrator.run(workflow, ctx, input);
```

## AI Integration

### Task Types

The AI agent handles different task types:

#### Generate

```typescript
{
  kind: "generate",
  prompt: "Your prompt here",
  temperature: 0.2,
  system: "Optional system prompt"
}
```

#### Classify

```typescript
{
  kind: "classify",
  text: "Text to classify"
}
```

#### Code Generation

```typescript
{
  kind: "code_gen",
  prompt: "Generate a TypeScript function..."
}
```

### Tool Calling

Available built-in tools:

- **echo**: Echo back a message
- **readFile**: Read file contents (mock)
- **httpGet**: Make HTTP GET request (mock)
- **calculate**: Evaluate mathematical expressions

Call a tool via message bus:

```typescript
{
  type: "TOOL_CALL",
  payload: {
    name: "calculate",
    args: { expression: "2 + 2" }
  }
}
```

## Development

### Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test --coverage
```

### Linting

```bash
# Check linting
pnpm lint

# Fix issues
pnpm lint:fix
```

### Type Checking

```bash
pnpm typecheck
```

## Architecture

```
apps/server/
├── src/
│   ├── main.ts                 # Entry point
│   ├── api.ts                  # Fastify app
│   ├── orchestration.boot.ts   # Orchestration initialization
│   ├── ai.demo.ts              # AI demo script
│   └── agents/
│       ├── ai.ts               # AI agent handlers
│       ├── communication.ts    # Communication setup
│       └── registry.ts         # Agent registry
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `AI_MODEL_DEFAULT` | Default AI model | `gemini-2.0-flash-exp` |
| `AI_TEMPERATURE` | Generation temperature | `0.2` |
| `AI_MAX_TOKENS` | Max output tokens | `4096` |
| `AI_RATE_QPS` | Rate limit (queries/sec) | `3` |
| `ORCH_ENABLED` | Enable orchestration | `true` |
| `ORCH_MAX_RETRIES` | Max retry attempts | `3` |
| `COMM_QOS` | Message QoS level | `at-least-once` |
| `DEBUG` | Enable debug logging | `false` |

## Troubleshooting

### API Key Issues

If you see "GEMINI_API_KEY missing":

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set it in `.env`: `GEMINI_API_KEY=your_key_here`
3. Restart the server

### Rate Limiting

If you hit rate limits:

1. Adjust `AI_RATE_QPS` in `.env`
2. The token bucket will automatically throttle requests
3. Consider upgrading your API quota

### Memory Bus

By default, the server uses in-memory message bus. For production:

1. Set `AGENT_BUS_PROVIDER=redis` or `pubsub`
2. Configure Redis/Pub/Sub connection
3. Restart the server

## License

MIT
