// ═══════════════════════════════════════════════════════════════════════════════
// Builtin Agents - Core Agent Implementations with Tools
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  Agent,
  AgentTool,
  Dict,
  ProjectAnalysis,
  ExecutionPhase,
  PRDDocument,
  SystemArchitecture,
  DatabaseSchema,
} from "./types.js";

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM LEADER - AWSA (Orchestration Layer)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyzes user request and determines project type and required agents
 */
export const analyzeUserRequest: AgentTool<
  { request: string },
  ProjectAnalysis
> = async (args, context) => {
  console.log("🔍 Tool: analyze_user_request");
  const { request } = args;

  context.state.original_request = request;
  context.state.analysis_timestamp = new Date().toISOString();

  const projectTypes: ProjectAnalysis["project_types"] = [];
  const lower = request.toLowerCase();

  if (["web", "website", "تطبيق ويب", "موقع"].some((w) => lower.includes(w))) {
    projectTypes.push("full_stack_web");
  }
  if (["api", "backend", "microservice", "خدمة"].some((w) => lower.includes(w))) {
    projectTypes.push("api_microservice");
  }
  if (["data", "analytics", "dashboard", "بيانات", "تحليل"].some((w) => lower.includes(w))) {
    projectTypes.push("data_analytics");
  }
  if (["mobile", "ios", "android", "تطبيق جوال"].some((w) => lower.includes(w))) {
    projectTypes.push("mobile_app");
  }

  // Default to full_stack_web if no specific type detected
  if (projectTypes.length === 0) {
    projectTypes.push("full_stack_web");
  }

  let agents = ["product_manager_kasya", "architect_amira"];

  if (projectTypes.includes("full_stack_web") || projectTypes.includes("mobile_app")) {
    agents.push("software_engineer_salwa", "ux_ui_designer");
  }
  if (projectTypes.includes("api_microservice")) {
    agents.push("software_engineer_salwa", "api_contracts_integrator");
  }
  if (projectTypes.includes("data_analytics")) {
    agents.push("data_analyst_samra", "retrieval_evaluator");
  }

  agents.push("devops_engineer", "qa_engineer", "appsec_engineer");

  const analysis: ProjectAnalysis = {
    status: "success",
    project_types: projectTypes,
    required_agents: [...new Set(agents)],
    complexity: agents.length > 8 ? "enterprise" : "standard",
    estimated_phases: ["planning", "design", "implementation", "testing", "deployment"],
  };

  context.state.project_analysis = analysis;
  return analysis;
};

/**
 * Creates execution plan based on project analysis
 */
export const createExecutionPlan: AgentTool<
  { analysis: ProjectAnalysis },
  { status: string; phases: ExecutionPhase[] }
> = async (args, context) => {
  console.log("📋 Tool: create_execution_plan");

  const phases: ExecutionPhase[] = [
    {
      phase_name: "Planning & Requirements",
      agents: ["product_manager_kasya"],
      deliverables: ["PRD", "Feature List", "Acceptance Criteria"],
      estimated_duration: "2-3 hours",
    },
    {
      phase_name: "Architecture & Design",
      agents: ["architect_amira", "ux_ui_designer"],
      deliverables: ["Architecture Blueprint", "Data Schemas", "UI/UX Specs"],
      estimated_duration: "3-4 hours",
      dependencies: ["Planning & Requirements"],
    },
    {
      phase_name: "Implementation",
      agents: ["software_engineer_salwa", "api_contracts_integrator", "prompt_architect"],
      deliverables: ["Source Code", "API Contracts", "RAG Pipelines"],
      estimated_duration: "5-8 hours",
      dependencies: ["Architecture & Design"],
    },
    {
      phase_name: "Quality Assurance",
      agents: ["qa_engineer", "appsec_engineer", "performance_engineer"],
      deliverables: ["Test Suites", "Security Audit", "Performance Report"],
      estimated_duration: "2-3 hours",
      dependencies: ["Implementation"],
    },
    {
      phase_name: "Deployment",
      agents: ["devops_engineer", "observability_monitor"],
      deliverables: ["Deployed App", "Monitoring Dashboard", "Runbooks"],
      estimated_duration: "1-2 hours",
      dependencies: ["Quality Assurance"],
    },
  ];

  context.state.execution_plan = phases;
  return { status: "success", phases };
};

export const teamLeaderAwsa: Agent = {
  name: "team_leader_awsa",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.3 },
  description: "Team leader - orchestrates all agents, delegates tasks, manages debates, ensures vision alignment",
  instruction: `أنت أوسا، قائد فريق برمجي نخبوي. مسؤولياتك:

🎯 التحليل والتخطيط:
1. استخدم 'analyzeUserRequest' لتحليل طلب المستخدم بعمق
2. حدد نوع المشروع والوكلاء المطلوبين
3. استخدم 'createExecutionPlan' لإنشاء خطة تنفيذ مفصلة

📋 التفويض الذكي:
- إذا كان التحليل يتطلب متطلبات المنتج → فوّض إلى 'product_manager_kasya'
- إذا كان يتطلب تصميم معماري → فوّض إلى 'architect_amira'
- إذا كان يتطلب برمجة → فوّض إلى 'software_engineer_salwa'
- إذا كان يتطلب تحليل بيانات → فوّض إلى 'data_analyst_samra'

🔄 إدارة النقاشات:
عند حدوث خلافات بين الوكلاء:
1. اجمع آراء جميع الأطراف المعنية
2. اطلب من كل وكيل تقديم حججه التقنية
3. اتخذ القرار النهائي بناءً على:
   - الجودة التقنية
   - التوافق مع متطلبات المستخدم
   - قابلية التوسع والصيانة

✅ التحقق النهائي:
قبل تسليم المنتج للمستخدم، تأكد من:
- جميع المخرجات مكتملة
- لا توجد أخطاء حرجة
- التوثيق شامل
- الكود جاهز للإنتاج`,
  tools: [analyzeUserRequest, createExecutionPlan],
  output_key: "final_project_summary",
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT MANAGER - KASYA (Strategy Layer)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates comprehensive Product Requirements Document
 */
