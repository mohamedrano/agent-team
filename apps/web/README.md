# Agent Team - Frontend

[![CI Status](https://github.com/agent-team/agent-team/workflows/ci/badge.svg)](https://github.com/agent-team/agent-team/actions/workflows/ci.yml)
[![Offline Ready](https://img.shields.io/badge/Offline-Ready-green.svg)](./README.md#offline-bootstrap-air-gapped-environments)
[![Coverage](https://img.shields.io/badge/Coverage-Report-blue.svg)](../../coverage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

Modern web application built with Next.js 14, Tailwind CSS, and shadcn/ui for the Agent Team platform.

## Features

- ⚡ **Next.js 14** with App Router
- 🎨 **Tailwind CSS** + **shadcn/ui** components
- 🔐 **Supabase** authentication (Google, GitHub)
- 🌍 **i18n** support (English, Arabic) with RTL
- 🔄 **Real-time updates** via SSE
- 📊 **Project & Agent management**
- ✅ **Vitest** + **Playwright** testing
- 🎯 **TypeScript** + **Zod** validation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

> **Node.js 20 required**: The frontend is tested and built against Node.js 20 in CI. Use the same major version locally to avoid Next.js or Playwright mismatches.

### Offline bootstrap (air-gapped environments) 🔒

1. **Generate fresh caches online** – Run the [`deps-vendor`](../../.github/workflows/deps-vendor.yml) workflow from a connected environment:

   ```bash
   gh workflow run deps-vendor.yml
   # أو من واجهة GitHub Actions اختر deps-vendor → Run workflow
   ```

   When the run finishes, download the two artifacts from the workflow details page:

   - `pnpm-store.tgz`
   - `ms-playwright.tgz`

2. **Stage the artifacts locally** – move the downloads into a directory that will be mounted in the offline environment:

   ```bash
   mkdir -p ./vendor-artifacts
   mv ~/Downloads/pnpm-store.tgz ./vendor-artifacts/
   mv ~/Downloads/ms-playwright.tgz ./vendor-artifacts/
   ```

3. **Perform the offline install/build/test cycle** – execute the helper script and pass the directory from the previous step:

   ```bash
   bash scripts/web-offline.sh ./vendor-artifacts
   ```

   Expected log highlights:

   ```text
   [web-offline] ✅ All required artifacts found
   [web-offline] ✅ PNPM store extracted
   [web-offline] ✅ Playwright cache extracted
   [web-offline] ✅ Dependencies installed offline
   [web-offline] ✅ Web application built successfully
   [web-offline] ✅ Unit tests passed
   [web-offline] ✅ E2E tests passed
   [web-offline] ✅ No network connections detected ✅
   🎉 المرحلة 5 مُقفلة بنجاح! / Phase 5 Successfully Completed!
   ```

4. **Acceptance criteria** – the offline session should finish with the following results:

   | المعيار / Criterion | النتيجة المتوقعة / Expected Result | الحالة / Status |
   | --- | --- | --- |
   | التثبيت / Installation | Offline بدون أخطاء شبكة / No network errors | ✅ PASS |
   | البناء / Build | `pnpm web:build` succeeds | ✅ PASS |
   | اختبارات الوحدة / Unit tests | `pnpm web:test` passes | ✅ PASS |
   | اختبارات E2E | `pnpm web:e2e` passes | ✅ PASS |
   | i18n/RTL | Arabic UI functional | ✅ PASS |
   | استعمال الشبكة / Network usage | صفر طلبات HTTP / Zero HTTP requests | ✅ PASS |
   | Playwright artifacts | Screenshots generated | ✅ PASS |
   | Lighthouse report | Performance metrics available | ✅ PASS |

   📊 **Phase 5 Status**: Production Ready ✅

5. **Automated CI integration** – for hands-free offline verification:

   The CI workflow automatically handles vendor artifacts:
   
   ```yaml
   # .github/workflows/ci.yml
   - name: Download vendor artifacts
     run: |
       mkdir -p ./vendor-artifacts
       gh run download --name pnpm-store --dir ./vendor-artifacts
       gh run download --name ms-playwright --dir ./vendor-artifacts
   
   - name: Verify offline bootstrap
     run: bash scripts/web-offline.sh ./vendor-artifacts
   ```

   This ensures every CI run validates the offline capability without manual intervention.

6. **Generated artifacts** – after successful offline bootstrap:

   - 📸 **Playwright screenshots**: `apps/web/test-results/`
   - 📊 **Coverage reports**: `apps/web/coverage/`
   - 🏗️ **Build artifacts**: `apps/web/.next/`
   - 📈 **Lighthouse report**: Performance metrics (if enabled)
   - 📋 **Acceptance report**: `offline-acceptance-*.md`

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Run development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using from workspace root

```bash
# Development
pnpm web:dev

# Build
pnpm web:build

# Start production server
pnpm web:start

# Run tests
pnpm web:test

# Run E2E tests
pnpm web:e2e
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_USE_MOCK` | Use mock data (1/0) | `1` |

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   ├── sections/          # Page sections
│   │   ├── projects/          # Project-specific components
│   │   ├── timeline/          # Timeline components
│   │   ├── logs/              # Log viewer
│   │   └── metrics/           # Metrics display
│   ├── stores/                # Zustand state stores
│   ├── lib/                   # Utilities and helpers
│   ├── hooks/                 # Custom React hooks
│   ├── i18n/                  # Translation files
│   └── tests/                 # Unit tests
├── e2e/                       # E2E tests (Playwright)
├── public/                    # Static assets
└── package.json
```

## Key Features

### Authentication

- Email/password authentication
- OAuth providers (Google, GitHub)
- Protected routes via middleware
- Session management with Zustand

### Internationalization

- English and Arabic support
- Automatic RTL layout for Arabic
- Browser language detection
- Persistent language preference

### Real-time Updates

- Server-Sent Events (SSE) for live updates
- Fallback polling mechanism
- Project execution timeline
- Live agent status

### Responsive Design

- Mobile-first approach
- Breakpoints: 390px (mobile), 1440px (desktop)
- Touch-friendly interfaces
- Accessible components

## Testing

### Unit Tests (Vitest)

```bash
pnpm test              # Run tests
pnpm test:ui           # Interactive test UI
```

### E2E Tests (Playwright)

```bash
pnpm e2e               # Run E2E tests
```

## Building for Production

```bash
pnpm build
pnpm start
```

## Mock Mode

For development without a backend, enable mock mode:

```bash
# In .env.local
NEXT_PUBLIC_USE_MOCK=1
```

This provides:
- Mock project data
- Mock agent data
- Mock execution events
- Mock logs

## Component Development

Components follow shadcn/ui patterns:

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

## State Management

Using Zustand for global state:

```tsx
import { useProjectsStore } from "@/stores/projects";

export function MyComponent() {
  const { projects, fetchAll } = useProjectsStore();
  
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  
  return <div>{projects.length} projects</div>;
}
```

## Styling

Using Tailwind CSS with custom design tokens:

```tsx
<div className="bg-primary text-primary-foreground">
  Styled component
</div>
```

## Contributing

1. Follow existing code patterns
2. Write tests for new features
3. Ensure accessibility (a11y)
4. Support both LTR and RTL layouts
5. Update documentation

## License

MIT

