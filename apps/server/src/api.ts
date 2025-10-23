// ═══════════════════════════════════════════════════════════════════════════════
// API Layer - Fastify HTTP Server with Routes
// ═══════════════════════════════════════════════════════════════════════════════

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { OrchestrationRuntime } from "./orchestration/runtime.js";
import { exportRegistry } from "./agents/registry.js";

/**
 * Request body schema for /api/agent-team/run endpoint
 */
interface RunPipelineRequest {
  Body: {
    prompt: string;
    options?: {
      debug?: boolean;
      timeout?: number;
      agents?: string[];
    };
  };
}

/**
 * Request params for /api/projects/:id endpoint
 */
interface ProjectByIdRequest {
  Params: {
    id: string;
  };
}

/**
 * Builds and configures the Fastify application
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
                colorize: true,
              },
            }
          : undefined,
    },
    requestIdLogLabel: "reqId",
    disableRequestLogging: false,
    trustProxy: true,
    ajv: {
      customOptions: {
        coerceTypes: false,
      },
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Global Hooks
  // ────────────────────────────────────────────────────────────────────────────

  // Add correlation ID to all responses
  app.addHook("onRequest", async (request, reply) => {
    reply.header("X-Request-ID", request.id);
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    if ((error as any).code === "FST_ERR_VALIDATION" && Array.isArray((error as any).validation)) {
      const violation = (error as any).validation[0];
      let message = error.message;
      if (violation.keyword === "required") {
        const missing = violation.params?.missingProperty ?? "field";
        message = `${missing} is required`;
      } else if (violation.keyword === "minLength") {
        const limit = violation.params?.limit ?? 0;
        if (typeof (request.body as any)?.prompt !== "string") {
          message = "prompt must be a string";
        } else {
          message = `prompt must be at least ${limit} characters`;
        }
      } else if (violation.keyword === "type") {
        const field = violation.instancePath?.replace(/^\//, "") || violation.params?.missingProperty || "prompt";
        message = `${field} must be a string`;
      }

      return reply.status(400).send({
        error: {
          message,
          statusCode: 400,
          reqId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    request.log.error(
      {
        err: error,
        reqId: request.id,
        url: request.url,
        method: request.method,
      },
      "Request error"
    );

    const statusCode = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : error.message;

    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
        reqId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Health & Status Routes
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Health check endpoint
   * GET /health
   */
  app.get("/health", async (request, reply) => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
  });

  /**
   * Readiness probe
   * GET /ready
   */
  app.get("/ready", async (request, reply) => {
    // Check if critical services are ready
    // For now, always return ready
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * Agent registry status
   * GET /api/agents
   */
  app.get("/api/agents", async (request, reply) => {
    const registry = exportRegistry();
    return {
      status: "success",
      data: registry,
    };
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Main Pipeline Execution Route
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Run the full multi-agent pipeline
   * POST /api/agent-team/run
   *
   * Request Body:
   * {
   *   "prompt": "وصف المشروع بلغة طبيعية",
   *   "options": {
   *     "debug": false,
   *     "timeout": 300000,
   *     "agents": ["agent1", "agent2"]  // optional: specific agents only
   *   }
   * }
   */
  app.post<RunPipelineRequest>(
    "/api/agent-team/run",
    {
      schema: {
        body: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: {
              type: "string",
              minLength: 10,
              maxLength: 5000,
              description: "Natural language description of the project",
            },
            options: {
              type: "object",
              properties: {
                debug: { type: "boolean", default: false },
                timeout: { type: "number", minimum: 1000, maximum: 600000, default: 300000 },
                agents: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional: specific agents to run",
                },
              },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              result: { type: "object", additionalProperties: true },
              snapshot: { type: "object", additionalProperties: true },
              metadata: { type: "object", additionalProperties: true },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { prompt, options } = request.body || ({} as any);

        // Validate prompt
        if (!prompt || typeof prompt !== "string") {
          return reply.code(400).send({
            error: {
              message: "prompt is required and must be a string",
              field: "prompt",
            },
          });
        }

        if (prompt.trim().length < 10) {
          return reply.code(400).send({
            error: {
              message: "prompt must be at least 10 characters",
              field: "prompt",
            },
          });
        }

        request.log.info(
          {
            prompt: prompt.substring(0, 100),
            options,
          },
          "Starting agent pipeline execution"
        );

        // Create runtime and execute pipeline
        const runtime = new OrchestrationRuntime();
        const startTime = Date.now();

        const { result, snapshot } = await runtime.runFromPrompt(prompt);

        const executionTime = Date.now() - startTime;

        request.log.info(
          {
            success: result.ok,
            executionTime,
            stepsCompleted: result.stepResults.length,
          },
          "Pipeline execution completed"
        );

        return {
          result,
          snapshot,
          metadata: {
            executionTime,
            timestamp: new Date().toISOString(),
            reqId: request.id,
          },
        };
      } catch (error: any) {
        request.log.error(
          {
            err: error,
            prompt: request.body.prompt?.substring(0, 100),
          },
          "Pipeline execution failed"
        );

        return reply.code(500).send({
          error: {
            message: "Pipeline execution failed",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
            reqId: request.id,
          },
        });
      }
    }
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Projects API (CRUD)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * List all projects
   * GET /api/projects
   */
  app.get("/api/projects", async (request, reply) => {
    // TODO: Implement with database
    return {
      status: "success",
      data: {
        projects: [],
        total: 0,
        page: 1,
        perPage: 20,
      },
    };
  });

  /**
   * Get project by ID
   * GET /api/projects/:id
   */
  app.get<ProjectByIdRequest>("/api/projects/:id", async (request, reply) => {
    const { id } = request.params;

    // TODO: Implement with database
    return reply.code(404).send({
      error: {
        message: "Project not found",
        projectId: id,
      },
    });
  });

  /**
   * Create new project
   * POST /api/projects
   */
  app.post("/api/projects", async (request, reply) => {
    // TODO: Implement with database
    return reply.code(201).send({
      status: "success",
      data: {
        id: "project-" + Date.now(),
        created_at: new Date().toISOString(),
      },
    });
  });

  /**
   * Update project
   * PATCH /api/projects/:id
   */
  app.patch<ProjectByIdRequest>("/api/projects/:id", async (request, reply) => {
    const { id } = request.params;

    // TODO: Implement with database
    return {
      status: "success",
      data: {
        id,
        updated_at: new Date().toISOString(),
      },
    };
  });

  /**
   * Delete project
   * DELETE /api/projects/:id
   */
  app.delete<ProjectByIdRequest>("/api/projects/:id", async (request, reply) => {
    const { id } = request.params;

    // TODO: Implement with database
    return reply.code(204).send();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Agent-specific Routes
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Get specific agent details
   * GET /api/agents/:name
   */
  app.get<{ Params: { name: string } }>(
    "/api/agents/:name",
    async (request, reply) => {
      const { name } = request.params;
      const registry = exportRegistry();
      const agent = registry.agents.find((a) => a.name === name);

      if (!agent) {
        return reply.code(404).send({
          error: {
            message: "Agent not found",
            agentName: name,
          },
        });
      }

      return {
        status: "success",
        data: agent,
      };
    }
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Metrics & Monitoring
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Prometheus-compatible metrics endpoint
   * GET /metrics
   */
  app.get("/metrics", async (request, reply) => {
    // TODO: Implement prometheus metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    reply.type("text/plain");
    return `
# HELP agent_team_uptime_seconds Server uptime in seconds
# TYPE agent_team_uptime_seconds gauge
agent_team_uptime_seconds ${uptime}

# HELP agent_team_memory_heap_used_bytes Memory heap used in bytes
# TYPE agent_team_memory_heap_used_bytes gauge
agent_team_memory_heap_used_bytes ${memoryUsage.heapUsed}

# HELP agent_team_memory_heap_total_bytes Memory heap total in bytes
# TYPE agent_team_memory_heap_total_bytes gauge
agent_team_memory_heap_total_bytes ${memoryUsage.heapTotal}

# HELP agent_team_memory_rss_bytes Resident set size in bytes
# TYPE agent_team_memory_rss_bytes gauge
agent_team_memory_rss_bytes ${memoryUsage.rss}
    `.trim();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 404 Handler
  // ────────────────────────────────────────────────────────────────────────────

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: {
        message: "Route not found",
        path: request.url,
        method: request.method,
      },
    });
  });

  return app;
}
