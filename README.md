# 🤖 Agent Team - Multi-Agent Software Development Automation Platform

<div dir="rtl">

## نظام متعدد الوكلاء لأتمتة دورة حياة تطوير البرمجيات بالكامل

**Agent Team** هو نظام ذكي يحول أفكارك المكتوبة بلغة طبيعية إلى تطبيقات برمجية جاهزة للإنتاج، من خلال تنسيق 21 وكيل ذكاء اصطناعي متخصص يعملون معاً لتنفيذ جميع مراحل SDLC.

</div>

---

## 🌟 Features / الميزات الرئيسية

- **🎯 Natural Language to Production**: حوّل وصف بسيط إلى تطبيق كامل
- **🤝 21 Specialized AI Agents**: وكلاء متخصصون (مدير منتج، معماري، مهندس، DevOps، QA، أمان...)
- **🏗️ Full SDLC Automation**: من PRD إلى الكود إلى النشر على Cloud
- **🔒 Enterprise-Grade Security**: RBAC، RLS، تشفير، auditing شامل
- **📊 Built-in Quality Assurance**: اختبارات تلقائية مع تغطية > 80%
- **🚀 Zero-Downtime Deployment**: CI/CD مع Canary و Rollback تلقائي
- **🌍 Arabic & English Support**: دعم كامل للغة العربية والإنجليزية
- **📈 Observable by Default**: Monitoring، Logging، Tracing، Alerting

---

## 🏛️ Architecture / البنية المعمارية

### Hierarchical Agent Structure

```
👤 User (Natural Language Prompt)
     ↓
👑 Awsa (Team Leader) - Orchestration Layer
     ├─→ 📋 Strategy Layer
     │    └── Kasya (Product Manager)
     ├─→ 🏗️ Design Layer  
     │    └── Amira (Architect)
     ├─→ ⚙️ Execution Layer
     │    └── Salwa (Software Engineer)
     ├─→ 🛡️ Quality & Security
     │    ├── DevOps/SRE
     │    ├── QA Engineer
     │    └── AppSec Engineer
     └─→ 🔗 Integration Layer
          └── API/Contracts Integrator
```

### Technology Stack

**Frontend**:
- React 18.2 + TypeScript 5.6
- Zustand (State Management)
- Tailwind CSS + shadcn/ui
- RTL Support (Arabic)

**Backend**:
- Fastify 4.28 (Node.js 20 LTS)
- TypeScript (Strict Mode)
- Zod (Validation)
- Pino (Structured Logging)

**Database**:
- PostgreSQL 15 (Supabase)
- Redis 7 (Caching)
- pgvector (for RAG/embeddings)

**AI Models**:
- Gemini 2.5 Pro
- Claude Sonnet 4
- Multi-model support

**Infrastructure**:
- Google Cloud Run (Containers)
- Cloudflare (CDN + DDoS)
- GitHub Actions (CI/CD)
- Sentry (Error Tracking)

---

## 🚀 Quick Start / البداية السريعة

### Prerequisites / المتطلبات

```bash
# Node.js 20+ required
node --version  # v20.11.0+

# pnpm 9+ required
corepack enable
corepack prepare pnpm@9 --activate
```

### Installation / التثبيت

```bash
# 1. Clone the repository
git clone https://github.com/your-org/agent-team.git
cd agent-team

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Run in development mode
pnpm dev
```

The server will start on `http://localhost:8080`

---

## 📁 Project Structure / هيكل المشروع

```
agent-team/
├── apps/
│   ├── server/               # Backend API
│   │   ├── src/
│   │   │   ├── agents/       # AI Agents definitions
│   │   │   │   ├── types.ts
│   │   │   │   ├── builtin.ts
│   │   │   │   └── registry.ts
│   │   │   ├── comm/         # Inter-agent communication
│   │   │   │   ├── schemas.ts
│   │   │   │   ├── bus.ts
│   │   │   │   ├── router.ts
│   │   │   │   └── debate.ts
│   │   │   ├── state/        # Session state management
│   │   │   │   ├── schemas.ts
│   │   │   │   └── store.ts
│   │   │   ├── orchestration/ # Pipeline execution
│   │   │   │   ├── types.ts
│   │   │   │   ├── executor.ts
│   │   │   │   ├── pipeline.ts
│   │   │   │   └── runtime.ts
│   │   │   ├── api.ts        # Fastify API routes
│   │   │   └── main.ts       # Entry point
│   │   └── test/             # API tests
│   └── ops/                  # Operational scripts
│       └── smoke.ts          # Smoke tests
├── examples/
│   └── python/               # Python examples (RAG eval)
├── infra/
│   ├── cloudrun/             # Cloud Run config
│   └── cloudflare/           # Cloudflare worker
├── .github/
│   └── workflows/            # CI/CD pipelines
│       ├── ci.yml
│       └── cd.yml
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # pnpm workspace config
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Vitest config
├── .env.example              # Environment variables template
└── README.md                 # This file
```

