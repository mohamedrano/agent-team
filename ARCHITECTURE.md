# 🏗️ Agent Team - Technical Architecture Documentation

<div dir="rtl">

## الوثيقة الفنية الشاملة لبنية نظام Agent Team

**النسخة:** 2.0  
**التاريخ:** 2025-01-21  
**الحالة:** ✅ مكتمل  
**المؤلفون:** فريق Agent Team

</div>

---

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Architectural Principles](#architectural-principles)
3. [System Components](#system-components)
4. [Agent Architecture](#agent-architecture)
5. [Communication Protocol](#communication-protocol)
6. [State Management](#state-management)
7. [Orchestration Pipeline](#orchestration-pipeline)
8. [Data Flow](#data-flow)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Scalability & Performance](#scalability--performance)
12. [Monitoring & Observability](#monitoring--observability)
13. [Technology Stack](#technology-stack)
14. [Design Patterns](#design-patterns)
15. [Extension Points](#extension-points)

---

## 1. System Overview

### 1.1 Vision

**Agent Team** transforms natural language descriptions into production-ready software through orchestrated AI agents that simulate a complete software development team.

### 1.2 Core Capabilities

- **Multi-Agent Coordination**: 21+ specialized AI agents work together
- **Full SDLC Automation**: From requirements to deployment
- **Enterprise-Grade Quality**: Built-in security, testing, and monitoring
- **Language Agnostic**: Supports Arabic and English natively
- **Cloud-Native**: Designed for containerized deployment

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│  Natural Language Input (Arabic/English) → Web UI / API         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                          │
│  Team Leader (Awsa) - Coordinates all agent activities         │
│  - Analyzes requests                                            │
│  - Creates execution plans                                      │
│  - Manages debates & decisions                                  │
│  - Monitors progress                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT LAYER (21 Agents)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Strategy   │ │   Design    │ │  Execution  │              │
│  │   Layer     │ │    Layer    │ │    Layer    │              │
│  │             │ │             │ │             │              │
│  │ • PM        │ │ • Architect │ │ • Engineer  │              │
│  │             │ │ • UX/UI     │ │ • Data      │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Quality    │ │ Operations  │ │ Integration │              │
│  │   Layer     │ │    Layer    │ │    Layer    │              │
│  │             │ │             │ │             │              │
│  │ • QA        │ │ • DevOps    │ │ • API       │              │
│  │ • AppSec    │ │ • SRE       │ │ • Contracts │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   COMMUNICATION LAYER                           │
│  Message Bus • Router • Debate Coordinator • Idempotency        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STATE LAYER                                │
│  Session State Store • Artifact Management • Schema Validation  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                          │
│  Cloud Run • PostgreSQL • Redis • Cloud Storage • CDN          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Principles

### 2.1 Design Philosophy

1. **Separation of Concerns**: Each agent has a single, well-defined responsibility
2. **Hierarchical Composition**: Agents can delegate to sub-agents
3. **Message-Driven**: All inter-agent communication via typed messages
4. **Event Sourcing**: State changes are logged as events
5. **Idempotent Operations**: Retry-safe message processing
6. **Fail-Fast**: Early validation prevents cascading failures

### 2.2 Architectural Constraints

- **Stateless Agents**: Agents don't maintain internal state between invocations
- **Bounded Context**: Each agent operates within a defined domain
- **Single Writer Principle**: Only one agent can write to a given state key
- **Schema Validation**: All state artifacts must conform to Zod schemas
- **Timeout Boundaries**: All operations have explicit timeouts

### 2.3 Quality Attributes

| Attribute | Target | Implementation |
|-----------|--------|----------------|
| **Availability** | 99.9% | Multi-region deployment, Circuit breakers |
| **Performance** | P95 < 2s | Caching, Connection pooling, Async processing |
| **Scalability** | 100 concurrent pipelines | Horizontal scaling, Message queuing |
| **Security** | OWASP Top 10 | Input validation, Encryption, RBAC |
| **Maintainability** | < 4 hours MTTR | Structured logging, Distributed tracing |
| **Testability** | > 80% coverage | Unit, Integration, E2E tests |

---

## 3. System Components

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/server/src/                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   agents/   │  │    comm/    │  │   state/    │            │
│  │             │  │             │  │             │            │
│  │ • types.ts  │  │ • bus.ts    │  │ • store.ts  │            │
│  │ • builtin.ts│  │ • router.ts │  │ • schemas.ts│            │
│  │ • registry  │  │ • debate.ts │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │orchestration│  │    api.ts   │  │   main.ts   │            │
│  │             │  │             │  │             │            │
│  │ • runtime.ts│  │ (Fastify)   │  │ (Entry)     │            │
│  │ • executor  │  │             │  │             │            │
│  │ • pipeline  │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

#### 3.2.1 Agent Layer (`agents/`)

**Purpose**: Define and implement AI agents with tools

**Key Files**:
- `types.ts`: Core type definitions (Agent, Tool, Context)
- `builtin.ts`: Implementation of all 21 agents
- `registry.ts`: Agent registration and lookup

**Responsibilities**:
- Define agent behaviors (instructions, tools, models)
- Implement tool functions (e.g., `createPrd`, `designArchitecture`)
- Manage agent metadata

#### 3.2.2 Communication Layer (`comm/`)

**Purpose**: Enable reliable message passing between agents

**Key Files**:
- `schemas.ts`: Message envelope and payload types
- `bus.ts`: Message bus abstraction (memory/Redis/PubSub)
- `router.ts`: Message routing and retry logic
- `debate.ts`: Multi-agent debate coordination

**Responsibilities**:
- Route messages to correct agents
- Ensure idempotency (duplicate detection)
- Manage debates (proposal → critique → decision)
- Handle retries with exponential backoff

#### 3.2.3 State Layer (`state/`)

**Purpose**: Manage session state and artifacts

**Key Files**:
- `store.ts`: State store interface and implementation
- `schemas.ts`: Zod schemas for validation

**Responsibilities**:
- Store/retrieve artifacts (PRD, architecture, code, etc.)
- Validate data with Zod schemas
- Provide CAS (Compare-And-Swap) for concurrency
- Generate snapshots for export

#### 3.2.4 Orchestration Layer (`orchestration/`)

**Purpose**: Execute multi-step pipelines

**Key Files**:
- `runtime.ts`: Main orchestration entry point
- `executor.ts`: Step execution with retry/circuit breaker
- `pipeline.ts`: Pipeline definition (5 stages)

**Responsibilities**:
- Execute agents in correct order
- Handle failures gracefully
- Collect metrics and timing
- Provide rollback capabilities

#### 3.2.5 API Layer (`api.ts`)

**Purpose**: Expose HTTP API with Fastify

**Endpoints**:
- `POST /api/agent-team/run`: Execute pipeline from prompt
- `GET /api/agents`: List all agents
- `GET /health`: Health check
- `GET /metrics`: Prometheus metrics

**Responsibilities**:
- Request validation
- Error handling
- Logging with correlation IDs
- Response formatting

---

## 4. Agent Architecture

### 4.1 Agent Definition

Each agent is defined by:

```typescript
interface Agent {
  name: string;                  // Unique identifier
  model: ModelConfig;            // AI model (Gemini/Claude/GPT-4)
  description: string;           // What the agent does
  instruction: string;           // System prompt (Arabic/English)
  tools: AgentTool[];           // Available tools
  output_key?: string;          // Where to store final output
  sub_agents?: Agent[];         // Hierarchical delegation
}
```

### 4.2 Agent Lifecycle

```
┌───────────────┐
│  Agent        │
│  Registered   │
└───────┬───────┘
        │
        ↓
┌───────────────┐
│  Message      │
│  Received     │
└───────┬───────┘
        │
        ↓
┌───────────────┐
│  Validate     │
│  Message      │
└───────┬───────┘
        │
        ↓
┌───────────────┐
│  Execute      │
│  Tool         │
└───────┬───────┘
        │
        ↓
┌───────────────┐
│  Update       │
│  State        │
└───────┬───────┘
        │
        ↓
┌───────────────┐
│  Send         │
│  Response     │
└───────────────┘
```

### 4.3 Tool Pattern

Tools are typed functions that agents invoke:

```typescript
type AgentTool<TArgs, TReturn> = (
  args: TArgs,
  context: ToolContext
) => Promise<TReturn>;

interface ToolContext {
  state: SessionState;          // Shared state
  agent_name: string;           // Who is calling
  stateController?: StateController; // Advanced state ops
}
```

**Example Tool**:

```typescript
const createPrd: AgentTool<
  { projectIdea: string },
  { status: string; prd: PRDDocument }
> = async (args, context) => {
  // 1. Extract inputs
  const { projectIdea } = args;
  
  // 2. Generate PRD
  const prd: PRDDocument = {
    document_type: "Product Requirements Document",
    version: "1.0",
    created_at: new Date().toISOString(),
    // ... full PRD structure
  };
  
  // 3. Store in shared state
  context.state.prd_document = prd;
  
  // 4. Return result
  return { status: "success", prd };
};
```

### 4.4 The 21 Agents

| # | Agent | Layer | Model | Key Tools |
|---|-------|-------|-------|-----------|
| 1 | **Awsa** (Team Leader) | Orchestration | Gemini 2.5 Pro | analyzeRequest, createExecutionPlan |
| 2 | **Kasya** (Product Manager) | Strategy | Claude Sonnet 4 | createPrd, validateMarketFit |
| 3 | **Amira** (Architect) | Design | Gemini 2.5 Pro | designArchitecture, designDatabaseSchema |
| 4 | **Salwa** (Software Engineer) | Execution | Gemini 2.5 Pro | generateSourceCode, debugCode |
| 5 | **Samra** (Data Analyst) | Execution | Claude Sonnet 4 | createDashboard, analyzeDataModel |
| 6 | **DevOps Engineer** | Operations | Gemini 2.5 Pro | setupCICD, configureInfrastructure |
| 7 | **QA Engineer** | Quality | Claude Sonnet 4 | generateTestSuites, analyzeCoverage |
| 8 | **AppSec Engineer** | Security | Gemini 2.5 Pro | performSecurityAudit, configureSecurity |
| 9 | **API Integrator** | Integration | Gemini 2.5 Pro | generateOpenApiSpec, runContractTests |
| 10 | **Performance Engineer** | Quality | Gemini 2.5 Pro | profilePerformance, optimizeAssets |
| 11 | **UX/UI Designer** | Design | Claude Sonnet 4 | createDesignSystem, auditAccessibility |
| 12 | **Prompt Architect** | Execution | Claude Sonnet 4 | designPromptTemplate, implementGuardrails |
| 13 | **Knowledge Curator** | Data | Gemini 2.5 Pro | ingestDataSource, deduplicateContent |
| 14 | **Observability Monitor** | Operations | Gemini 2.5 Pro | setupObservability, configureAlerts |
| 15 | **Release Manager** | Operations | Claude Sonnet 4 | manageVersion, setupFeatureFlags |
| 16 | **Privacy Officer** | Governance | Claude Sonnet 4 | classifyData, auditCompliance |
| 17 | **i18n Specialist** | Experience | Gemini 2.5 Pro | setupI18n, manageTranslations |
| 18 | **Documentation Lead** | Experience | Claude Sonnet 4 | generateDocumentation, createExamples |
| 19 | **FinOps Analyst** | Governance | Gemini 2.5 Pro | analyzeCloudCosts, optimizeResources |
| 20 | **Retrieval Evaluator** | Data | Gemini 2.5 Pro | evaluateRetrievalQuality, optimizeRAG |
| 21 | **Incident Commander** | Operations | Claude Sonnet 4 | runIncidentWorkflow, generatePostmortem |

---

## 5. Communication Protocol

### 5.1 Message Envelope

All messages follow a strict envelope format:

```typescript
interface MessageEnvelope {
  id: ULID;                     // Unique message ID
  kind: MessageKind;            // TASK | TOOL_CALL | DEBATE_*
  ts: number;                   // Timestamp (epoch ms)
  from: string;                 // Sender agent name
  to: string;                   // Target agent or topic
  correlation_id?: ULID;        // Request/response linking
  causation_id?: ULID;          // Parent event ID
  topic: string;                // Routing topic
  payload: unknown;             // Typed payload
  qos: QoS;                     // Quality of Service
  sig: Signature;               // HMAC signature
}
```

### 5.2 Message Types

| Type | Purpose | Payload |
|------|---------|---------|
| `TASK` | Execute a high-level task | `{ task, input_key, output_key, params }` |
| `TOOL_CALL` | Invoke specific tool | `{ tool_name, args, output_key }` |
| `DEBATE_PROPOSAL` | Propose a solution | `{ topic, proposal, score_rubric }` |
| `DEBATE_CRITIQUE` | Critique a proposal | `{ proposal_id, pros, cons, risk_score }` |
| `DEBATE_DECISION` | Leader's final decision | `{ decided_proposal_id, rationale }` |
| `ERROR` | Error response | `{ code, message, details }` |

### 5.3 Quality of Service (QoS)

```typescript
interface QoS {
  ttl_ms: number;               // Time-to-live
  retry: {
    max_attempts: number;       // Max retry count
    backoff_ms: number;         // Initial backoff
    factor: number;             // Exponential factor
  };
  sla_ms: number;               // Target latency
}
```

### 5.4 Message Flow

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Agent A │                    │  Router │                    │ Agent B │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │  1. Send Message             │                              │
     ├─────────────────────────────>│                              │
     │     (with HMAC signature)    │                              │
     │                              │                              │
     │                              │  2. Validate Signature       │
     │                              ├──────────────┐               │
     │                              │              │               │
     │                              │<─────────────┘               │
     │                              │                              │
     │                              │  3. Check Idempotency        │
     │                              ├──────────────┐               │
     │                              │              │               │
     │                              │<─────────────┘               │
     │                              │                              │
     │                              │  4. Route Message            │
     │                              ├─────────────────────────────>│
     │                              │                              │
     │                              │                              │  5. Execute
     │                              │                              ├────────┐
     │                              │                              │        │
     │                              │                              │<───────┘
     │                              │                              │
     │                              │  6. Send Response            │
     │                              │<─────────────────────────────┤
     │                              │                              │
     │  7. Deliver Response         │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

### 5.5 Debate Mechanism

For critical decisions, agents engage in structured debates:

```
┌──────────────┐
│  Team Leader │
│  (Awsa)      │
└──────┬───────┘
       │
       │  1. Initiate Debate: "Choose architecture style"
       ↓
┌──────────────────────────────────────────────┐
│         Debate Coordinator                   │
├──────────────────────────────────────────────┤
│  Proposals:                                  │
│  - Microservices (Architect)                 │
│  - Monolith Modular (Engineer)               │
│  - Serverless (DevOps)                       │
└──────────────────────────────────────────────┘
       │
       │  2. Request Critiques
       ↓
┌──────────────────────────────────────────────┐
│         Critiques                            │
├──────────────────────────────────────────────┤
│  Microservices:                              │
│    Pros: Scalable, independent deploy        │
│    Cons: Complex, high ops overhead          │
│    Risk: 0.6                                 │
│                                              │
│  Monolith Modular:                           │
│    Pros: Simple, easy debug                  │
│    Cons: Scaling challenges                  │
│    Risk: 0.3                                 │
│                                              │
│  Serverless:                                 │
│    Pros: Auto-scale, pay-per-use             │
│    Cons: Cold starts, vendor lock-in         │
│    Risk: 0.5                                 │
└──────────────────────────────────────────────┘
       │
       │  3. Score Proposals
       ↓
┌──────────────────────────────────────────────┐
│         Scoring                              │
├──────────────────────────────────────────────┤
│  Monolith Modular: 0.87                      │
│  Serverless: 0.73                            │
│  Microservices: 0.65                         │
└──────────────────────────────────────────────┘
       │
       │  4. Team Leader Decides
       ↓
┌──────────────────────────────────────────────┐
│         Decision                             │
├──────────────────────────────────────────────┤
│  Chosen: Monolith Modular                    │
│  Rationale: Best balance of simplicity,      │
│             maintainability, and low risk    │
│  Directives: Implement with clear module     │
│              boundaries, prepare for future  │
│              extraction if needed            │
└──────────────────────────────────────────────┘
```

---

## 6. State Management

### 6.1 State Store Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     StateController                             │
│  High-level API for agents                                      │
│  • write(key, value, updatedBy)                                 │
│  • read(key)                                                     │
│  • cas(key, mutator, updatedBy)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     MemoryStateStore                            │
│  In-memory implementation of StateStore interface               │
│  • get<T>(key): Artifact<T> | null                              │
│  • set<T>(key, value, opts): Artifact<T>                        │
│  • merge<T>(key, patch, opts): Artifact<T>                      │
│  • delete(key, expectedEtag?)                                   │
│  • list(): ArtifactMeta[]                                       │
│  • snapshot(redact?): StateSnapshot                             │
│  • clear()                                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     In-Memory Storage                           │
│  Map<StateKey, Artifact>                                        │
│                                                                 │
│  StateKey Examples:                                             │
│  • prd_document → PRDDocument                                   │
│  • system_architecture → SystemArchitecture                     │
│  • database_schema → DatabaseSchema                             │
│  • generated_code → Dict (complex nested)                       │
│  • security_audit → SecurityAudit                               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Artifact Structure

```typescript
interface Artifact<T> {
  id: string;                   // Stable UUID
  key: StateKey;                // Canonical key
  version: number;              // Optimistic concurrency control
  updated_at: string;           // ISO timestamp
  updated_by: string;           // Agent name
  etag: string;                 // SHA-256 hash (value + version)
  schema_ref?: string;          // Schema reference
  size_bytes: number;           // Payload size
  value: T;                     // Actual data
}
```

### 6.3 State Keys & Schemas

| State Key | Schema | Producer Agent | Description |
|-----------|--------|----------------|-------------|
| `prd_document` | `PRDDocument` | Product Manager | Requirements document |
| `system_architecture` | `SystemArchitecture` | Architect | System design |
| `database_schema` | `DatabaseSchema` | Architect | Database tables & relations |
| `generated_code` | `Dict` (no schema) | Software Engineer | Source code files |
| `test_suites` | `TestSuites` | QA Engineer | Unit/Integration/E2E tests |
| `security_audit` | `SecurityAudit` | AppSec Engineer | Security findings |
| `cicd_pipeline` | `CicdPipeline` | DevOps Engineer | CI/CD configuration |
| `openapi_spec` | `OpenApiSpec` | API Integrator | API contracts |

### 6.4 Concurrency Control

**Compare-And-Swap (CAS)**:

```typescript
// Read current value
const current = await store.get("prd_document");

// Modify
const updated = { ...current.value, version: "2.0" };

// Write only if ETag matches (no concurrent modifications)
await store.set("prd_document", updated, {
  expectedEtag: current.etag,
  updatedBy: "product_manager_kasya"
});
```

If another agent modified the state in between, the write fails with `ETAG_MISMATCH`.

### 6.5 State Snapshots

Snapshots capture the full session state for export:

```typescript
interface StateSnapshot {
  version: number;              // Global snapshot version
  taken_at: string;             // ISO timestamp
  entries: ArtifactMeta[];      // Metadata for all artifacts
  data: Dict<unknown>;          // Key → value mapping
}

// Export snapshot (with secret redaction)
const snapshot = await store.snapshot(redact: true);

// Contains all artifacts:
// {
//   "prd_document": { ... },
//   "system_architecture": { ... },
//   "generated_code": { ... },
//   ...
// }
```

---

## 7. Orchestration Pipeline

### 7.1 Pipeline Stages

The system executes a **5-stage pipeline**:

```
┌──────────────────────────────────────────────────────────────┐
│                      STAGE 1: ASSEMBLE                       │
│  Gather requirements and design architecture                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Create PRD  │→ │   Design     │→ │   Design     │       │
│  │  (Kasya)     │  │ Architecture │  │  Database    │       │
│  │              │  │  (Amira)     │  │  (Amira)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                       STAGE 2: GRADE                         │
│  Evaluate quality and security                               │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Security    │→ │   Generate   │                          │
│  │  Audit       │  │   Test       │                          │
│  │  (AppSec)    │  │   Suites     │                          │
│  │              │  │   (QA)       │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                        STAGE 3: MIX                          │
│  Implement and integrate                                     │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Generate    │→ │   OpenAPI    │                          │
│  │  Source Code │  │   Spec       │                          │
│  │  (Salwa)     │  │  (API Integr)│                          │
│  │              │  │              │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                       STAGE 4: RENDER                        │
│  Prepare for deployment                                      │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Configure   │→ │   Setup      │                          │
│  │  Infra       │  │   CI/CD      │                          │
│  │  (DevOps)    │  │  (DevOps)    │                          │
│  │              │  │              │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                       STAGE 5: EXPORT                        │
│  Finalize and optimize                                       │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Coverage    │→ │   FinOps     │                          │
│  │  Analysis    │  │   Costing    │                          │
│  │  (QA)        │  │  (FinOps)    │                          │
│  │              │  │              │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Step Execution

Each step follows this pattern:

```
┌───────────────┐
│  Receive      │
│  Step Spec    │
└───────┬───────┘
        │
        ↓
┌───────────────┐      ┌────────────────┐
│  Check        │─NO──>│  Open Circuit  │──> FAIL