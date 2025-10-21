# @agent-team/orchestration

Orchestration layer for managing workflows, tasks, and sagas in the Agent Team platform.

## Features

- **Workflow Management**: Build and execute multi-step workflows
- **Task Orchestration**: Coordinate task execution with retry and timeout policies
- **Saga Pattern**: Implement distributed transactions with compensating actions
- **Agent Registry**: Manage and discover agents by capabilities
- **Communication Adapter**: Integrate with @agent-team/communication
- **Metrics & Health**: Monitor orchestration performance and health

## Installation

```bash
pnpm add @agent-team/orchestration
```

## Quick Start

### Basic Workflow

```typescript
import { createWorkflow, createTask, Orchestrator } from "@agent-team/orchestration";

// Define tasks
const task1 = createTask("task1", async (ctx, input: number) => {
  return input + 1;
});

const task2 = createTask("task2", async (ctx, input: number) => {
  return input * 2;
});

// Build workflow
const workflow = createWorkflow("my-workflow")
  .addStep("step1", task1, { onFail: "RETRY", maxAttempts: 3 })
  .addStep("step2", task2)
  .build();

// Execute workflow
const orchestrator = new Orchestrator({
  emit: async (event) => console.log(event),
  now: () => Date.now()
});

const result = await orchestrator.run(workflow, {
  runId: "run-1",
  traceId: "trace-1",
  vars: {}
}, 5);

console.log(result); // { status: "SUCCESS", output: 12, ... }
```

### Saga Pattern

```typescript
import { createSaga } from "@agent-team/orchestration";

const saga = createSaga("payment-saga");

saga.addStep(
  "reserve-inventory",
  async (ctx, orderId) => {
    // Reserve inventory
    return { inventoryId: "inv-123" };
  },
  async (ctx, orderId) => {
    // Compensate: release inventory
    console.log("Releasing inventory");
  }
);

saga.addStep(
  "charge-payment",
  async (ctx, data) => {
    // Charge payment
    return { paymentId: "pay-456" };
  },
  async (ctx, data) => {
    // Compensate: refund payment
    console.log("Refunding payment");
  }
);

const result = await saga.execute({
  runId: "saga-1",
  traceId: "trace-1",
  vars: {}
}, "order-123");
```

### Communication Integration

```typescript
import { CommAdapter } from "@agent-team/orchestration";

const adapter = new CommAdapter();
await adapter.start();

// Subscribe to topics
adapter.subscribe("orchestration::request", async (msg) => {
  console.log("Received request:", msg.payload);
});

// Publish messages
await adapter.publish("orchestration::decision", {
  decision: "approved"
}, "orchestrator");

await adapter.stop();
```

## Configuration

Environment variables:

```bash
ORCH_ENABLED=true
ORCH_MAX_RETRIES=3
```

## API Reference

### Orchestrator

```typescript
class Orchestrator {
  constructor(options: OrchestratorOptions);
  run(plan: WorkflowPlan, ctx: TaskContext, input: unknown): Promise<WorkflowResult>;
  runWithTimeout(plan: WorkflowPlan, ctx: TaskContext, input: unknown): Promise<WorkflowResult>;
}
```

### WorkflowBuilder

```typescript
class WorkflowBuilder {
  addStep(id: string, task: Task, options?: StepOptions): this;
  build(): WorkflowPlan;
}
```

### Saga

```typescript
class Saga {
  addStep(id: string, forward: Function, compensate?: Function): this;
  execute(ctx: TaskContext, input: unknown): Promise<SagaResult>;
}
```

## Testing

```bash
pnpm test
pnpm test --coverage
```

## License

MIT
