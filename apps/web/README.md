# Agent Team - Frontend

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

### Offline bootstrap (air-gapped environments)

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
   [web-offline] Hydrating PNPM store and Playwright cache...
   [web-offline] Running offline install...
   [web-offline] Building web app...
   [web-offline] Running tests...
   ```

4. **Acceptance criteria** – the offline session should finish with the following results:

   | مؤشر | النتيجة المتوقعة |
   | --- | --- |
   | التثبيت | Offline بدون أخطاء شبكة |
   | build | `pnpm web:build` ✅ |
   | unit tests | `pnpm web:test` ✅ |
   | e2e | `pnpm web:e2e` ✅ |
   | استعمال الشبكة | صفر طلبات HTTP إلى npm أو CDN |

If interactive artifact downloads are not allowed, mirror the manual step inside CI by downloading the cached tarballs before invoking the script:

```yaml
- uses: actions/download-artifact@v4
  with:
    name: pnpm-store
    path: ./vendor-artifacts
# Repeat for ms-playwright
- run: bash scripts/web-offline.sh ./vendor-artifacts
```

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