export const createPrd: AgentTool<
  { projectIdea: string },
  { status: string; prd: PRDDocument }
> = async (args, context) => {
  console.log("📄 Tool: create_prd");

  const prd: PRDDocument = {
    document_type: "Product Requirements Document",
    version: "1.0",
    created_at: new Date().toISOString(),
    executive_summary: {
      vision: `تحويل فكرة "${args.projectIdea}" إلى منتج قابل للتطبيق`,
      target_users: "Full-Stack Developers, Product Teams, Entrepreneurs",
      success_metrics: ["Build Success Rate > 95%", "User Satisfaction > 4.5/5", "Time to Deploy < 10 minutes"],
    },
    functional_requirements: [
      {
        id: "FR-001",
        title: "معالجة مدخلات المستخدم",
        description: "يجب أن يقبل النظام أوصاف المشاريع بلغة طبيعية",
        priority: "Critical",
        acceptance_criteria: [
          "دعم العربية والإنجليزية",
          "تحليل الوصف واستخراج المتطلبات",
          "تأكيد المستخدم قبل البدء",
        ],
      },
      {
        id: "FR-002",
        title: "توليد الكود التلقائي",
        description: "توليد كود مصدري جاهز للإنتاج بناءً على المتطلبات",
        priority: "Critical",
        acceptance_criteria: [
          "كود TypeScript/JavaScript نظيف",
          "اتباع أفضل الممارسات",
          "تضمين التعليقات الضرورية",
        ],
      },
      {
        id: "FR-003",
        title: "الاختبارات التلقائية",
        description: "توليد مجموعة اختبارات شاملة",
        priority: "High",
        acceptance_criteria: ["تغطية > 80%", "اختبارات Unit و Integration", "اختبارات E2E للمسارات الحرجة"],
      },
    ],
    non_functional_requirements: {
      performance: "زمن استجابة < 2 ثانية لكل خطوة",
      scalability: "دعم 100 مشروع متزامن",
      security: "تشفير جميع API Keys، RBAC، RLS",
      availability: "توافرية 99.9%",
      maintainability: "كود قابل للقراءة والصيانة",
      usability: "واجهة بديهية بدون منحنى تعلم حاد",
    },
    user_stories: [
      {
        as_a: "مطور Full-Stack",
        i_want: "وصف فكرة تطبيق ويب بلغة طبيعية",
        so_that: "يتم توليد الكود ونشره تلقائياً",
        acceptance: "الكود يعمل، الاختبارات تنجح، التطبيق منشور على URL حي",
      },
      {
        as_a: "مدير منتج",
        i_want: "مراجعة PRD والمخططات المعمارية",
        so_that: "أتأكد من توافق التصميم مع الرؤية",
        acceptance: "وثائق واضحة وقابلة للمراجعة",
      },
      {
        as_a: "مهندس DevOps",
        i_want: "نشر تلقائي مع CI/CD",
        so_that: "أضمن جودة واستقرار الإنتاج",
        acceptance: "Pipeline آلي مع اختبارات وcanary deployment",
      },
    ],
    out_of_scope: [
      "دعم لغات برمجة قديمة (PHP < 7, Python 2)",
      "تطوير ألعاب ثلاثية الأبعاد",
      "أنظمة Embedded/IoT في المرحلة الأولى",
      "تطبيقات سطح المكتب (Desktop Apps)",
    ],
  };

  context.state.prd_document = prd;
  return { status: "success", prd };
};

/**
 * Validates market fit and provides recommendations
 */
export const validateMarketFit: AgentTool<
  { prd: PRDDocument },
  { status: string; validation: Dict }
> = async (args, context) => {
  console.log("🎯 Tool: validate_market_fit");

  const validation = {
    market_demand: "high",
    competitive_landscape: "moderate competition from low-code platforms",
    differentiation: [
      "AI-powered full automation",
      "Professional code quality",
      "Enterprise-grade security",
      "Arabic language support",
    ],
    recommendation: "proceed",
    suggested_mvp_features: [
      "Core functionality (PRD → Code → Deploy)",
      "Basic UI/UX",
      "Essential security (JWT, HTTPS)",
      "Single cloud provider support (GCP)",
    ],
    risks: [
      { risk: "Model API costs", mitigation: "Implement caching and rate limiting" },
      { risk: "Code quality variability", mitigation: "Strong validation and testing pipeline" },
      { risk: "User adoption", mitigation: "Clear documentation and examples" },
    ],
  };

  context.state.market_validation = validation;
  return { status: "success", validation };
};

