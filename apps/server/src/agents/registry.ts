// ═══════════════════════════════════════════════════════════════════════════════
// Agent Registry - Central Registry of All Agents
// ═══════════════════════════════════════════════════════════════════════════════

import type { Agent } from "./types.js";
import {
  teamLeaderAwsa,
  productManagerKasya,
  architectAmira,
  softwareEngineerSalwa,
  devopsEngineer,
  qaEngineer,
  appsecEngineer,
  apiContractsIntegrator,
} from "./builtin.js";

/**
 * Central registry of all available agents in the system
 *
 * Agents are organized by layer:
 * - Orchestration: team_leader_awsa
 * - Strategy: product_manager_kasya
 * - Design: architect_amira
 * - Execution: software_engineer_salwa
 * - Quality: qa_engineer, appsec_engineer
 * - Operations: devops_engineer
 * - Integration: api_contracts_integrator
 */
export const AGENTS: Agent[] = [
  // Core agents (always included)
  teamLeaderAwsa,
  productManagerKasya,
  architectAmira,
  softwareEngineerSalwa,
  devopsEngineer,
  qaEngineer,
  appsecEngineer,
  apiContractsIntegrator,
];

/**
 * Get agent by name
 */
export function getAgent(name: string): Agent | undefined {
  return AGENTS.find((agent) => agent.name === name);
}

/**
 * Get all agents of a specific type/layer
 */
export function getAgentsByLayer(layer: string): Agent[] {
  const layerMap: Record<string, string[]> = {
    orchestration: ["team_leader_awsa"],
    strategy: ["product_manager_kasya"],
    design: ["architect_amira"],
    execution: ["software_engineer_salwa"],
    quality: ["qa_engineer", "appsec_engineer"],
    operations: ["devops_engineer"],
    integration: ["api_contracts_integrator"],
  };

  const agentNames = layerMap[layer.toLowerCase()] || [];
  return AGENTS.filter((agent) => agentNames.includes(agent.name));
}

/**
 * Get required agents for a project type
 */
export function getRequiredAgents(
  projectType: "full_stack_web" | "api_microservice" | "data_analytics" | "mobile_app"
): Agent[] {
  const baseAgents = [
    "team_leader_awsa",
    "product_manager_kasya",
    "architect_amira",
    "devops_engineer",
    "qa_engineer",
    "appsec_engineer",
  ];

  const typeSpecificAgents: Record<string, string[]> = {
    full_stack_web: ["software_engineer_salwa", "api_contracts_integrator"],
    api_microservice: ["software_engineer_salwa", "api_contracts_integrator"],
    data_analytics: ["software_engineer_salwa"],
    mobile_app: ["software_engineer_salwa"],
  };

  const requiredNames = [
    ...baseAgents,
    ...(typeSpecificAgents[projectType] || []),
  ];

  return AGENTS.filter((agent) => requiredNames.includes(agent.name));
}

/**
 * Validate that all required agents are available
 */
export function validateAgentRegistry(): {
  valid: boolean;
  missing: string[];
  duplicate: string[];
} {
  const requiredAgents = [
    "team_leader_awsa",
    "product_manager_kasya",
    "architect_amira",
    "software_engineer_salwa",
    "devops_engineer",
    "qa_engineer",
    "appsec_engineer",
    "api_contracts_integrator",
  ];

  const registeredNames = AGENTS.map((a) => a.name);
  const missing = requiredAgents.filter((name) => !registeredNames.includes(name));

  const nameSet = new Set<string>();
  const duplicate: string[] = [];
  for (const name of registeredNames) {
    if (nameSet.has(name)) {
      duplicate.push(name);
    }
    nameSet.add(name);
  }

  return {
    valid: missing.length === 0 && duplicate.length === 0,
    missing,
    duplicate,
  };
}

/**
 * List all available agent names
 */
export function listAgentNames(): string[] {
  return AGENTS.map((agent) => agent.name);
}

/**
 * Get agent metadata for documentation
 */
export function getAgentMetadata(name: string): {
  name: string;
  description: string;
  model: string;
  tools: string[];
} | null {
  const agent = getAgent(name);
  if (!agent) return null;

  return {
    name: agent.name,
    description: agent.description,
    model: agent.model.model,
    tools: agent.tools?.map((t) => t.name).filter(Boolean) || [],
  };
}

/**
 * Export agent registry for monitoring and debugging
 */
export function exportRegistry() {
  return {
    total: AGENTS.length,
    agents: AGENTS.map((a) => ({
      name: a.name,
      model: a.model.model,
      description: a.description,
      tools_count: a.tools?.length || 0,
      output_key: a.output_key,
    })),
    validation: validateAgentRegistry(),
  };
}
