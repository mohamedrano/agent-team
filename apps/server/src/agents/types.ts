// ═══════════════════════════════════════════════════════════════════════════════
// Agent Types - Core Type Definitions for Multi-Agent System
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generic dictionary type for flexible data structures
 */
export type Dict<T = any> = Record<string, T>;

/**
 * Session state that persists across agent interactions
 * Contains all artifacts produced during the SDLC pipeline
 */
export interface SessionState extends Dict {
  original_request?: string;
  project_analysis?: ProjectAnalysis;
  execution_plan?: ExecutionPhase[];
  prd_document?: PRDDocument;
  system_architecture?: SystemArchitecture;
  database_schema?: DatabaseSchema;
  generated_code?: Dict;
  analytics_dashboard?: Dict;
  data_analysis?: Dict;
  retrieval_metrics?: Dict;
  rag_config?: Dict;
  cicd_pipeline?: Dict;
  infrastructure_config?: Dict;
  test_suites?: Dict;
  coverage_analysis?: Dict;
  security_audit?: Dict;
  security_config?: Dict;
  openapi_spec?: Dict;
  contract_test_report?: Dict;
  incident_actions?: Dict;
  postmortem?: Dict;
  finops_costs?: Dict;
  finops_optimizations?: string[];
  finops_recommendations?: Dict;
  // Dynamic keys for additional agent outputs
  [key: string]: any;
}

/**
 * Context provided to agent tools during execution
 */
export interface ToolContext {
  state: SessionState;
  agent_name: string;
  stateController?: any; // StateController instance for advanced state management
}

/**
 * Configuration for AI model used by an agent
 */
export interface ModelConfig {
  model: string; // e.g., "gemini/gemini-2.5-pro", "anthropic/claude-sonnet-4"
  temperature?: number; // 0.0 - 1.0
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
}

/**
 * Agent tool function signature
 * Tools are the primary way agents interact with the system
 */
export type AgentTool<TArgs = any, TReturn = Dict> = (
  args: TArgs,
  context: ToolContext
) => Promise<TReturn>;

/**
 * Core Agent definition
 * Represents a specialized AI agent with specific responsibilities
 */
export interface Agent<TModel extends ModelConfig = ModelConfig> {
  name: string;
  model: TModel;
  description: string;
  instruction: string; // System prompt in Arabic or English
  tools?: AgentTool[];
  sub_agents?: Agent[]; // Hierarchical agent structure
  output_key?: string; // Key in SessionState where final output is stored
  before_model_callback?: (context: any, request: any) => Promise<any>;
  before_tool_callback?: (tool: any, args: any, context: ToolContext) => Promise<any>;
}

/**
 * Project analysis result from initial request parsing
 */
export interface ProjectAnalysis {
  status: "success" | "error";
  project_types: Array<"full_stack_web" | "api_microservice" | "data_analytics" | "mobile_app">;
  required_agents: string[];
  complexity: "standard" | "enterprise";
  estimated_phases: string[];
}

/**
 * Execution phase in the SDLC pipeline
 */
export interface ExecutionPhase {
  phase_name: string;
  agents: string[];
  deliverables: string[];
  estimated_duration: string;
  dependencies?: string[];
}

/**
 * Product Requirements Document structure
 */
export interface PRDDocument {
  document_type: "Product Requirements Document";
  version: string;
  created_at: string;
  executive_summary: {
    vision: string;
    target_users: string;
    success_metrics: string[];
  };
  functional_requirements: FunctionalRequirement[];
  non_functional_requirements: Record<string, string>;
  user_stories: UserStory[];
  out_of_scope: string[];
}

/**
 * Functional requirement in PRD
 */
export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  acceptance_criteria: string[];
}

/**
 * User story in PRD
 */
export interface UserStory {
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance: string;
}

/**
 * System architecture design
 */
export interface SystemArchitecture {
  architecture_style: "Microservices" | "Monolith (Modular)" | "Serverless";
  layers: {
    presentation: TechLayer;
    application: TechLayer;
    data: TechLayer;
    integration: TechLayer;
  };
  deployment_architecture: DeploymentConfig;
  data_flow: string[];
  security_design: SecurityConfig;
}

/**
 * Technology layer definition
 */
export interface TechLayer {
  [key: string]: any;
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  hosting: string;
  cdn: string;
  ci_cd: string;
  monitoring: string;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  encryption: string;
  secrets_management: string;
  api_security: string;
  input_validation: string;
}

/**
 * Database schema design
 */
export interface DatabaseSchema {
  tables: DatabaseTable[];
  relationships: DatabaseRelationship[];
  migrations_strategy: string;
}

/**
 * Database table definition
 */
export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  indexes: string[];
  rls_policies: string[];
}

/**
 * Database column definition
 */
export interface DatabaseColumn {
  name: string;
  type: string;
  primary_key?: boolean;
  unique?: boolean;
  foreign_key?: string;
  default?: string;
  nullable?: boolean;
}

/**
 * Database relationship definition
 */
export interface DatabaseRelationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  on_delete: "CASCADE" | "SET NULL" | "RESTRICT";
}