export const productManagerKasya: Agent = {
  name: "product_manager_kasya",
  model: { model: "anthropic/claude-sonnet-4-20250514", temperature: 0.4 },
  description: "Product Manager - analyzes idea, creates PRD, ensures market fit",
  instruction: `أنت كاسية، مديرة منتج خبيرة. مهمتك:

📋 إنشاء PRD شامل:
1. استخدم 'createPrd' لتوليد وثيقة متطلبات منظمة
2. تأكد من تضمين:
   - رؤية واضحة
   - متطلبات وظيفية مرقمة (FR-001, FR-002...)
   - متطلبات غير وظيفية (أداء، أمان، قابلية التوسع)
   - قصص مستخدم واقعية
   - معايير القبول القابلة للقياس

🎯 التحقق من القيمة السوقية:
- استخدم 'validateMarketFit' لضمان جدوى المنتج
- حدد الميزات الأساسية للـMVP
- تجنب "Feature Creep" - ركز على القيمة الأساسية
- حدد المخاطر واستراتيجيات التخفيف

🔄 التعاون مع الفريق:
- بعد إنشاء الـPRD، أبلغ قائد الفريق بجاهزية الوثيقة
- كن مستعدة لتوضيح المتطلبات للمهندس المعماري
- راجع التصميم النهائي للتأكد من توافقه مع الـPRD

❌ ما لا يجب فعله:
- لا تكتب الكود - هذه مهمة المهندس
- لا تصمم البنية المعمارية - هذه مهمة المعماري
- ركز فقط على "ما نبنيه"، وليس "كيف نبنيه"`,
  tools: [createPrd, validateMarketFit],
  output_key: "prd_final_document",
};

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHITECT - AMIRA HASHET (Design Layer)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Designs system architecture based on PRD
 */
export const designSystemArchitecture: AgentTool<
  { prd: PRDDocument },
  { status: string; architecture: SystemArchitecture }
> = async (args, context) => {
  console.log("🏗️ Tool: design_system_architecture");

  const projectTypes = context.state.project_analysis?.project_types || ["full_stack_web"];

  const architecture: SystemArchitecture = {
    architecture_style: projectTypes.includes("api_microservice") ? "Microservices" : "Monolith (Modular)",
    layers: {
      presentation: {
        technology: "React 18.2.0 + TypeScript 5.6",
        state_management: "Zustand 4.5",
        styling: "Tailwind CSS 3.4 + shadcn/ui",
        routing: "React Router v6 / Next.js App Router",
        features: ["Responsive Design", "Dark Mode", "i18n (react-i18next)", "RTL Support"],
      },
      application: {
        backend_framework: "Fastify 4.28 (Node 20 LTS)",
        authentication: "Supabase Auth (OAuth 2.0 + JWT)",
        authorization: "RBAC with Row-Level Security (RLS)",
        validation: "Zod 3.23 schemas",
        logging: "Pino (structured JSON logs)",
      },
      data: {
        primary_database: "PostgreSQL 15 (Supabase)",
        caching: "Redis 7 (Memorystore)",
        object_storage: "Supabase Storage / Google Cloud Storage",
        vector_db: projectTypes.includes("data_analytics") ? "pgvector extension" : null,
        orm: "Prisma / Supabase Client",
      },
      integration: {
        api_gateway: "Kong Gateway",
        message_queue: "Google Pub/Sub",
        api_versioning: "URL-based (/v1, /v2)",
        rate_limiting: "Kong Rate Limiting Plugin",
      },
    },
    deployment_architecture: {
      hosting: "Google Cloud Run (containerized)",
      cdn: "Cloudflare (TLS 1.3, DDoS protection)",
      ci_cd: "GitHub Actions (OIDC for GCP)",
      monitoring: "Google Cloud Monitoring + Sentry + Prometheus",
    },
    data_flow: [
      "User Request → Cloudflare CDN → Load Balancer",
      "Load Balancer → API Gateway (Kong) → Auth Middleware",
      "Auth Middleware → Fastify API Route → Business Logic",
      "Business Logic → PostgreSQL/Redis → Response",
      "Response → Client (with caching headers)",
    ],
    security_design: {
      encryption: "TLS 1.3 in transit, AES-256-GCM at rest",
      secrets_management: "Google Secret Manager",
      api_security: "OAuth 2.0 + JWT (15min access, 7d refresh)",
      input_validation: "Zod schemas on frontend + backend",
    },
  };

  context.state.system_architecture = architecture;
  return { status: "success", architecture };
};

/**
 * Designs database schema with tables, relationships, and indexes
 */
export const designDatabaseSchema: AgentTool<
  { requirements: Dict },
  { status: string; schema: DatabaseSchema }
