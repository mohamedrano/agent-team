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

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. Run development server:
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

