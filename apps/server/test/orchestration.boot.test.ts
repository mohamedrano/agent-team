import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bootstrap, shutdown, getAdapter, getOrchestrator } from "../src/orchestration.boot.js";

// Mock the orchestration imports
const mockCommAdapter = vi.fn();
const mockOrchestrator = vi.fn();

vi.mock("@agent-team/orchestration", () => ({
  CommAdapter: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockImplementation(() => {}),
  })),
  Orchestrator: vi.fn().mockImplementation((config) => ({
    config,
  })),
}));

describe("Orchestration Bootstrap", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.DEBUG;
  });

  afterEach(() => {
    process.env.DEBUG = originalEnv;
  });

  describe("bootstrap", () => {
    it("should bootstrap orchestration layer successfully", async () => {
      const result = await bootstrap();

      expect(result.adapter).toBeDefined();
      expect(result.orchestrator).toBeDefined();

      // Check that adapter was started
      expect(result.adapter.start).toHaveBeenCalled();

      // Check that orchestrator was created with correct config
      expect(result.orchestrator).toBeDefined();
    });

    it("should subscribe to orchestration topics", async () => {
      const result = await bootstrap();

      expect(result.adapter.subscribe).toHaveBeenCalledWith(
        "orchestration::request",
        expect.any(Function)
      );
    });

    it("should create orchestrator with emit and now functions", async () => {
      const result = await bootstrap();

      expect(result.orchestrator.config.emit).toBeDefined();
      expect(result.orchestrator.config.now).toBeDefined();
      expect(typeof result.orchestrator.config.now).toBe("function");
    });

    it("should handle DEBUG=true logging", async () => {
      process.env.DEBUG = "true";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await bootstrap();

      // Trigger an emit to test logging
      await result.orchestrator.config.emit({ type: "test_event", data: "test" });

      expect(consoleSpy).toHaveBeenCalledWith("[ORCH] test_event:", { type: "test_event", data: "test" });

      consoleSpy.mockRestore();
    });

    it("should not log when DEBUG is not true", async () => {
      process.env.DEBUG = "false";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await bootstrap();

      // Trigger an emit
      await result.orchestrator.config.emit({ type: "test_event", data: "test" });

      // Should not have logged the event
      expect(consoleSpy).not.toHaveBeenCalledWith("[ORCH] test_event:", expect.any(Object));

      consoleSpy.mockRestore();
    });

    it("should publish orchestration events to communication bus", async () => {
      const result = await bootstrap();

      const testEvent = { type: "decision_made", data: "test" };
      await result.orchestrator.config.emit(testEvent);

      expect(result.adapter.publish).toHaveBeenCalledWith(
        "orchestration::decision",
        testEvent,
        "orchestrator"
      );
    });

    it("should handle adapter start failure", async () => {
      const mockAdapterInstance = {
        start: vi.fn().mockRejectedValue(new Error("Adapter start failed")),
        stop: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn().mockImplementation(() => {}),
      };

      const { CommAdapter } = await import("@agent-team/orchestration");
      CommAdapter.mockImplementation(() => mockAdapterInstance);

      await expect(bootstrap()).rejects.toThrow("Adapter start failed");
    });
  });

  describe("shutdown", () => {
    it("should shutdown adapter when available", async () => {
      await bootstrap(); // Initialize adapter

      await shutdown();

      const adapter = getAdapter();
      expect(adapter?.stop).toHaveBeenCalled();
    });

    it("should handle shutdown when no adapter is initialized", async () => {
      await shutdown(); // Should not throw
      expect(true).toBe(true); // Just ensure no exception
    });
  });

  describe("getAdapter", () => {
    it("should return null when not bootstrapped", () => {
      expect(getAdapter()).toBeNull();
    });

    it("should return adapter after bootstrap", async () => {
      await bootstrap();
      expect(getAdapter()).not.toBeNull();
    });
  });

  describe("getOrchestrator", () => {
    it("should return null when not bootstrapped", () => {
      expect(getOrchestrator()).toBeNull();
    });

    it("should return orchestrator after bootstrap", async () => {
      await bootstrap();
      expect(getOrchestrator()).not.toBeNull();
    });
  });

  describe("orchestration request handling", () => {
    it("should handle orchestration requests", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await bootstrap();

      // Get the subscription callback
      const subscribeCall = result.adapter.subscribe.mock.calls.find(
        call => call[0] === "orchestration::request"
      );

      expect(subscribeCall).toBeDefined();

      const callback = subscribeCall![1];
      const testMessage = { payload: "test request" };

      await callback(testMessage);

      expect(consoleSpy).toHaveBeenCalledWith("[ORCH] Received request:", "test request");

      consoleSpy.mockRestore();
    });
  });

  describe("now function", () => {
    it("should provide current timestamp", async () => {
      const result = await bootstrap();

      const before = Date.now();
      const now = result.orchestrator.config.now();
      const after = Date.now();

      expect(now).toBeGreaterThanOrEqual(before);
      expect(now).toBeLessThanOrEqual(after);
    });
  });
});