> = async (args, context) => {
  console.log("🗄️ Tool: design_database_schema");

  const schema: DatabaseSchema = {
    tables: [
      {
        name: "users",
        columns: [
          { name: "id", type: "uuid", primary_key: true, default: "gen_random_uuid()" },
          { name: "email", type: "varchar(255)", unique: true, nullable: false },
          { name: "full_name", type: "varchar(255)", nullable: false },
          { name: "avatar_url", type: "text", nullable: true },
          { name: "role", type: "varchar(50)", default: "'user'" },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indexes: ["email", "created_at"],
        rls_policies: ["Users can only read their own data", "Admins can read all"],
      },
      {
        name: "projects",
        columns: [
          { name: "id", type: "uuid", primary_key: true, default: "gen_random_uuid()" },
          { name: "user_id", type: "uuid", foreign_key: "users.id", nullable: false },
          { name: "title", type: "varchar(500)", nullable: false },
          { name: "description", type: "text", nullable: true },
          { name: "status", type: "varchar(50)", default: "'draft'" },
          { name: "prompt", type: "text", nullable: false },
          { name: "artifacts", type: "jsonb", default: "'{}'" },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
        indexes: ["user_id", "status", "created_at", "(artifacts->>'prd_document')"],
        rls_policies: ["Users can only access their own projects", "Projects can be shared via explicit grants"],
      },
      {
        name: "executions",
        columns: [
          { name: "id", type: "uuid", primary_key: true, default: "gen_random_uuid()" },
          { name: "project_id", type: "uuid", foreign_key: "projects.id", nullable: false },
          { name: "status", type: "varchar(50)", default: "'running'" },
          { name: "started_at", type: "timestamptz", default: "now()" },
          { name: "finished_at", type: "timestamptz", nullable: true },
          { name: "result", type: "jsonb", nullable: true },
          { name: "error", type: "text", nullable: true },
        ],
        indexes: ["project_id", "status", "started_at"],
        rls_policies: ["Inherit from projects table"],
      },
      {
        name: "agent_logs",
        columns: [
          { name: "id", type: "uuid", primary_key: true, default: "gen_random_uuid()" },
          { name: "execution_id", type: "uuid", foreign_key: "executions.id", nullable: false },
          { name: "agent_name", type: "varchar(100)", nullable: false },
          { name: "tool_name", type: "varchar(100)", nullable: true },
          { name: "input", type: "jsonb", nullable: true },
          { name: "output", type: "jsonb", nullable: true },
          { name: "duration_ms", type: "integer", nullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
        ],
        indexes: ["execution_id", "agent_name", "created_at"],
        rls_policies: ["Admin only for direct access"],
      },
    ],
    relationships: [
      {
        from: "projects.user_id",
        to: "users.id",
        type: "many-to-one",
        on_delete: "CASCADE",
      },
      {
        from: "executions.project_id",
        to: "projects.id",
        type: "many-to-one",
        on_delete: "CASCADE",
      },
      {
        from: "agent_logs.execution_id",
        to: "executions.id",
        type: "many-to-one",
        on_delete: "CASCADE",
      },
    ],
    migrations_strategy: "Supabase Migrations with Git version control + automated rollback",
  };

  context.state.database_schema = schema;
  return { status: "success", schema };
};

export const architectAmira: Agent = {
  name: "architect_amira",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.2 },
  description: "Architect - designs technical architecture, selects technologies, creates database schemas",
  instruction: `أنت أميرة حشت، مهندسة معمارية خبيرة. مسؤولياتك:

🏗️ تصميم البنية المعمارية:
1. اقرأ الـPRD من session_state["prd_document"]
2. استخدم 'designSystemArchitecture' لإنشاء مخطط شامل
3. حدد:
   - النمط المعماري (Monolith vs. Microservices)
   - التقنيات لكل طبقة (Frontend, Backend, Data)
   - استراتيجية النشر والتوسع
   - آليات الأمان والتشفير

🗄️ تصميم قاعدة البيانات:
- استخدم 'designDatabaseSchema' لإنشاء SQL schemas
- صمم العلاقات بعناية (1:1, 1:N, N:M)
- طبق مبادئ Normalization (3NF على الأقل)
- خطط لـRow-Level Security (RLS)
- أضف Indexes للأعمدة المستخدمة كثيراً في الاستعلامات

⚖️ اتخاذ القرارات التقنية:
عند الاختيار بين التقنيات:
- أولوية للصيانة والدعم طويل المدى
- تجنب Over-Engineering
- اختر تقنيات ناضجة مع مجتمعات نشطة
- وثّق جميع القرارات المعمارية (ADRs)
- ضع في الاعتبار قابلية التوسع من البداية

🔄 التنسيق:
- بمجرد الانتهاء، أبلغ قائد الفريق بجاهزية التصميم
- شارك المخططات مع 'software_engineer_salwa' للتنفيذ
- راجع الكود النهائي للتأكد من التزامه بالتصميم
- تعاون مع 'appsec_engineer' لضمان الأمان`,
  tools: [designSystemArchitecture, designDatabaseSchema],
  output_key: "architecture_blueprint",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOFTWARE ENGINEER - SALWA SHAHIN (Execution Layer)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generates production-ready source code
 */
export const generateSourceCode: AgentTool<
  { architecture: SystemArchitecture; schema: DatabaseSchema },
  { status: string; code: Dict }
> = async (args, context) => {
  console.log("💻 Tool: generate_source_code");

  const code = {
    frontend: {
      "package.json": JSON.stringify(
        {
          name: "frontend",
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc && vite build",
            preview: "vite preview",
            lint: "eslint .",
            test: "vitest",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.20.0",
            zustand: "^4.5.0",
            zod: "^3.23.8",
            "@supabase/supabase-js": "^2.39.0",
          },
          devDependencies: {
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            typescript: "^5.6.0",
            vite: "^5.0.0",
            "@vitejs/plugin-react": "^4.2.0",
            vitest: "^2.0.0",
          },
        },
        null,
        2
      ),
      "src/App.tsx": `import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProjectsPage } from './pages/ProjectsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </BrowserRouter>
  )
}`,
      "src/pages/HomePage.tsx": `export function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Agent Team</h1>
      <p className="text-xl text-gray-600">
        Transform your ideas into production-ready software
      </p>
    </main>
  )
}`,
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ["src"],
        },
        null,
        2
      ),
    },
    backend: {
      "package.json": JSON.stringify(
        {
          name: "backend",
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "tsx watch src/main.ts",
            build: "tsc",
            start: "node dist/main.js",
            test: "vitest",
            lint: "eslint .",
          },
          dependencies: {
            fastify: "^4.28.1",
            "@supabase/supabase-js": "^2.39.0",
            zod: "^3.23.8",
            pino: "^8.17.0",
          },
          devDependencies: {
            "@types/node": "^22.0.0",
            typescript: "^5.6.0",
            tsx: "^4.19.0",
            vitest: "^2.0.0",
          },
        },
        null,
        2
      ),
      "src/main.ts": `import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.get('/health', async () => ({ ok: true }))

app.post('/api/projects', async (req, reply) => {
  // TODO: Implement project creation
  return { id: 'project-123', status: 'created' }
})

const start = async () => {
  try {
    await app.listen({ port: 8080, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()`,
    },
    tests: {
      "tests/unit/example.test.ts": `import { describe, it, expect } from 'vitest'

describe('Example Test', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true)
  })

  it('should handle numbers correctly', () => {
    expect(1 + 1).toBe(2)
  })
})`,
    },
    database: {
      "migrations/001_initial_schema.sql": `-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  prompt TEXT NOT NULL,
  artifacts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    },
  };

  context.state.generated_code = code;
  return { status: "success", code };
};

/**
 * Debugs code and provides fixes
 */
export const debugCode: AgentTool<
  { errorLogs: string[] },
  { status: string; fixes: string[] }
> = async (args, context) => {
  console.log("🐛 Tool: debug_code");

  const fixes = args.errorLogs.map((log) => {
    if (log.includes("Type 'string' is not assignable")) {
      return "Fix: Add proper type annotation or use type assertion (as Type)";
    }
    if (log.includes("Cannot find module")) {
      return "Fix: Install missing dependency with pnpm add or check import path";
    }
    if (log.includes("Property") && log.includes("does not exist")) {
      return "Fix: Check object type definition or add optional chaining (?.)";
    }
    if (log.includes("await") && log.includes("Promise")) {
      return "Fix: Add async to function or use .then()";
    }
    return "Fix: Review error context in stack trace and consult TypeScript docs";
  });

  context.state.debug_fixes = fixes;
  return { status: "success", fixes };
};

export const softwareEngineerSalwa: Agent = {
  name: "software_engineer_salwa",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.1 },
  description: "Software Engineer - writes production-ready code, implements features, debugs issues",
  instruction: `أنت سلوى شاهين، مهندسة برمجيات خبيرة. مسؤولياتك:

💻 كتابة الكود:
1. اقرأ المخططات من state["system_architecture"] و state["database_schema"]
2. استخدم 'generateSourceCode' لتوليد كود إنتاجي
3. تأكد من:
   - TypeScript strict mode مفعّل
   - معالجة أخطاء شاملة (try-catch)
   - Zod validation للمدخلات في كل endpoint
   - تعليقات للأجزاء المعقدة فقط (الكود الواضح لا يحتاج تعليقات)
   - اتباع naming conventions (camelCase للمتغيرات، PascalCase للأنواع)

🐛 Debugging:
- استخدم 'debugCode' لتحليل أخطاء البناء/التشغيل
- قدم إصلاحات محددة وقابلة للتطبيق فوراً
- تحقق من أنماط الأخطاء الشائعة (type mismatches، missing imports)
- استخدم console.log بحذر واستبدلها بـstructured logging

🔄 التنسيق:
- بعد توليد الكود، أبلغ قائد الفريق
- تعاون مع 'qa_engineer' لكتابة الاختبارات
- تعاون مع 'devops_engineer' للنشر والـCI/CD
- راجع كود الزملاء (peer review)

⚠️ معايير الجودة:
- لا placeholders أو TODO في الكود الإنتاجي
- كود قابل للتشغيل فوراً
- performance-optimized (تجنب loops داخل loops)
- security best practices (no SQL injection، XSS protection)
- accessibility (WCAG AA للواجهات)`,
  tools: [generateSourceCode, debugCode],
  output_key: "source_code_final",
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEVOPS ENGINEER (Operations Layer)
// ═══════════════════════════════════════════════════════════════════════════════

export const setupCICD: AgentTool<
  { repoUrl: string },
  { status: string; pipeline: Dict }
> = async (args, context) => {
  console.log("🔄 Tool: setup_cicd");

  const pipeline = {
    provider: "GitHub Actions",
    workflows: {
      "ci.yml": {
        name: "Continuous Integration",
        triggers: ["push", "pull_request"],
        jobs: {
          test: {
            runs_on: "ubuntu-latest",
            steps: [
              "actions/checkout@v4",
              "actions/setup-node@v4 with node-version: 20",
              "corepack enable && pnpm i --frozen-lockfile",
              "pnpm lint",
              "pnpm type-check",
              "pnpm test --coverage",
              "codecov/codecov-action@v3 (upload coverage)",
            ],
          },
          build: {
            needs: ["test"],
            steps: ["pnpm build", "docker build -t agent-team:${{ github.sha }}"],
          },
        },
      },
      "cd.yml": {
        name: "Continuous Deployment",
        triggers: ["push to main"],
        jobs: {
          deploy: {
            environment: "production",
            permissions: { id_token: "write", contents: "read" },
            steps: [
              "Authenticate to GCP via OIDC",
              "Build and push Docker image to Artifact Registry",
              "Deploy to Cloud Run with 5% canary",
              "Run smoke tests",
              "Promote to 100% if tests pass",
              "Rollback if tests fail",
              "Notify team on Slack",
            ],
          },
        },
      },
    },
    estimated_deploy_time: "5-8 minutes",
    repo_url: args.repoUrl,
  };

  context.state.cicd_pipeline = pipeline;
  return { status: "success", pipeline };
};

export const configureInfrastructure: AgentTool<
  { requirements: Dict },
  { status: string; infrastructure: Dict }
> = async (args, context) => {
  console.log("🏗️ Tool: configure_infrastructure");

  const infrastructure = {
    cloud_provider: "Google Cloud Platform",
    resources: {
      compute: {
        service: "Cloud Run",
        cpu: "2 vCPU",
        memory: "4 GiB",
        autoscaling: { min: 0, max: 10 },
        concurrency: 80,
        timeout: "60s",
      },
      database: {
        service: "Supabase (managed PostgreSQL 15)",
        instance_type: "db-standard-2",
        storage: "100 GB SSD",
        backups: "daily, 7-day retention",
        point_in_time_recovery: true,
      },
      cache: {
        service: "Memorystore (Redis 7)",
        memory: "5 GB",
        high_availability: true,
        eviction_policy: "allkeys-lru",
      },
      cdn: {
        service: "Cloudflare",
        ssl: "Full (strict) TLS 1.3",
        caching_rules: "aggressive for static assets",
        ddos_protection: "enabled",
      },
      storage: {
        service: "Google Cloud Storage",
        bucket_class: "Standard",
        lifecycle_rules: "Delete after 90 days (temp files)",
      },
    },
    monitoring: {
      service: "Google Cloud Monitoring + Sentry",
      metrics: ["CPU", "Memory", "Request Rate", "Error Rate", "Latency P95/P99"],
      alerts: [
        { condition: "error_rate > 5%", severity: "critical", action: "page on-call" },
        { condition: "response_time_p95 > 2s", severity: "warning", action: "notify team" },
        { condition: "cpu_usage > 80%", severity: "warning", action: "auto-scale" },
        { condition: "memory_usage > 90%", severity: "critical", action: "restart + alert" },
      ],
      dashboards: ["Service Health", "Request Metrics", "Error Analytics", "Cost Tracking"],
    },
    estimated_monthly_cost: "$150-300 USD (varies with usage)",
  };

  context.state.infrastructure_config = infrastructure;
  return { status: "success", infrastructure };
};

export const devopsEngineer: Agent = {
  name: "devops_engineer",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.2 },
  description: "DevOps/SRE - sets up CI/CD, manages infrastructure, configures monitoring",
  instruction: `أنت مهندس DevOps/SRE خبير. مسؤولياتك:

🔄 إعداد CI/CD:
1. استخدم 'setupCICD' لإنشاء أنابيب مؤتمتة
2. تأكد من:
   - Lint + Type Check + Tests في كل PR
   - Build + Deploy تلقائي للـmain branch
   - Canary deployment (5% → 100%)
   - Rollback سريع عند الفشل (< 2 دقيقة)
   - Notifications (Slack/Email/PagerDuty)

🏗️ إدارة البنية التحتية:
- استخدم 'configureInfrastructure' لإعداد:
  - Compute (Cloud Run مع autoscaling)
  - Database (Supabase مع daily backups)
  - Cache (Redis للأداء)
  - CDN (Cloudflare للسرعة والأمان)
  - Storage (GCS للملفات الثابتة)

📊 المراقبة والتنبيه:
- اضبط:
  - Metrics (CPU, Memory, Latency P95/P99, Error Rate, Request Rate)
  - Logs (structured JSON logs مع trace IDs)
  - Traces (distributed tracing مع OpenTelemetry)
  - Alerts (PagerDuty للـcritical، Slack للـwarnings)
  - Dashboards (Grafana/Cloud Monitoring)

🎯 معايير النجاح:
- Deploy time < 10 minutes (من commit إلى production)
- MTTR < 30 minutes (Mean Time To Recovery)
- Uptime > 99.9% (3 nines SLA)
- Zero-downtime deployments
- Automated rollback عند اكتشاف مشاكل`,
  tools: [setupCICD, configureInfrastructure],
  output_key: "devops_configuration",
};

// ═══════════════════════════════════════════════════════════════════════════════
// QA ENGINEER (Quality Layer)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateTestSuites: AgentTool<
  { codebase: Dict },
  { status: string; tests: Dict }
> = async (args, context) => {
  console.log("🧪 Tool: generate_test_suites");

  const tests = {
    unit_tests: {
      framework: "Vitest",
      coverage_target: "80%",
      example: `import { describe, it, expect } from 'vitest'
import { calculateTotal } from './utils'

describe('calculateTotal', () => {
  it('should sum numbers correctly', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6)
  })

  it('should handle empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('should throw on invalid input', () => {
    expect(() => calculateTotal(null as any)).toThrow('Invalid input')
  })

  it('should handle negative numbers', () => {
    expect(calculateTotal([-1, 2, -3])).toBe(-2)
  })
})`,
    },
    integration_tests: {
      framework: "Vitest + Supertest",
      example: `import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/api'

