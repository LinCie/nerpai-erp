# Implementation Plan: Product Module Elysia Migration

**Branch**: `006-product-elysia-migration` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-product-elysia-migration/spec.md`

## Summary

Migrate the products module's presentation layer from Next.js server actions to Elysia REST endpoints consumed via Eden Treaty and TanStack Query. This is a presentation-layer-only migration: no database schema changes, no application/domain/infrastructure changes. Three server action files (18 actions) are replaced by Elysia route plugins with Zod validation, ~15 TanStack Query hooks, and refactored components.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: Elysia 1.4.x, @elysiajs/eden 1.4.x, @elysiajs/cors 1.4.x, @tanstack/react-query 5.90.x, Next.js 16.1.6, React 19.2.3, Zod 4.3.6, TanStack Form 1.28.3, better-auth 1.4.18
**Storage**: PostgreSQL 18.x via Kysely 0.28.11 (no schema changes)
**Testing**: Jest v30.x + React Testing Library (when tests requested)
**Target Platform**: Web (Next.js App Router + Elysia REST API on Bun)
**Project Type**: web
**Performance Goals**: No regressions from current behavior; mutation round-trips stay under existing latency
**Constraints**: Presentation-layer migration only — domain, application, infrastructure layers unchanged; server components continue calling services directly for SSR
**Scale/Scope**: 3 server action files (18 actions) → 3 Elysia route plugins + 3 query key factories + ~15 TanStack Query hooks + ~12 component refactors

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [x] **I. Type Safety**: Strict mode enabled, no `any` types — Zod schemas provide runtime + compile-time safety; Eden Treaty propagates types end-to-end
- [x] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler) — TanStack Query hooks follow rules-of-hooks; no new manual memoization
- [x] **III. Next.js Standards**: App Router patterns, Elysia API mounted via catch-all route — existing `app/api/[[...slugs]]/route.ts` with `{ prefix: '/api' }`
- [x] **IV. A11y & Performance**: Semantic HTML, Core Web Vitals targets — UI unchanged, no new components; mutation hooks replace action state
- [x] **V. Code Quality**: Review process, security practices, better-auth on Elysia — auth macro enforces session + org on every protected route
- [x] **VI. Documentation-First Research**: Context7 verification for all library research — documented in [research.md](./research.md)
- [x] **VII. Vertical Slice Architecture**: Code organized in `src/modules/products/` with domain, application, infrastructure, presentation layers — new files go into `presentation/routes/` and `presentation/queries/`
- [x] **VIII. Database Naming, Extensions & Integrity**: No DB changes in this feature
- [x] **UUID v7 Compliance**: No new tables or PKs in this feature
- [x] **Soft Delete Enforcement**: Existing soft delete patterns preserved; API endpoints map to existing `softDelete()`/`restore()` service methods
- [x] **X. Multi-Tenancy**: organization_id scoping enforced via auth macro → `organization.id` passed to every service call
- [x] **XI. Contract Fidelity**: API contracts defined in [contracts/](./contracts/) with success + recoverable error behaviors per status code
- [x] **XII. Elysia REST API & Eden Treaty**: Route handlers define Zod request/response schemas (via Standard Schema, see Complexity Tracking); Eden Treaty client used for all client-side API calls; all `'use server'` directives removed
- [x] **XIII. TanStack Query**: Client components use `useQuery`/`useMutation`; query key factories in `presentation/queries/`; no `useEffect` + `setState`; server data not duplicated into Zustand

**Research Phase Check:**

- [x] All library versions verified via Context7 (where available)
- [x] Context7 library IDs documented in research.md
- [x] Prior knowledge invalidated when Context7 data retrieved
- [x] Performance/index claims: N/A — no new DB queries or indexes

## Project Structure

### Documentation (this feature)

```text
specs/006-product-elysia-migration/
├── plan.md              # This file
├── research.md          # Phase 0: Context7 + web search findings
├── data-model.md        # Phase 1: API data structures (no DB changes)
├── quickstart.md        # Phase 1: Development guide
├── contracts/           # Phase 1: API contracts
│   ├── product-api.md   # 6 endpoints
│   ├── attribute-api.md # 8 endpoints
│   └── variant-api.md   # 9 endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/[[...slugs]]/
│       └── route.ts                  # MODIFIED — .use(productModuleRoutes)
├── modules/
│   └── products/
│       ├── application/              # UNCHANGED
│       ├── domain/                   # UNCHANGED
│       ├── infrastructure/           # UNCHANGED
│       └── presentation/
│           ├── actions/              # REMOVED after migration
│           │   ├── product.actions.ts
│           │   ├── attribute.actions.ts
│           │   └── variant.actions.ts
│           ├── routes/               # NEW — Elysia route plugins
│           │   ├── index.ts          # Module plugin (composes all)
│           │   ├── product.routes.ts # Product CRUD endpoints
│           │   ├── attribute.routes.ts # Attribute + option endpoints
│           │   └── variant.routes.ts # Variant + assignment endpoints
│           ├── queries/              # NEW — TanStack Query hooks
│           │   ├── product-keys.ts
│           │   ├── attribute-keys.ts
│           │   ├── variant-keys.ts
│           │   ├── use-products.ts
│           │   ├── use-product-mutations.ts
│           │   ├── use-attributes.ts
│           │   ├── use-attribute-mutations.ts
│           │   ├── use-attribute-option-mutations.ts
│           │   ├── use-variants.ts
│           │   ├── use-variant-mutations.ts
│           │   └── use-check-sku.ts
│           ├── schemas/              # EXTENDED — Zod schemas for both client + API
│           ├── components/           # MODIFIED — refactored to use query hooks
│           ├── lib/                  # UNCHANGED
│           └── types/                # UNCHANGED
└── shared/
    ├── infrastructure/
    │   ├── api-client.ts             # UNCHANGED — Eden Treaty client
    │   └── auth/
    │       └── auth-plugin.ts        # UNCHANGED — Elysia auth macro
    └── presentation/
        └── queries/
            ├── create-query-keys.ts  # UNCHANGED — shared factory
            ├── treaty-fn.ts          # UNCHANGED — shared helper
            └── index.ts              # UNCHANGED
```

**Structure Decision**: Follows existing vertical slice architecture (VII). New `routes/` and `queries/` directories are added to the products module's presentation layer per constitution (XII, XIII). Existing Zod schemas in `presentation/schemas/` are extended with API response schemas. Zod serves both client-side form validation and Elysia route validation via Standard Schema per constitution XII.

## Complexity Tracking

> No violations — Zod for route schemas is now the constitutional standard (XII, v2.2.0).
