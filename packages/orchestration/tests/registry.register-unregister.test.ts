import { describe, it, expect } from "vitest";
import { AgentRegistry, type AgentMetadata } from "../src/registry/AgentRegistry.js";

describe("AgentRegistry - Register & Unregister", () => {
  it("should register and retrieve an agent", () => {
    const registry = new AgentRegistry();

    const agent: AgentMetadata = {
      id: "agent-1",
      name: "Test Agent",
      capabilities: ["coding", "testing"],
      status: "active",
      lastSeen: Date.now(),
    };

    registry.register(agent);

    const retrieved = registry.get("agent-1");
    expect(retrieved).toEqual(agent);
  });

  it("should unregister an agent", () => {
    const registry = new AgentRegistry();

    const agent: AgentMetadata = {
      id: "agent-1",
      name: "Test Agent",
      capabilities: ["coding"],
      status: "active",
      lastSeen: Date.now(),
    };

    registry.register(agent);
    expect(registry.get("agent-1")).toBeDefined();

    const unregistered = registry.unregister("agent-1");
    expect(unregistered).toBe(true);
    expect(registry.get("agent-1")).toBeUndefined();
  });

  it("should return false when unregistering non-existent agent", () => {
    const registry = new AgentRegistry();
    const unregistered = registry.unregister("non-existent");
    expect(unregistered).toBe(false);
  });

  it("should list all registered agents", () => {
    const registry = new AgentRegistry();

    const agents: AgentMetadata[] = [
      {
        id: "agent-1",
        name: "Agent 1",
        capabilities: ["coding"],
        status: "active",
        lastSeen: Date.now(),
      },
      {
        id: "agent-2",
        name: "Agent 2",
        capabilities: ["testing"],
        status: "inactive",
        lastSeen: Date.now(),
      },
    ];

    agents.forEach(agent => registry.register(agent));

    const all = registry.listAll();
    expect(all).toHaveLength(2);
    expect(all.map(a => a.id)).toContain("agent-1");
    expect(all.map(a => a.id)).toContain("agent-2");
  });

  it("should find agents by capability", () => {
    const registry = new AgentRegistry();

    const agents: AgentMetadata[] = [
      {
        id: "agent-1",
        name: "Agent 1",
        capabilities: ["coding", "testing"],
        status: "active",
        lastSeen: Date.now(),
      },
      {
        id: "agent-2",
        name: "Agent 2",
        capabilities: ["testing", "deployment"],
        status: "active",
        lastSeen: Date.now(),
      },
      {
        id: "agent-3",
        name: "Agent 3",
        capabilities: ["monitoring"],
        status: "active",
        lastSeen: Date.now(),
      },
    ];

    agents.forEach(agent => registry.register(agent));

    const testingAgents = registry.findByCapability("testing");
    expect(testingAgents).toHaveLength(2);
    expect(testingAgents.map(a => a.id)).toContain("agent-1");
    expect(testingAgents.map(a => a.id)).toContain("agent-2");

    const codingAgents = registry.findByCapability("coding");
    expect(codingAgents).toHaveLength(1);
    expect(codingAgents[0].id).toBe("agent-1");
  });

  it("should find available agents", () => {
    const registry = new AgentRegistry();

    const agents: AgentMetadata[] = [
      {
        id: "agent-1",
        name: "Agent 1",
        capabilities: ["coding"],
        status: "active",
        lastSeen: Date.now(),
      },
      {
        id: "agent-2",
        name: "Agent 2",
        capabilities: ["testing"],
        status: "busy",
        lastSeen: Date.now(),
      },
      {
        id: "agent-3",
        name: "Agent 3",
        capabilities: ["deployment"],
        status: "inactive",
        lastSeen: Date.now(),
      },
    ];

    agents.forEach(agent => registry.register(agent));

    const available = registry.findAvailable();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe("agent-1");
  });

  it("should update agent status and lastSeen", () => {
    const registry = new AgentRegistry();
    const initialTime = Date.now();

    const agent: AgentMetadata = {
      id: "agent-1",
      name: "Agent 1",
      capabilities: ["coding"],
      status: "active",
      lastSeen: initialTime,
    };

    registry.register(agent);

    // Wait a bit to ensure timestamp changes
    const beforeUpdate = Date.now();
    registry.updateStatus("agent-1", "busy");

    const updated = registry.get("agent-1");
    expect(updated?.status).toBe("busy");
    expect(updated?.lastSeen).toBeGreaterThanOrEqual(beforeUpdate);
  });

  it("should update heartbeat timestamp", () => {
    const registry = new AgentRegistry();
    const initialTime = Date.now();

    const agent: AgentMetadata = {
      id: "agent-1",
      name: "Agent 1",
      capabilities: ["coding"],
      status: "active",
      lastSeen: initialTime,
    };

    registry.register(agent);

    const beforeHeartbeat = Date.now();
    registry.heartbeat("agent-1");

    const updated = registry.get("agent-1");
    expect(updated?.lastSeen).toBeGreaterThanOrEqual(beforeHeartbeat);
  });

  it("should handle heartbeat for non-existent agent gracefully", () => {
    const registry = new AgentRegistry();
    expect(() => registry.heartbeat("non-existent")).not.toThrow();
  });

  it("should clear all agents", () => {
    const registry = new AgentRegistry();

    const agents: AgentMetadata[] = [
      {
        id: "agent-1",
        name: "Agent 1",
        capabilities: ["coding"],
        status: "active",
        lastSeen: Date.now(),
      },
      {
        id: "agent-2",
        name: "Agent 2",
        capabilities: ["testing"],
        status: "active",
        lastSeen: Date.now(),
      },
    ];

    agents.forEach(agent => registry.register(agent));
    expect(registry.listAll()).toHaveLength(2);

    registry.clear();
    expect(registry.listAll()).toHaveLength(0);
  });

  it("should replace agent when registering with same id", () => {
    const registry = new AgentRegistry();

    const agent1: AgentMetadata = {
      id: "agent-1",
      name: "Agent 1",
      capabilities: ["coding"],
      status: "active",
      lastSeen: Date.now(),
    };

    registry.register(agent1);

    const agent2: AgentMetadata = {
      id: "agent-1",
      name: "Agent 1 Updated",
      capabilities: ["coding", "testing"],
      status: "busy",
      lastSeen: Date.now(),
    };

    registry.register(agent2);

    const retrieved = registry.get("agent-1");
    expect(retrieved?.name).toBe("Agent 1 Updated");
    expect(retrieved?.capabilities).toHaveLength(2);
    expect(retrieved?.status).toBe("busy");
  });
});