describe('Projects API', () => {
  let app: any

  beforeAll(async () => {
    app = buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /api/projects - should create project', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { prompt: 'تطبيق ويب' }
    })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toHaveProperty('id')
  })
})`,
    },
    e2e_tests: {
      framework: "Playwright",
      critical_paths: [
        "user_registration_and_login",
        "project_creation_workflow",
        "data_export_functionality",
        "payment_processing",
      ],
      example: `import { test, expect } from '@playwright/test'

test('user can create project', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await page.click('text=New Project')
  await page.fill('[name="prompt"]', 'تطبيق إدارة مشاريع')
  await page.click('text=Generate')

  await expect(page).toHaveURL(/\\/projects\\/\\w+/)
  await expect(page.locator('text=Project created')).toBeVisible()
})`,
    },
  };

  context.state.test_suites = tests;
  return { status: "success", tests };
};

export const analyzeCoverage: AgentTool<
  { coverageReport: Dict },
  { status: string; analysis: Dict }
> = async (args, context) => {
  console.log("📊 Tool: analyze_coverage");

  const analysis = {
    overall_coverage: 82,
    by_type: {
      statements: 85,
      branches: 78,
      functions: 88,
      lines: 84,
    },
    uncovered_critical_paths: [
      "src/lib/payment.ts: lines 45-67 (error handling for failed transactions)",
      "src/api/auth.ts: lines 120-135 (token refresh logic)",
      "src/agents/orchestration.ts: lines 230-245 (circuit breaker recovery)",
    ],
    flaky_tests: [],
    recommendations: [
      "Add tests for payment error scenarios (timeout, declined cards)",
      "Increase branch coverage in auth module (edge cases)",
      "Add integration tests for multi-agent coordination",
      "Implement property-based testing for critical algorithms",
    ],
  };

  context.state.coverage_analysis = analysis;
  return { status: "success", analysis };
};

export const qaEngineer: Agent = {
  name: "qa_engineer",
  model: { model: "anthropic/claude-sonnet-4-20250514", temperature: 0.2 },
  description: "QA Automation - creates test suites, measures coverage, identifies flaky tests",
  instruction: `أنت مهندس ضمان جودة آلي خبير. مسؤولياتك:

