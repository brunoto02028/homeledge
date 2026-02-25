# Contributing to HomeLedger

Thank you for your interest in contributing to HomeLedger! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

---

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/homeledge.git
cd homeledge
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Fill in your local PostgreSQL connection and at least one AI API key
```

### 3. Set Up Database

```bash
npx prisma db push
npx prisma generate
npx tsx prisma/seed-academy.ts
npx tsx prisma/seed-categorization-rules.ts
```

### 4. Run Dev Server

```bash
npm run dev
```

---

## Development Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/short-description` | `feat/exam-timer-pause` |
| Bug fix | `fix/short-description` | `fix/category-filter-crash` |
| Docs | `docs/short-description` | `docs/api-reference-update` |
| Refactor | `refactor/short-description` | `refactor/sync-logic` |

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add exam pause/resume functionality
fix: correct VAT calculation for flat rate scheme
docs: update API reference with new academy endpoints
refactor: extract sync logic into shared module
chore: update Prisma to v6.8
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure `npm run lint` passes
4. Ensure `npx tsc --noEmit` has no new errors
5. Test your changes locally
6. Open a PR with a clear description of what changed and why
7. Link any related issues

---

## Code Style

### General Rules

- **TypeScript** for all new code — no plain JavaScript
- **Functional components** with hooks (no class components)
- Use `'use client'` directive only when the component needs client-side features
- Keep API routes in `app/api/` following the existing folder convention
- Use `(prisma as any)` for new Prisma models until `prisma generate` runs on VPS

### File Structure

- Pages: `app/<feature>/page.tsx` + `app/<feature>/<feature>-client.tsx`
- API routes: `app/api/<feature>/route.ts`
- Shared logic: `lib/<module>.ts`
- Components: `components/<name>.tsx`
- UI primitives: `components/ui/<name>.tsx` (shadcn/ui)

### Styling

- **Tailwind CSS** for all styling — no CSS modules or styled-components
- Always include `dark:` variants for dark mode support
- Use `cn()` utility from `lib/utils.ts` for conditional classes

### API Routes Pattern

```typescript
import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await requireUserId();
    // ... your logic
    return NextResponse.json({ data });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Feature] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### i18n

- All user-facing labels should use translation keys from `messages/en.json` and `messages/pt-BR.json`
- Navigation labels go in `nav.*` namespace
- Use `useTranslation()` hook in components

---

## Database Changes

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` locally
3. Run `npx prisma generate` to update the client
4. If adding seed data, create `prisma/seed-<feature>.ts`
5. Document the new models in your PR description

---

## Testing

- E2E tests live in `e2e/` (Puppeteer)
- Run with: `npx tsx e2e/auth.test.ts`
- When adding a new page, ensure it loads without errors
- When adding an API route, test with `curl` or Postman

---

## Reporting Issues

Use GitHub Issues with one of these labels:

- `bug` — Something isn't working
- `feature` — New feature request
- `docs` — Documentation improvement
- `security` — Security vulnerability (use private disclosure)

Include:
- Steps to reproduce (for bugs)
- Expected vs actual behaviour
- Screenshots if relevant
- Browser and OS info

---

## Questions?

Open a [Discussion](https://github.com/brunoto02028/homeledge/discussions) or reach out to the maintainer.