---

## 🔧 Configuration / التكوين

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# HTTP Server
PORT=8080
NODE_ENV=development

# Agent Communication Security
AGENT_SHARED_SECRET=your-secret-key-here

# AI Model API Keys
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Cloud Configuration (for deployment)
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
```

---

## 🧪 Testing / الاختبارات

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test --coverage
```

### Coverage Targets

- Statements: 80%+
- Branches: 75%+
- Functions: 85%+
- Lines: 80%+

---

## 📦 Build & Deployment / البناء والنشر

### Local Build

```bash
# Build TypeScript to JavaScript
pnpm build

# Run production build locally
pnpm start
```

### Docker Build

```bash
# Build Docker image
docker build -f apps/server/Dockerfile -t agent-team:latest .

# Run container
docker run -p 8080:8080 --env-file .env agent-team:latest
```

### Deploy to Cloud Run

```bash
# Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy agent-team \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080
```

**Automated CI/CD**: Push to `main` branch triggers automatic deployment via GitHub Actions.

---

## 📡 API Usage / استخدام API

### Run Agent Pipeline

**POST** `/api/agent-team/run`

```bash
curl -X POST http://localhost:8080/api/agent-team/run \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "تطبيق ويب لإدارة المشاريع مع مصادقة ولوحات بيانات"
  }'
```

**Response**:
```json
{
  "result": {
    "ok": true,
    "stepResults": [...],
    "elapsedMs": 12345
  },
  "snapshot": {
    "version": 1,
    "data": {
      "prd_document": {...},
      "system_architecture": {...},
      "database_schema": {...},
      "generated_code": {...}
    }
  }
}
```

### Health Check

**GET** `/health`

```bash
curl http://localhost:8080/health
```

---

## 🤖 The 21 Agents / الوكلاء الـ21

### Core Agents / الوكلاء الأساسيون

1. **👑 Awsa (Team Leader)** - Orchestrates all agents, manages debates
2. **📋 Kasya (Product Manager)** - Creates PRD, validates market fit
3. **🏗️ Amira (Architect)** - Designs system architecture and database schemas
4. **💻 Salwa (Software Engineer)** - Writes production-ready code
5. **🔄 DevOps Engineer** - Sets up CI/CD, manages infrastructure
6. **🧪 QA Engineer** - Creates test suites, measures coverage
7. **🛡️ AppSec Engineer** - Performs security audits, configures encryption
8. **🔗 API Integrator** - Designs OpenAPI specs, runs contract tests

### Extended Agents / الوكلاء الإضافيين

9. **⚡ Performance Engineer** - Optimizes latency, analyzes bottlenecks
10. **🎨 UX/UI Designer** - Creates design systems, ensures accessibility
11. **🤖 Prompt Architect** - Designs prompt templates, implements guardrails
12. **📚 Knowledge Curator** - Manages data sources, deduplicates content
13. **👁️ Observability Monitor** - Sets up logging/tracing/metrics
14. **🚀 Release Manager** - Manages versioning, feature flags, rollouts
15. **🔐 Privacy Officer** - Ensures GDPR/CCPA compliance
16. **🌍 i18n Specialist** - Implements internationalization, RTL support
17. **📖 Documentation Lead** - Writes guides, API docs, examples
18. **💰 FinOps Analyst** - Analyzes cloud costs, optimizes resources
19. **📊 Data Analyst** - Creates BI dashboards, analyzes data models
20. **🔍 Retrieval Evaluator** - Evaluates RAG quality, optimizes pipelines
21. **🚨 Incident Commander** - Manages outages, writes postmortems

---

## 🔄 Agent Communication Protocol

Agents communicate via a **Message Bus** with the following features:

- **HMAC Signatures**: All messages cryptographically signed
- **Idempotency**: Duplicate detection via message IDs
- **TTL & Retry**: Automatic retry with exponential backoff
- **Debate Mechanism**: Agents can propose, critique, and vote on decisions
- **Circuit Breaker**: Prevents cascade failures

### Message Types

- `TASK`: Execute a specific task
- `TOOL_CALL`: Invoke a tool on target agent
- `DEBATE_PROPOSAL`: Propose a solution
- `DEBATE_CRITIQUE`: Critique a proposal
- `DEBATE_DECISION`: Leader's final decision
- `ERROR`: Error response

---

## 🎯 Pipeline Stages / مراحل التنفيذ

The system executes a **5-stage pipeline**:

1. **Assemble** (تجميع): PRD creation, architecture design
2. **Grade** (تقييم): Security audit, test generation
3. **Mix** (دمج): Code generation, API contracts
4. **Render** (إنتاج): Infrastructure setup, CI/CD
5. **Export** (تصدير): Coverage analysis, cost optimization

Each stage can have multiple parallel steps with retry logic and circuit breakers.

---

## 🛡️ Security Features / ميزات الأمان