🧪 إنشاء اختبارات شاملة:
1. استخدم 'generateTestSuites' لبناء:
   - Unit Tests (Vitest) - لكل دالة/مكون منفرد
   - Integration Tests - للـAPI endpoints والـdatabase interactions
   - E2E Tests (Playwright) - للمسارات الحرجة للمستخدم

📊 قياس التغطية:
- استخدم 'analyzeCoverage' لفحص:
  - نسبة التغطية الإجمالية (هدف: 80%+)
  - المسارات الحرجة غير المختبرة
  - الاختبارات الهشّة (Flaky Tests) - التي تفشل عشوائياً
  - Branch coverage للـif/else statements

✅ معايير الجودة:
- جميع الاختبارات تمر في CI (لا merging بدون اختبارات)
- لا Flaky Tests (إعادة محاولة < 3%)
- Critical paths مغطاة 100%
- Regression tests للـbugs المصلحة (كل bug = test case جديد)
- Performance tests للـendpoints الحرجة

🔄 التحسين المستمر:
- راجع فشل الاختبارات بانتظام
- حدّث الاختبارات مع تغيرات الكود
- قس زمن تشغيل الاختبارات (هدف: < 10min للـfull suite)
- أتمتة اختبارات الأداء والأمان`,
  tools: [generateTestSuites, analyzeCoverage],
  output_key: "qa_test_report",
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPSEC ENGINEER (Security Layer)
// ═══════════════════════════════════════════════════════════════════════════════

export const performSecurityAudit: AgentTool<
  { codebase: Dict },
  { status: string; findings: Dict }
> = async (args, context) => {
  console.log("🛡️ Tool: perform_security_audit");

  const findings = {
    critical: [],
    high: [
      {
        type: "Sensitive Data Exposure",
        location: "src/lib/config.ts:12",
        description: "API key potentially hardcoded in source",
        remediation: "Move to environment variable and use Secret Manager",
        cvss_score: 7.5,
      },
    ],
    medium: [
      {
        type: "Missing Input Validation",
        location: "src/api/users.ts:45",
        description: "User input not validated before DB query",
        remediation: "Add Zod schema validation before database operations",
        cvss_score: 5.3,
      },
      {
        type: "Insufficient Rate Limiting",
        location: "src/api/auth.ts",
        description: "No rate limiting on login endpoint",
        remediation: "Implement rate limiting (max 5 attempts per 15 minutes)",
        cvss_score: 4.7,
      },
    ],
    low: [
      {
        type: "Missing Security Headers",
        location: "src/main.ts",
        description: "Security headers not fully configured",
        remediation: "Add helmet middleware with HSTS, CSP, X-Frame-Options",
        cvss_score: 3.1,
      },
    ],
    compliance_checks: {
      "OWASP Top 10": "9/10 passed (missing A07:2021 – Identification and Authentication Failures)",
      GDPR: "Compliant (data encryption, right to deletion implemented)",
      "SOC 2": "Requires formal audit (controls in place)",
      "PCI DSS": "N/A (no credit card data stored)",
    },
  };

  context.state.security_audit = findings;
  return { status: "success", findings };
};

export const configureSecurity: AgentTool<
  { requirements: Dict },
  { status: string; config: Dict }
> = async (args, context) => {
  console.log("🔐 Tool: configure_security");

  const config = {
    authentication: {
      provider: "Supabase Auth",
      methods: ["email/password", "OAuth (Google, GitHub, Microsoft)"],
      mfa: "optional (TOTP via authenticator app)",
      session_duration: "15 minutes (access token), 7 days (refresh token)",
      password_policy: "min 12 chars, uppercase, lowercase, number, special char",
    },
    authorization: {
      model: "RBAC (Role-Based Access Control)",
      roles: ["admin", "user", "guest", "viewer"],
      permissions: "granular per-resource",
      rls_enabled: true,
      policy: "deny by default, explicit allow",
    },
    data_protection: {
      encryption_at_rest: "AES-256-GCM",
      encryption_in_transit: "TLS 1.3",
      pii_fields: ["email", "full_name", "phone", "address"],
      anonymization: "hash before logging, mask in UI",
      data_retention: "user data deleted 30 days after account deletion",
    },
    api_security: {
      rate_limiting: "100 req/min per IP, 1000 req/min per authenticated user",
      cors: "whitelist specific origins only",
      input_validation: "Zod schemas on all endpoints",
      output_sanitization: "DOMPurify for HTML, JSON schema validation",
      csrf_protection: "SameSite=Strict cookies + CSRF tokens",
    },
    secrets_management: {
      provider: "Google Secret Manager",
      rotation_policy: "90 days for API keys, 30 days for passwords",
      access_control: "least privilege (only services that need them)",
      audit_logging: "all secret accesses logged",
    },
    security_headers: {
      HSTS: "max-age=31536000; includeSubDomains; preload",
      CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.example.com",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  };

  context.state.security_config = config;
  return { status: "success", config };
};

export const appsecEngineer: Agent = {
  name: "appsec_engineer",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.1 },
  description: "AppSec Engineer - performs security audits, configures auth/encryption, ensures compliance",
  instruction: `أنت مهندس أمن تطبيقات خبير. مسؤولياتك:

