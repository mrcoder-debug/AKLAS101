# AKLAS LMS

A production-grade Learning Management System for educational institutions. Built with Next.js 15 (App Router, RSC), TypeScript, Prisma, PostgreSQL, and Auth.js v5.

## Key traits

- **Closed system** — all accounts are admin-provisioned (no public signup).
- **Three roles** — Admin, Instructor, Student — each with precise authorization rules enforced at the service layer.
- **Strictly layered** — `src/services/*` is the only layer that touches Prisma. Server Actions and API routes are thin adapters. Validation via shared Zod schemas.
- **Immediate revocation** — bumping a user's `tokenVersion` invalidates live sessions on the next request.
- **Soft deletes** for User/Course/Lesson/Quiz. Append-only history for QuizAttempt/LessonProgress.
- **Pluggable simulator adapter** for embedded interactive content (iframe sandbox v1, extensible to native adapters).

## Quick start

```bash
pnpm install
cp .env.example .env          # fill in AUTH_SECRET
pnpm db:up                    # start Postgres in Docker
pnpm prisma:migrate            # apply schema
pnpm db:seed                   # seed users, courses, quizzes
pnpm dev                       # http://localhost:3000
```

Seeded logins (dev only):
- Admin: `admin@aklas.test` / `Admin123!`
- Instructor: `mara@aklas.test` / `Instructor123!`
- Student: `sam@aklas.test` / `Student123!`

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next dev server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest unit/service tests |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm prisma:migrate` | Apply new migrations in dev |
| `pnpm prisma:reset` | Drop + recreate DB + re-seed |
| `pnpm prisma:studio` | Prisma Studio |

## Project layout

See [the implementation plan](../.claude/plans/you-are-a-senior-giggly-minsky.md) in `~/.claude/plans/` for the full architectural rationale.

Top-level directories:

- `prisma/` — schema, migrations, seed
- `src/services/` — business logic, authorization, error taxonomy
- `src/server/` — Auth.js config, server actions, API response helpers
- `src/schemas/` — Zod schemas shared between client and server
- `src/app/` — Next.js App Router (route segments, layouts, RSC)
- `src/components/` — UI primitives, layout, shared feature components
- `src/simulator/` — pluggable simulator adapters
- `tests/unit/` — Vitest unit tests
- `tests/e2e/` — Playwright end-to-end tests

## Hard rule

Only `src/services/*` and `prisma/*` may import `@prisma/client`. ESLint enforces this. If you find yourself reaching for Prisma in a route or component, write a service method and call that instead.
