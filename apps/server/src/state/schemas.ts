// ═══════════════════════════════════════════════════════════════════════════════
// State Schemas - Zod Validation Schemas for State Artifacts
// ═══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";

// ──────────────────────────────────────────────────────────────────────────────
// Core Primitives
// ──────────────────────────────────────────────────────────────────────────────

export const IsoDate = z.string().datetime().or(z.string());
export const NonEmpty = z.string().min(1);

// ──────────────────────────────────────────────────────────────────────────────
// PRD (Product Requirements Document)
// ──────────────────────────────────────────────────────────────────────────────

export const PrdRequirement = z.object({
  id: NonEmpty,
  title: NonEmpty,
  description: NonEmpty,
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  acceptance_criteria: z.array(NonEmpty),
});

export const UserStory = z.object({
  as_a: NonEmpty,
  i_want: NonEmpty,
  so_that: NonEmpty,
  acceptance: NonEmpty,
});

export const PrdDocumentSchema = z.object({
  document_type: z.literal("Product Requirements Document"),
  version: NonEmpty,
  created_at: NonEmpty,
  executive_summary: z.object({
    vision: NonEmpty,
    target_users: NonEmpty,
    success_metrics: z.array(NonEmpty),
  }),
  functional_requirements: z.array(PrdRequirement),
  non_functional_requirements: z.record(z.string()),
  user_stories: z.array(UserStory),
  out_of_scope: z.array(z.string()),
});

export type PRDDocument = z.infer<typeof PrdDocumentSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// System Architecture
// ──────────────────────────────────────────────────────────────────────────────

export const TechLayer = z.record(z.any());

export const DeploymentConfig = z.object({
  hosting: NonEmpty,
  cdn: NonEmpty,
  ci_cd: NonEmpty,
  monitoring: NonEmpty,
});

export const SecurityConfig = z.object({
  encryption: NonEmpty,
  secrets_management: NonEmpty,
  api_security: NonEmpty,
  input_validation: NonEmpty,
});

export const SystemArchitectureSchema = z.object({
  architecture_style: z.enum(["Microservices", "Monolith (Modular)", "Serverless"]),
  layers: z.object({
    presentation: TechLayer,
    application: TechLayer,
    data: TechLayer,
    integration: TechLayer,
  }),
  deployment_architecture: DeploymentConfig,
  data_flow: z.array(NonEmpty),
  security_design: SecurityConfig,
});

export type SystemArchitecture = z.infer<typeof SystemArchitectureSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Database Schema
// ──────────────────────────────────────────────────────────────────────────────

export const DatabaseColumn = z.object({
  name: NonEmpty,
  type: NonEmpty,
  primary_key: z.boolean().optional(),
  unique: z.boolean().optional(),
  foreign_key: z.string().optional(),
  default: z.string().optional(),
  nullable: z.boolean().optional(),
});

export const DatabaseTable = z.object({
  name: NonEmpty,
  columns: z.array(DatabaseColumn),
  indexes: z.array(z.string()),
  rls_policies: z.array(z.string()),
});

export const DatabaseRelationship = z.object({
  from: NonEmpty,
  to: NonEmpty,
  type: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many"]),
  on_delete: z.enum(["CASCADE", "SET NULL", "RESTRICT"]),
});

export const DatabaseSchemaSchema = z.object({
  tables: z.array(DatabaseTable),
  relationships: z.array(DatabaseRelationship),
  migrations_strategy: NonEmpty,
});

export type DatabaseSchema = z.infer<typeof DatabaseSchemaSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// RAG & Retrieval
// ──────────────────────────────────────────────────────────────────────────────

export const RetrievalMetrics = z.object({
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1_score: z.number().min(0).max(1),
  latency_ms: z.number().int().min(0),
  relevance_scores: z.array(z.number().min(0).max(1)).optional(),
  recommendations: z.array(z.string()).optional(),
});

export type RetrievalMetricsT = z.infer<typeof RetrievalMetrics>;

export const RagConfig = z.object({
  chunk_size: z.number().int().positive(),
  chunk_overlap: z.number().int().min(0),
  embedding_model: NonEmpty,
  retrieval_k: z.number().int().positive(),
  rerank_top_n: z.number().int().positive(),
  similarity_threshold: z.number().min(0).max(1),
  hybrid_search: z.object({
    enabled: z.boolean(),
    semantic_weight: z.number().min(0).max(1),
    keyword_weight: z.number().min(0).max(1),
  }),
});

export type RagConfigT = z.infer<typeof RagConfig>;

// ──────────────────────────────────────────────────────────────────────────────
// CI/CD & Infrastructure
// ──────────────────────────────────────────────────────────────────────────────

export const CicdPipeline = z.object({
  provider: NonEmpty,
  workflows: z.record(z.any()),
  estimated_deploy_time: z.string(),
  repo_url: z.string().optional(),
});

