/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: string;
  name: string;
  capabilities: string[];
  status: "active" | "inactive" | "busy";
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

/**
 * Registry for managing agents
 */
export class AgentRegistry {
  private agents = new Map<string, AgentMetadata>();

  /**
   * Register an agent
   */
  register(agent: AgentMetadata): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Get agent by ID
   */
  get(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAll(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: string): AgentMetadata[] {
    return this.listAll().filter(agent =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Find available agents
   */
  findAvailable(): AgentMetadata[] {
    return this.listAll().filter(agent => agent.status === "active");
  }

  /**
   * Update agent status
   */
  updateStatus(agentId: string, status: AgentMetadata["status"]): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastSeen = Date.now();
    }
  }

  /**
   * Update agent heartbeat
   */
  heartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastSeen = Date.now();
    }
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
  }
}
