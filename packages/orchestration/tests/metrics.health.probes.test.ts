/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest";
import { Metrics } from "../src/metrics/Metrics.js";
import { Health } from "../src/health/Health.js";

describe("Metrics", () => {
  it("should increment counter", () => {
    const metrics = new Metrics();

    metrics.increment("requests");
    metrics.increment("requests");
    metrics.increment("requests", 3);

    expect(metrics.getCounter("requests")).toBe(5);
  });

  it("should track counter with tags", () => {
    const metrics = new Metrics();

    metrics.increment("http.requests", 1, { method: "GET", status: "200" });
    metrics.increment("http.requests", 1, { method: "POST", status: "200" });
    metrics.increment("http.requests", 1, { method: "GET", status: "200" });

    expect(metrics.getCounter("http.requests", { method: "GET", status: "200" })).toBe(2);
    expect(metrics.getCounter("http.requests", { method: "POST", status: "200" })).toBe(1);
  });

  it("should set and get gauge values", () => {
    const metrics = new Metrics();

    metrics.gauge("memory.usage", 1024);
    expect(metrics.getGauge("memory.usage")).toBe(1024);

    metrics.gauge("memory.usage", 2048);
    expect(metrics.getGauge("memory.usage")).toBe(2048);
  });

  it("should track gauge with tags", () => {
    const metrics = new Metrics();

    metrics.gauge("queue.size", 10, { queue: "tasks" });
    metrics.gauge("queue.size", 5, { queue: "events" });

    expect(metrics.getGauge("queue.size", { queue: "tasks" })).toBe(10);
    expect(metrics.getGauge("queue.size", { queue: "events" })).toBe(5);
  });

  it("should record success and failure metrics", () => {
    const metrics = new Metrics();

    metrics.increment("task.success", 1, { task: "generate" });
    metrics.increment("task.success", 1, { task: "generate" });
    metrics.increment("task.failure", 1, { task: "generate" });

    expect(metrics.getCounter("task.success", { task: "generate" })).toBe(2);
    expect(metrics.getCounter("task.failure", { task: "generate" })).toBe(1);
  });

  it("should get all recorded metrics", () => {
    const metrics = new Metrics();

    metrics.increment("counter1");
    metrics.gauge("gauge1", 42);
    metrics.increment("counter2", 1, { tag: "value" });

    const all = metrics.getAll();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it("should reset all metrics", () => {
    const metrics = new Metrics();

    metrics.increment("requests", 5);
    metrics.gauge("memory", 1024);

    metrics.reset();

    expect(metrics.getCounter("requests")).toBe(0);
    expect(metrics.getGauge("memory")).toBe(0);
    expect(metrics.getAll()).toHaveLength(0);
  });

  it("should limit metrics history to 1000 entries", () => {
    const metrics = new Metrics();

    // Record more than 1000 metrics
    for (let i = 0; i < 1500; i++) {
      metrics.increment("test.counter");
    }

    const all = metrics.getAll();
    expect(all.length).toBeLessThanOrEqual(1000);
  });
});

describe("Health", () => {
  it("should register and retrieve health checks", () => {
    const health = new Health();

    health.registerCheck("database", async () => ({
      status: "healthy",
      message: "Connected",
    }));

    const check = health.getCheck("database");
    expect(check).toBeDefined();
    expect(check?.name).toBe("database");
  });

  it("should update health check status", () => {
    const health = new Health();

    health.updateCheck("service", "healthy", "All good");
    let check = health.getCheck("service");
    expect(check?.status).toBe("healthy");
    expect(check?.message).toBe("All good");

    health.updateCheck("service", "degraded", "Slow response");
    check = health.getCheck("service");
    expect(check?.status).toBe("degraded");
    expect(check?.message).toBe("Slow response");
  });

  it("should report overall status as healthy when all checks pass", () => {
    const health = new Health();

    health.updateCheck("db", "healthy");
    health.updateCheck("cache", "healthy");
    health.updateCheck("queue", "healthy");

    expect(health.getOverallStatus()).toBe("healthy");
  });

  it("should report overall status as degraded when any check is degraded", () => {
    const health = new Health();

    health.updateCheck("db", "healthy");
    health.updateCheck("cache", "degraded");
    health.updateCheck("queue", "healthy");

    expect(health.getOverallStatus()).toBe("degraded");
  });

  it("should report overall status as unhealthy when any check is unhealthy", () => {
    const health = new Health();

    health.updateCheck("db", "healthy");
    health.updateCheck("cache", "degraded");
    health.updateCheck("queue", "unhealthy");

    expect(health.getOverallStatus()).toBe("unhealthy");
  });

  it("should report healthy status when no checks are registered", () => {
    const health = new Health();
    expect(health.getOverallStatus()).toBe("healthy");
  });

  it("should get all health checks", () => {
    const health = new Health();

    health.updateCheck("service1", "healthy");
    health.updateCheck("service2", "degraded");
    health.updateCheck("service3", "unhealthy");

    const all = health.getAllChecks();
    expect(all).toHaveLength(3);
    expect(all.map(c => c.name)).toContain("service1");
    expect(all.map(c => c.name)).toContain("service2");
    expect(all.map(c => c.name)).toContain("service3");
  });

  it("should include metadata in health checks", () => {
    const health = new Health();

    health.updateCheck("database", "healthy", "Connected", {
      host: "localhost",
      port: 5432,
      connections: 10,
    });

    const check = health.getCheck("database");
    expect(check?.metadata).toEqual({
      host: "localhost",
      port: 5432,
      connections: 10,
    });
  });

  it("should update timestamp on check updates", () => {
    const health = new Health();

    const before = Date.now();
    health.updateCheck("service", "healthy");
    const check = health.getCheck("service");

    expect(check?.timestamp).toBeGreaterThanOrEqual(before);
    expect(check?.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it("should reset all health checks", () => {
    const health = new Health();

    health.updateCheck("service1", "healthy");
    health.updateCheck("service2", "degraded");

    health.reset();

    expect(health.getAllChecks()).toHaveLength(0);
    expect(health.getOverallStatus()).toBe("healthy");
  });

  it("should implement readiness probe pattern", () => {
    const health = new Health();

    // Simulate startup: services not ready yet
    health.updateCheck("database", "unhealthy", "Connecting...");
    health.updateCheck("cache", "unhealthy", "Connecting...");

    expect(health.getOverallStatus()).toBe("unhealthy");

    // Services become ready
    health.updateCheck("database", "healthy", "Connected");
    health.updateCheck("cache", "healthy", "Connected");

    expect(health.getOverallStatus()).toBe("healthy");
  });

  it("should implement liveness probe pattern", () => {
    const health = new Health();

    // Initial healthy state
    health.updateCheck("app", "healthy", "Running");
    expect(health.getOverallStatus()).toBe("healthy");

    // App becomes unresponsive (deadlock, infinite loop, etc.)
    health.updateCheck("app", "unhealthy", "Not responding");
    expect(health.getOverallStatus()).toBe("unhealthy");
  });
});