- **Authentication**: OAuth 2.0 + JWT (Supabase Auth)
- **Authorization**: RBAC + Row-Level Security (RLS)
- **Encryption**: TLS 1.3 (transit), AES-256 (rest)
- **Input Validation**: Zod schemas on all endpoints
- **Rate Limiting**: 100 req/min per IP
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Secrets Management**: Google Secret Manager
- **Compliance**: OWASP Top 10, GDPR, SOC 2

---

## 📊 Monitoring & Observability

### Metrics

- Request rate, latency (P50/P95/P99)
- Error rate, success rate
- CPU, memory usage
- Database connection pool
- Cache hit rate

### Logging

- Structured JSON logs (Pino)
- Correlation IDs for tracing
- Log levels: debug, info, warn, error

### Alerting

- Error rate > 5% → Page on-call
- P95 latency > 2s → Notify team
- CPU usage > 80% → Auto-scale

---

## 🧩 Extending the System / توسيع النظام

### Adding a New Agent

1. Define agent in `apps/server/src/agents/builtin.ts`:

```typescript
export const myNewAgent: Agent = {
  name: "my_new_agent",
  model: { model: "gemini/gemini-2.5-pro", temperature: 0.3 },
  description: "Does something awesome",
  instruction: "Your detailed instructions here...",
  tools: [myTool1, myTool2],
  output_key: "my_output",
};
```

2. Add to registry in `apps/server/src/agents/registry.ts`:

```typescript
export const AGENTS: Agent[] = [
  // ... existing agents
  myNewAgent,
];
```

3. Create tools:

```typescript
export const myTool1: AgentTool<Args, Return> = async (args, context) => {
  // Implementation
  context.state.my_key = result;
  return { status: "success", result };
};
```

---

## 🤝 Contributing / المساهمة

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** tests for your changes
4. **Ensure** all tests pass (`pnpm test`)
5. **Lint** your code (`pnpm lint`)
6. **Commit** with clear messages
7. **Push** to your branch
8. **Open** a Pull Request

### Code Standards

- TypeScript strict mode
- 80%+ test coverage
- ESLint + Prettier formatting
- Meaningful commit messages

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

This project was inspired by:
- Vertex AI Agent Engine
- Multi-Agent Systems research
- SDLC automation best practices
- The open-source community

---

## 📞 Support

- **Documentation**: [docs.agent-team.dev](https://docs.agent-team.dev)
- **Issues**: [GitHub Issues](https://github.com/your-org/agent-team/issues)
- **Discord**: [Join our community](https://discord.gg/agent-team)
- **Email**: support@agent-team.dev

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Multi-cloud support (AWS, Azure)
- [ ] Visual pipeline editor
- [ ] Advanced RAG with vector search
- [ ] Real-time collaboration

### Q2 2025
- [ ] Mobile app support (React Native)
- [ ] Plugin system for custom agents
- [ ] Kubernetes deployment
- [ ] GraphQL API

### Q3 2025
- [ ] Voice interface (Arabic/English)
- [ ] Automated code reviews
- [ ] Performance optimization AI
- [ ] Cost prediction models

---

<div dir="rtl">

## 🌟 لماذا Agent Team؟

**Agent Team** ليس مجرد أداة لتوليد الكود - إنه **فريق كامل من الخبراء الأذكياء** يعملون معاً لتحويل فكرتك إلى منتج حقيقي.

### الفوائد الرئيسية:

✅ **توفير الوقت**: ما كان يستغرق أسابيع، يتم في ساعات
✅ **جودة عالية**: كود احترافي مع اختبارات شاملة
✅ **أمان مدمج**: لا حاجة للقلق حول الثغرات
✅ **قابل للتوسع**: بنية معمارية تدعم النمو
✅ **دعم عربي**: واجهة ووثائق بالعربية

</div>

---

## 💡 Example Use Cases / أمثلة الاستخدام

1. **SaaS Startup**: بناء MVP سريع للتحقق من الفكرة
2. **Enterprise Internal Tools**: أتمتة بناء أدوات داخلية
3. **Agency Projects**: تسليم مشاريع العملاء بسرعة
4. **Learning & Prototyping**: تعلم أفضل الممارسات من الكود المولد

---

**Made with ❤️ by the Agent Team Contributors**

---

<div dir="rtl">

## 🚀 ابدأ الآن

```bash
# استنسخ المشروع
git clone https://github.com/your-org/agent-team.git

# ثبّت الاعتماديات
cd agent-team && pnpm install

# شغّل الخادم
pnpm dev

# جرّب API
curl -X POST http://localhost:8080/api/agent-team/run \
  -H "Content-Type: application/json" \
  -d '{"prompt": "تطبيق بسيط للمهام اليومية"}'
```

**ملاحظة**: تأكد من تكوين `.env` قبل التشغيل.

</div>

---

**Star ⭐ the project if you find it useful!**# agent-team
