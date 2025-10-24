// ═══════════════════════════════════════════════════════════════════════════════
// API Tests - Integration Tests for Fastify API
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/api.js";
import type { FastifyInstance } from "fastify";

describe("Agent Team API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Health & Status Tests
  // ────────────────────────────────────────────────────────────────────────────

  describe("GET /health", () => {
    it("should return healthy status", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("healthy");
      expect(body).toHaveProperty("timestamp");
      expect(body).toHaveProperty("uptime");
      expect(body).toHaveProperty("version");
    });
  });

  describe("GET /ready", () => {
    it("should return readiness status", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/ready",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ready).toBe(true);
      expect(body).toHaveProperty("timestamp");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Agent Registry Tests
  // ────────────────────────────────────────────────────────────────────────────

  describe("GET /api/agents", () => {
    it("should return agent registry", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/agents",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveProperty("total");
      expect(body.data).toHaveProperty("agents");
      expect(Array.isArray(body.data.agents)).toBe(true);
      expect(body.data.total).toBeGreaterThan(0);
    });
  });

  describe("GET /api/agents/:name", () => {
    it("should return specific agent details", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/agents/product_manager_kasya",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("success");
      expect(body.data.name).toBe("product_manager_kasya");
      expect(body.data).toHaveProperty("description");
      expect(body.data).toHaveProperty("model");
    });

    it("should return 404 for non-existent agent", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/agents/non_existent_agent",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.error.message).toBe("Agent not found");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Pipeline Execution Tests
  // ────────────────────────────────────────────────────────────────────────────

  describe("POST /api/agent-team/run", () => {
    it("should execute pipeline from prompt successfully", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agent-team/run",
        payload: {
          prompt: "تطبيق ويب بسيط لإدارة المهام اليومية",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();

      // Check result structure
      expect(body).toHaveProperty("result");
      expect(body.result).toHaveProperty("ok");
      expect(body.result).toHaveProperty("stepResults");
      expect(body.result).toHaveProperty("elapsedMs");

      // Check snapshot structure
      expect(body).toHaveProperty("snapshot");
      expect(body.snapshot).toHaveProperty("data");

      // Verify critical artifacts were created
      const artifacts = Object.keys(body.snapshot.data);
      expect(artifacts).toContain("prd_document");
      expect(artifacts).toContain("system_architecture");
      expect(artifacts).toContain("database_schema");
      expect(artifacts).toContain("generated_code");

      // Check metadata
      expect(body).toHaveProperty("metadata");
      expect(body.metadata).toHaveProperty("executionTime");
      expect(body.metadata).toHaveProperty("timestamp");
    }, 30000); // 30 second timeout for full pipeline

    it("should return 400 for missing prompt", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agent-team/run",
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error.message).toContain("prompt");
    });

    it("should return 400 for prompt too short", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agent-team/run",
        payload: {
          prompt: "short",
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error.message).toContain("at least 10 characters");
    });

    it("should return 400 for invalid prompt type", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agent-team/run",
        payload: {
          prompt: 123,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error.message).toContain("string");
    });

    it("should handle Arabic prompt correctly", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agent-team/run",
        payload: {
          prompt: "نظام إدارة محتوى مع مصادقة المستخدمين ولوحة تحكم إدارية",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.result.ok).toBe(true);
      expect(body.snapshot.data.prd_document).toBeDefined();
    }, 30000);

    it("should handle English prompt correctly", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agent-team/run",
        payload: {
          prompt: "simple task management web application with authentication",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.result.ok).toBe(true);
    }, 30000);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Projects API Tests (Placeholder - TODO: Implement with DB)
  // ────────────────────────────────────────────────────────────────────────────

  describe("GET /api/projects", () => {
    it("should return empty projects list", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/projects",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("success");
      expect(body.data.projects).toEqual([]);
      expect(body.data.total).toBe(0);
    });
  });

  describe("POST /api/projects", () => {
    it("should create new project", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/projects",
        payload: {
          title: "Test Project",
          prompt: "Test project description",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.status).toBe("success");
      expect(body.data).toHaveProperty("id");
      expect(body.data).toHaveProperty("created_at");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("should delete project", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/projects/test-id",
      });

      expect(res.statusCode).toBe(204);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Metrics Tests
  // ────────────────────────────────────────────────────────────────────────────

  describe("GET /metrics", () => {
    it("should return prometheus metrics", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/metrics",
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");

      const body = res.body;
      expect(body).toContain("agent_team_uptime_seconds");
      expect(body).toContain("agent_team_memory_heap_used_bytes");
      expect(body).toContain("agent_team_memory_heap_total_bytes");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error Handling Tests
  // ────────────────────────────────────────────────────────────────────────────

  describe("404 Handler", () => {
    it("should return 404 for non-existent routes", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/non-existent-route",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.error.message).toBe("Route not found");
      expect(body.error.path).toBe("/non-existent-route");
    });
  });

  describe("Request ID", () => {
    it("should include request ID in response headers", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(res.headers).toHaveProperty("x-request-id");
      expect(typeof res.headers["x-request-id"]).toBe("string");
    });
  });
});