export const InfrastructureConfig = z.object({
  cloud_provider: NonEmpty,
  resources: z.record(z.any()),
  monitoring: z.object({
    service: NonEmpty,
    alerts: z.array(z.string()),
  }),
  estimated_monthly_cost: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Quality Assurance
// ──────────────────────────────────────────────────────────────────────────────

export const TestSuites = z.object({
  unit_tests: z.record(z.any()).optional(),
  integration_tests: z.record(z.any()).optional(),
  e2e_tests: z.record(z.any()).optional(),
});

export const CoverageAnalysis = z.object({
  overall_coverage: z.number().min(0).max(100),
  by_type: z.record(z.number()),
  uncovered_critical_paths: z.array(z.string()),
  flaky_tests: z.array(z.string()).optional(),
  recommendations: z.array(z.string()),
});

// ──────────────────────────────────────────────────────────────────────────────
// Security
// ──────────────────────────────────────────────────────────────────────────────

export const SecurityAudit = z.object({
  critical: z.array(z.any()),
  high: z.array(z.any()),
  medium: z.array(z.any()),
  low: z.array(z.any()),
  compliance_checks: z.record(z.string()),
});

export const SecurityConfigDoc = z.object({
  authentication: z.record(z.any()),
  authorization: z.record(z.any()),
  data_protection: z.record(z.any()),
  api_security: z.record(z.any()),
  secrets_management: z.record(z.any()),
});

// ──────────────────────────────────────────────────────────────────────────────
// API Contracts
// ──────────────────────────────────────────────────────────────────────────────

export const OpenApiSpec = z.object({
  openapi: NonEmpty,
  info: z.record(z.any()),
  paths: z.record(z.any()),
  components: z.record(z.any()).optional(),
  security: z.array(z.any()).optional(),
  servers: z.array(z.any()).optional(),
});

export const ContractTestReport = z.object({
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  failures: z.array(z.record(z.any())),
  coverage: z.number().min(0).max(1),
});

// ──────────────────────────────────────────────────────────────────────────────
// Incidents & Operations
// ──────────────────────────────────────────────────────────────────────────────

export const IncidentActions = z.object({
  severity: z.enum(["SEV1", "SEV2", "SEV3"]),
  actions: z.array(z.string()),
  summary: z.string().optional(),
});

export const Postmortem = z.object({
  title: NonEmpty,
  root_cause: NonEmpty,
  customer_impact: NonEmpty,
  timeline: z.array(z.string()),
  corrective_actions: z.array(z.string()),
  owners: z.array(z.string()),
  due_dates: z.record(z.string()),
});

// ──────────────────────────────────────────────────────────────────────────────
// FinOps
// ──────────────────────────────────────────────────────────────────────────────

export const FinopsCosts = z.object({
  costsByService: z.record(z.number()),
  monthlyTotalUSD: z.number(),
});

export const FinopsRecommendations = z.object({
  recommendations: z.array(z.string()),
  estimatedSavingsUSD: z.number(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Dashboards & Analytics
// ──────────────────────────────────────────────────────────────────────────────

export const DashboardDoc = z.object({
  title: NonEmpty,
  widgets: z.array(z.record(z.any())),
  filters: z.array(z.string()).optional(),
  refresh_interval: z.string().optional(),
});

export const DataInsights = z.object({
  normalization_level: z.string(),
  potential_bottlenecks: z.array(z.string()),
  optimization_suggestions: z.array(z.string()),
  bi_opportunities: z.array(z.string()),
});

// ──────────────────────────────────────────────────────────────────────────────
// State Key Enum & Schema Registry
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Canonical state keys - maps to specific artifacts in the session
 */
export const StateKey = z.enum([
  "prd_document",
  "system_architecture",
  "database_schema",
  "generated_code",
  "analytics_dashboard",
  "data_analysis",
  "retrieval_metrics",
  "rag_config",
  "cicd_pipeline",
  "infrastructure_config",
  "test_suites",
  "coverage_analysis",
  "security_audit",
  "security_config",
  "openapi_spec",
  "contract_test_report",
  "incident_actions",
  "postmortem",
  "finops_costs",
  "finops_optimizations",
  "finops_recommendations",
]);

export type StateKey = z.infer<typeof StateKey>;

/**
 * Schema registry - maps state keys to their validation schemas
 * null means no validation (heterogeneous or dynamic data)
 */
export const SCHEMA_REGISTRY: Record<StateKey, z.ZodTypeAny | null> = {
  prd_document: PrdDocumentSchema,
  system_architecture: SystemArchitectureSchema,
  database_schema: DatabaseSchemaSchema,
  generated_code: null, // Complex nested structure
  analytics_dashboard: DashboardDoc,
  data_analysis: DataInsights,
  retrieval_metrics: RetrievalMetrics,
  rag_config: RagConfig,
  cicd_pipeline: CicdPipeline,
  infrastructure_config: InfrastructureConfig,
  test_suites: TestSuites,
  coverage_analysis: CoverageAnalysis,
  security_audit: SecurityAudit,
  security_config: SecurityConfigDoc,
  openapi_spec: OpenApiSpec,
  contract_test_report: ContractTestReport,
  incident_actions: IncidentActions,
  postmortem: Postmortem,
  finops_costs: FinopsCosts,
  finops_optimizations: z.array(z.string()),
  finops_recommendations: FinopsRecommendations,
};