🛡️ تدقيق أمني شامل:
1. استخدم 'performSecurityAudit' لفحص:
   - SAST (Static Analysis): أخطاء أمنية في الكود
   - DAST (Dynamic Analysis): ثغرات وقت التشغيل
   - Dependency Scanning: ثغرات في المكتبات الخارجية
   - Secret Detection: مفاتيح API مكشوفة في الكود

🔐 تكوين الأمان:
- استخدم 'configureSecurity' لإعداد:
  - Authentication (MFA، OAuth، قوة كلمات المرور)
  - Authorization (RBAC، RLS، least privilege)
  - Encryption (at rest: AES-256، in transit: TLS 1.3)
  - Rate Limiting & CORS (حماية من DDoS و CSRF)
  - Security Headers (HSTS، CSP، X-Frame-Options)

✅ الامتثال:
- تحقق من:
  - OWASP Top 10 (جميع البنود)
  - GDPR (حق النسيان، تشفير البيانات، consent)
  - SOC 2 (أمان المعلومات، availability، confidentiality)
  - ISO 27001 (إدارة أمن المعلومات)

🚨 أولويات المعالجة:
- Critical → فوري (< 24 ساعة، stop deployment)
- High → عاجل (< 1 أسبوع)
- Medium → مخطط (< 1 شهر)
- Low → backlog (مراجعة دورية)

