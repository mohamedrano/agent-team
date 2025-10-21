// ═══════════════════════════════════════════════════════════════════════════════
// Agent Registry - Central Registry of All Agents
// ═══════════════════════════════════════════════════════════════════════════════

import type { Agent } from "./types.js";
import {
  teamLeaderAwsa,
  productManagerKasya,
  architectAmira,
  softwareEngineerSalwa,
  dataAnalystSamra,
  devopsEngineer,
  qaEngineer,
  appsecEngineer,
  performanceEngineer,
  uxUiDesigner,
  promptArchitect,
  knowledgeCurator,
  apiContractsIntegrator,
  observabilityMonitor,
  releaseManager,
  privacyOfficer,
  i18nSpecialist,
  documentationLead,
  finopsAnalyst,
  retrievalEvaluator,
  incidentCommander,
} from "./builtin.js";

/**
 * Central registry of all available agents in the system
 */
export const AGENTS: Agent[] = [
  // Orchestration & Strategy
  teamLeaderAwsa,
  productManagerKasya,
  finopsAnalyst,
  // Design & Experience
  architectAmira,
  uxUiDesigner,
  i18nSpecialist,
  documentationLead,
  // Execution & Data
  softwareEngineerSalwa,
  dataAnalystSamra,
  promptArchitect,
  knowledgeCurator,
  retrievalEvaluator,
  // Quality & Security
  qaEngineer,
  appsecEngineer,
  performanceEngineer,
  // Operations & Reliability
  devopsEngineer,
  observabilityMonitor,
  releaseManager,
  incidentCommander,
  // Governance & Privacy
  privacyOfficer,
  // Integration
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
    strategy: ["product_manager_kasya", "finops_analyst"],
    design: ["architect_amira", "ux_ui_designer"],
    experience: ["i18n_specialist", "documentation_lead"],
    execution: ["software_engineer_salwa", "data_analyst_samra", "prompt_architect"],
    data: ["knowledge_curator", "retrieval_evaluator"],
    quality: ["qa_engineer", "appsec_engineer", "performance_engineer"],
    operations: [
      "devops_engineer",
      "observability_monitor",
      "release_manager",
      "incident_commander",
    ],
    governance: ["privacy_officer", "finops_analyst"],
    integration: ["api_contracts_integrator"],
  };

  const agentNames = layerMap[layer.toLowerCase()] || [];
  return AGENTS.filter((agent) => agentNames.includes(agent.name));
}

/**
 * Get required agents for a project type
 */
export function getRequiredAgents(
  projectType: "full_stack_web" | "api_microservice" | "data_analytics" | "mobile_app",
): Agent[] {
  const baseAgents = [
    "team_leader_awsa",
    "product_manager_kasya",
    "architect_amira",
    "software_engineer_salwa",
    "devops_engineer",
    "qa_engineer",
    "appsec_engineer",
    "performance_engineer",
    "observability_monitor",
    "release_manager",
    "privacy_officer",
    "documentation_lead",
    "incident_commander",
    "finops_analyst",
    "prompt_architect",
  ];

  const typeSpecificAgents: Record<string, string[]> = {
    full_stack_web: [
      "ux_ui_designer",
      "api_contracts_integrator",
      "i18n_specialist",
      "data_analyst_samra",
    ],
    api_microservice: [
      "api_contracts_integrator",
      "data_analyst_samra",
      "knowledge_curator",
    ],
    data_analytics: [
      "data_analyst_samra",
      "knowledge_curator",
      "retrieval_evaluator",
      "finops_analyst",
    ],
    mobile_app: [
      "ux_ui_designer",
      "i18n_specialist",
      "api_contracts_integrator",
    ],
  };

  const requiredNames = [
    ...new Set([
      ...baseAgents,
      ...(typeSpecificAgents[projectType] || []),
    ]),
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
    "data_analyst_samra",
    "devops_engineer",
    "qa_engineer",
    "appsec_engineer",
    "performance_engineer",
    "ux_ui_designer",
    "prompt_architect",
    "knowledge_curator",
    "api_contracts_integrator",
    "observability_monitor",
    "release_manager",
    "privacy_officer",
    "i18n_specialist",
    "documentation_lead",
    "finops_analyst",
    "retrieval_evaluator",
    "incident_commander",
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
