// ═══════════════════════════════════════════════════════════════════════════════
// Orchestration Runtime - Simplified Pipeline Execution
// ═══════════════════════════════════════════════════════════════════════════════

import { MemoryStateStore, StateController } from "../state/store.js";

/**
 * Result of a single step execution
 */
interface StepResult {
  id: string;
  ok: boolean;
  attemptCount: number;
  startedAt: string;
  finishedAt: string;
  error?: string;
  elapsedMs: number;
}

/**
 * Result of the full pipeline execution
 */
export interface RunResult {
  ok: boolean;
  stepResults: StepResult[];
  startedAt: string;
  finishedAt: string;
  elapsedMs: number;
}

/**
 * Options for OrchestrationRuntime
 */
export interface OrchestrationRuntimeOptions {
  store?: MemoryStateStore;
}

/**
 * OrchestrationRuntime - Executes the multi-agent pipeline
 *
 * This is a simplified version that executes the core agents in sequence:
 * 1. Team Leader (analyzes request)
 * 2. Product Manager (creates PRD)
 * 3. Architect (designs system)
 * 4. Software Engineer (generates code)
 * 5. DevOps (configures infrastructure)
 * 6. QA (generates tests)
 * 7. AppSec (security audit)
 * 8. API Integrator (OpenAPI spec)
 */
export class OrchestrationRuntime {
  private controller: StateController;
  private store: MemoryStateStore;

  constructor(opts: OrchestrationRuntimeOptions = {}) {
    this.store = opts.store ?? new MemoryStateStore();
    this.controller = new StateController(this.store);
  }

  /**
   * Execute the full pipeline from a natural language prompt
   */
  async runFromPrompt(prompt: string): Promise<{ result: RunResult; snapshot: any }> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];

    try {
      // Initialize global session state
      (globalThis as any).__SESSION_STATE__ = {};

      // Step 1: Analyze Request (Team Leader)
      stepResults.push(await this.executeStep(
        "analyze_request",
        "team_leader_awsa",
        "analyzeUserRequest",
        { request: prompt }
      ));

      // Step 2: Create PRD (Product Manager)
      stepResults.push(await this.executeStep(
        "create_prd",
        "product_manager_kasya",
        "createPrd",
        { projectIdea: prompt }
      ));

      // Step 3: Design Architecture (Architect)
      stepResults.push(await this.executeStep(
        "design_architecture",
        "architect_amira",
        "designSystemArchitecture",
        { prd: (globalThis as any).__SESSION_STATE__.prd_document }
      ));

      // Step 4: Design Database Schema (Architect)
      stepResults.push(await this.executeStep(
        "design_database",
        "architect_amira",
        "designDatabaseSchema",
        { requirements: {} }
      ));

      // Step 5: Generate Code (Software Engineer)
      stepResults.push(await this.executeStep(
        "generate_code",
        "software_engineer_salwa",
        "generateSourceCode",
        {
          architecture: (globalThis as any).__SESSION_STATE__.system_architecture,
          schema: (globalThis as any).__SESSION_STATE__.database_schema
        }
      ));

      // Step 6: Setup CI/CD (DevOps)
      stepResults.push(await this.executeStep(
        "setup_cicd",
        "devops_engineer",
        "setupCICD",
        { repoUrl: "https://github.com/example/repo.git" }
      ));

      // Step 7: Configure Infrastructure (DevOps)
      stepResults.push(await this.executeStep(
        "configure_infrastructure",
        "devops_engineer",
        "configureInfrastructure",
        { requirements: {} }
      ));

      // Step 8: Generate Test Suites (QA)
      stepResults.push(await this.executeStep(
        "generate_tests",
        "qa_engineer",
        "generateTestSuites",
        { codebase: (globalThis as any).__SESSION_STATE__.generated_code }
      ));

      // Step 9: Analyze Coverage (QA)
      stepResults.push(await this.executeStep(
        "analyze_coverage",
        "qa_engineer",
        "analyzeCoverage",
        { coverageReport: {} }
      ));

      // Step 10: Security Audit (AppSec)
      stepResults.push(await this.executeStep(
        "security_audit",
        "appsec_engineer",
        "performSecurityAudit",
        { codebase: (globalThis as any).__SESSION_STATE__.generated_code }
      ));

      // Step 11: Configure Security (AppSec)
      stepResults.push(await this.executeStep(
        "configure_security",
        "appsec_engineer",
        "configureSecurity",
        { requirements: {} }
      ));

      // Step 12: Generate OpenAPI Spec (API Integrator)
      stepResults.push(await this.executeStep(
        "generate_openapi",
        "api_contracts_integrator",
        "generateOpenApiSpec",
        { services: ["core"] }
      ));

      const finishedAt = new Date();
      const elapsedMs = finishedAt.getTime() - startTime;

      // Get snapshot of all artifacts
      const snapshot = await this.store.snapshot(true);

      return {
        result: {
          ok: stepResults.every(s => s.ok),
          stepResults,
          startedAt: new Date(startTime).toISOString(),
          finishedAt: finishedAt.toISOString(),
          elapsedMs
        },
        snapshot
      };

    } catch (error: any) {
      const finishedAt = new Date();
      const elapsedMs = finishedAt.getTime() - startTime;

      return {
        result: {
          ok: false,
          stepResults,
          startedAt: new Date(startTime).toISOString(),
          finishedAt: finishedAt.toISOString(),
          elapsedMs
        },
        snapshot: await this.store.snapshot(true)
      };
    }
  }

  /**
   * Execute a single step (agent tool call)
   */
  private async executeStep(
    id: string,
    agentName: string,
    toolName: string,
    args: any
  ): Promise<StepResult> {
    const startTime = Date.now();
    const startedAt = new Date(startTime).toISOString();

    try {
      console.log(`🔄 Executing step: ${id} (${agentName}.${toolName})`);

      // Dynamically import and execute the tool
      const { getAgent } = await import("../agents/registry.js");
      const agent = getAgent(agentName);

      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }

      const tool = agent.tools?.find((t: any) => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${agentName}.${toolName}`);
      }

      // Execute the tool
      const context = {
        state: (globalThis as any).__SESSION_STATE__,
        agent_name: agentName,
        stateController: this.controller
      };

      await tool(args, context);

      const finishedAt = new Date();
      const elapsedMs = finishedAt.getTime() - startTime;

      console.log(`✅ Step completed: ${id} (${elapsedMs}ms)`);

      return {
        id,
        ok: true,
        attemptCount: 1,
        startedAt,
        finishedAt: finishedAt.toISOString(),
        elapsedMs
      };

    } catch (error: any) {
      const finishedAt = new Date();
      const elapsedMs = finishedAt.getTime() - startTime;

      console.error(`❌ Step failed: ${id} - ${error.message}`);

      return {
        id,
        ok: false,
        attemptCount: 1,
        startedAt,
        finishedAt: finishedAt.toISOString(),
        error: error.message,
        elapsedMs
      };
    }
  }

  /**
   * Get the state controller for advanced state management
   */
  get stateController(): StateController {
    return this.controller;
  }
}