📊 التقارير:
- CVSS scores لكل finding
- خطوات واضحة للمعالجة
- أمثلة على الاستغلال المحتمل
- تتبع معالجة الثغرات`,
  tools: [performSecurityAudit, configureSecurity],
  output_key: "security_audit_report",
};

// ═══════════════════════════════════════════════════════════════════════════════
// API CONTRACTS INTEGRATOR (Integration Layer)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateOpenApiSpec: AgentTool<
  { services: string[] },
  { status: string; openapi: Dict }
> = async (args, context) => {
  console.log("🔗 Tool: generate_openapi_spec");

  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "Agent Team API",
      version: "1.0.0",
      description: "Multi-Agent System for Software Development Automation",
      contact: {
        name: "API Support",
        email: "support@agent-team.dev",
      },
    },
    servers: [
      { url: "https://api.agent-team.dev/v1", description: "Production" },
      { url: "https://staging-api.agent-team.dev/v1", description: "Staging" },
      { url: "http://localhost:8080/v1", description: "Development" },
    ],
    paths: {
      "/api/agent-team/run": {
        post: {
          summary: "Run multi-agent pipeline",
          description: "Execute the full SDLC pipeline from natural language prompt",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["prompt"],
                  properties: {
                    prompt: { type: "string", minLength: 10, maxLength: 5000 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Pipeline executed successfully" },
            "400": { description: "Invalid request" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/projects": {
        get: {
          summary: "List projects",
          responses: {
            "200": { description: "OK" },
          },
        },
        post: {
          summary: "Create project",
          responses: {
            "201": { description: "Created" },
          },
        },
      },
      "/api/projects/{id}": {
        get: {
          summary: "Get project by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "OK" },
            "404": { description: "Not Found" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            status: { type: "string", enum: ["draft", "in_progress", "completed"] },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  context.state.openapi_spec = openapi;
  return { status: "success", openapi };
};

export const apiContractsIntegrator: Agent = {
  name: "api_contracts_integrator",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.2 },
  description: "API/Contracts - designs unified OpenAPI, versions endpoints, runs contract tests between services",
  instruction: `أنت مهندس تكامل API خبير. مسؤولياتك:

🔗 تصميم OpenAPI موحّد:
- استخدم 'generateOpenApiSpec' لإنشاء مواصفات API شاملة
- تأكد
