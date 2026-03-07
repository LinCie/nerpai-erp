<!--

# SYNC IMPACT REPORT

Version change: 2.2.0 → 2.3.0 (Minor - Elysia route validation now allows
both TypeBox and Zod)

Modified principles:

- XII. Elysia REST API & Eden Treaty (Zod and TypeBox both permitted for
  route request/response schemas; TypeBox allowed as default for native
  Elysia integration; Zod retained for form validation reuse)

Modified sections:

- Technology Standards (explicit note that route validation may use
  TypeBox or Zod; TypeBox for native Elysia integration, Zod for reuse
  with forms)
- Development Workflow / Quality Gates (gate 15 updated to allow both
  TypeBox and Zod for route schemas)

Templates requiring updates:
✅ .specify/templates/plan-template.md (Constitution Check XII updated
  to allow TypeBox and Zod)
✅ .specify/templates/spec-template.md (CR-003 updated to allow both)
✅ .specify/templates/tasks-template.md (foundational and audit tasks
  updated to allow both)
⚠ .specify/templates/commands/*.md (directory not present; no command
  templates to validate)

Runtime docs requiring updates:
✅ .agent/rules/elysia-api-guide.md (TypeBox allowed for routes,
  Zod remains for forms)

Follow-up TODOs:

- None

-->

# NERPAI ERP Constitution

## Core Principles

### I. Type Safety First

TypeScript strict mode MUST be enabled at all times. The `any` type is
prohibited; use `unknown` with proper type guards instead.

- Enable `strict: true` in tsconfig.json (non-negotiable)
- Handle `null` and `undefined` explicitly with strictNullChecks
- Use discriminated unions for state management
- Prefer interfaces for public APIs, types for unions/intersections
- Throw Error objects, never strings; consider Result/Option types for
  functional error handling

**Rationale**: Type safety catches bugs at compile time, improves IDE support,
and serves as living documentation.

### II. React Component Discipline

Follow React Hooks rules strictly. Components MUST be focused, testable, and
performant. React Compiler handles automatic memoization.

- Never call hooks inside loops or conditions
- Use custom hooks to encapsulate reusable logic (prefix with `use`)
- Minimize manual memoization (`useMemo`, `useCallback`, `useReducer`) - rely on
  React Compiler
- Keep effects focused on a single concern with proper cleanup
- Use ESLint plugin for React hooks

**Rationale**: Predictable component behavior, better performance, easier testing
and debugging. React Compiler eliminates the need for manual memoization in most
cases.

### III. Next.js App Router Standards

Leverage Next.js 16 App Router capabilities for optimal performance and UX.
All API mutations and queries are handled by the Elysia REST API layer (see
XIII); Next.js is responsible for rendering, routing, and server components.

- Server Components are the default; use `'use client'` directive only when
  necessary
- Mutations and data fetching from client components MUST go through the
  Eden Treaty client (see XIII)
- API route contracts MUST match documented contracts for success, validation,
  authorization, and not-found outcomes
- Use streaming and Suspense for progressive loading
- Implement proper `loading.tsx` and `error.tsx` boundaries
- Elysia API routes are mounted via a Next.js catch-all route handler at
  `app/api/[[...slugs]]/route.ts`
- Internationalization via next-intl for multi-language support

**Rationale**: Server Components reduce client bundle size; proper error
boundaries improve UX; separating the API layer into Elysia enables a REST API
that can be consumed by any client, not just the Next.js frontend.

### IV. Accessibility & Performance

All user-facing features MUST meet accessibility standards and performance
budgets.

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- ARIA attributes only when semantic HTML is insufficient
- Tailwind CSS for styling; avoid arbitrary values when design tokens exist
- Target Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Images use `next/image` with proper sizing and lazy loading
- Keyboard navigation MUST work for all interactive elements

**Rationale**: Accessibility is a legal requirement and moral obligation;
performance directly impacts user satisfaction and conversion.

### V. Code Quality & Security

Code MUST be reviewed, tested when specified, and follow security best
practices.

- All code changes require review before merge
- Secrets and credentials MUST NEVER be committed
- Sanitize and validate all user inputs
- Use parameterized queries; never concatenate SQL
- Authentication via better-auth mounted on Elysia (see XIII); authorize on
  every protected route using the Elysia auth macro
- Log security-relevant events without exposing sensitive data

**Rationale**: Security breaches are costly; code review catches issues
automation misses; consistent practices reduce cognitive load.

### VI. Documentation-First Research

All research MUST utilize Context7 when available as the authoritative source
for library documentation. Previous knowledge of libraries is invalidated when
Context7 documentation is accessible.

- MUST resolve library IDs via Context7 before querying documentation
- MUST use specific versions from Context7 (for example, `/org/project/version`)
  when available
- MUST prioritize Context7 code snippets and examples over external sources
- MUST invalidate prior library assumptions when Context7 data is retrieved
- SHOULD document which Context7 library IDs were referenced in research artifacts

**Rationale**: Context7 provides version-specific, authoritative documentation
from official sources. This prevents knowledge drift and version mismatch.

### VII. Vertical Slice Architecture with Clean Architecture

Code MUST be organized by feature modules using vertical slices, with each
module implementing Clean Architecture layers.

**Module Structure**:
All feature code lives in `src/modules/[module-name]/` with four distinct layers:

- **Domain Layer**: Entities (database tables) and domain types
  - Location: `domain/entities/`, `domain/types/`
  - Contains: Entity definitions, value objects, domain events

- **Application Layer**: Business logic and repository interfaces
  - Location: `application/services/`, `application/repositories/`,
    `application/types/`
  - Contains: Services implementing business rules, repository interfaces (not
    implementations), DTOs for service/repository contracts

- **Infrastructure Layer**: Repository implementations and external integrations
  - Location: `infrastructure/repositories/`, `infrastructure/external/`
  - Contains: Concrete repository implementations using Kysely, external API
    clients, database mappers

- **Presentation Layer**: Outward-facing interfaces
  - Location: `presentation/routes/`, `presentation/api/`,
    `presentation/components/`, `presentation/stores/`, `presentation/types/`,
    `presentation/schemas/`
  - Contains: Elysia route handlers (grouped by resource), React components,
    state management (Zustand), Zod schemas, presentation types

**Cross-Cutting Concerns**:

- Shared utilities: `src/lib/`
- Cross-module types: `src/types/`
- Global styles: `src/styles/`

**Rationale**: Vertical slices group related code by feature rather than
technical layer, improving discoverability and reducing merge conflicts.
Dependency direction remains explicit and framework-independent.

### VIII. Database Naming, Extensions & Integrity

Database schemas use snake_case; application code uses camelCase; integrity rules
MUST be enforced at both application and database layers.

- Database tables and columns MUST use snake_case (for example, `user_id`,
  `created_at`)
- TypeScript interfaces and application code MUST use camelCase (for example,
  `userId`, `createdAt`)
- All primary key columns MUST be UUID type and auto-generated using
  `uuidv7()` SQL function
- NEVER use auto-incrementing integers, serial types, or alternate ID
  generation methods
- Kysely camelCase plugins MUST handle case conversion; manual column mapping is
  prohibited unless explicitly justified
- Migrations MUST be created using `bun db:migrate:create`
- Migrations MUST be executed using `bun db:migrate`; alternate execution paths
  are prohibited
- Database types MUST NOT be edited manually; regenerate using `bun db:codegen`
- PostgreSQL extensions used by features MUST be declared in idempotent
  migrations (`CREATE EXTENSION IF NOT EXISTS ...`)
- Domain invariants validated in application code MUST also be enforced in DB
  constraints where feasible (for example, non-empty trimmed names)
- Query patterns introduced in features MUST have matching index strategies;
  substring search (`ILIKE '%...%'`) MUST use `pg_trgm` indexes or documented
  equivalent

**Rationale**: Consistent naming reduces cognitive load; DB-enforced integrity
prevents bypass of application validation; explicit extension/index governance
keeps performance and rollback behavior predictable.

### IX. Soft Delete Enforcement

All database entities MUST implement soft delete patterns; physical deletion is
prohibited except for explicit data purging operations.

- All tables MUST include `deleted_at` timestamp column (nullable, null = not
  deleted)
- Queries MUST filter out soft-deleted records by default using
  `deleted_at IS NULL`
- Repository implementations MUST provide explicit `softDelete()` and
  `restore()` methods
- NEVER use SQL `DELETE` statements for normal entity removal
- Hard delete operations MUST require explicit approval and audit logging
- Soft-deleted records MUST remain accessible via explicit include-deleted query
  options
- Foreign key constraints MUST handle soft-deleted references appropriately

**Rationale**: Soft deletes preserve auditability, enable recovery, and reduce
accidental data loss risk.

### X. Multi-Tenancy & Organization Isolation

All business data MUST be scoped to an organization. The system implements
multi-tenancy using better-auth's organization plugin with strict data
isolation.

- All business entity tables MUST include `organization_id` column (UUID,
  foreign key to `organization.id`, not null)
- All database queries MUST filter by current active organization context
- Repository methods MUST accept `organizationId` as a required parameter
- Elysia API routes MUST validate active organization membership before data
  operations (enforced via the auth macro or route-level guards)
- Users can only access data from organizations where they are active members
- Organization context is stored in session (`active_organization_id`) and
  validated on protected routes
- Users without an active organization MUST be redirected to organization
  selection page
- Support organization switching without full re-authentication
- Cross-organization access is prohibited; super-admin access requires explicit
  design plus audit logging

**Rationale**: Multi-tenancy prevents data leakage and supports secure,
scalable SaaS operation.

### XI. Contract Fidelity & Verification Integrity

Specifications and contracts MUST remain truthful to implementation, and
completion claims MUST be evidence-backed.

- API route contracts in specs (for example, `contracts/*.md`) MUST define
  success and recoverable error behavior (`validation`, `not found`,
  `forbidden`) and implementation MUST match those shapes
- Recoverable domain outcomes MUST return explicit, typed responses; generic
  thrown errors are reserved for unexpected faults
- Tasks and checklists MUST NOT be marked complete without execution evidence
  (for example, command output, query plan, benchmark note, or linked artifact)
- Performance claims MUST be reproducible and include concrete evidence before
  being marked verified

**Rationale**: Contract drift causes user-facing defects and wasted debugging.
Evidence-based completion prevents false confidence in quality gates.

### XII. Elysia REST API & Eden Treaty

All API endpoints MUST be implemented using Elysia with end-to-end type safety
provided by Eden Treaty. The Elysia API layer is the sole interface for data
mutations and structured queries; `'use server'` directives and Next.js Server
Actions are prohibited.

**Elysia API Setup**:

- The Elysia app instance MUST be created with `{ prefix: '/api' }` and
  mounted in a Next.js catch-all route at `app/api/[[...slugs]]/route.ts`
- The Elysia app instance MUST be exported as a named export (`export const app`)
  so Eden Treaty can import its type
- All HTTP method handlers (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) MUST be
  exported from the catch-all route file by assigning `app.fetch`

**Route Handler Requirements**:

- Route handlers MUST define explicit request body and response schemas using
  Zod for runtime validation and type inference
- Route handlers MUST define explicit response schemas per status code (for
  example, `{ 200: z.object(...), 400: z.object(...) }`) for type-safe error
  handling on the client
- Use Elysia `guard` to apply shared validation (for example, auth headers) to
  route groups
- Use Elysia `group` to organize routes by resource prefix (for example,
  `.group('/products', ...)`)
- Use Elysia plugins to encapsulate reusable route sets per feature module

**Eden Treaty Client**:

- A single Eden Treaty client MUST be created in `src/lib/api-client.ts` using
  the isomorphic pattern (direct instance on server, URL on client)
- Client components MUST use TanStack Query hooks wrapping the Eden Treaty
  client for all data fetching and mutations (see XIII)
- Server-side data fetching in Server Components MAY call Elysia's app instance
  directly (zero network overhead) via the Treaty client
- Treaty client MUST be configured with `{ fetch: { credentials: 'include' } }`
  for cookie-based auth

**Validation in Route Handlers**:

- Elysia route schemas MAY use either Elysia's built-in TypeBox (`t`) OR Zod
- TypeBox (Elysia's `t` object) is the default choice for native Elysia
  integration with automatic TypeScript inference and OpenAPI generation
- Zod schemas defined in `presentation/schemas/` SHOULD be reused in route
  handlers when the same validation is needed for both forms and API routes
- A single Zod schema can serve form validation (TanStack Form), route
  validation (Elysia), and type inference (TypeScript)
- Mixing TypeBox and Zod within the same route group is permitted; choose
  the validator based on reuse needs (Zod for shared schemas, TypeBox for
  route-native integration)

**Authentication via Elysia**:

- better-auth handler MUST be mounted on the Elysia instance using
  `.mount(auth.handler)` or `.mount('/auth', auth.handler)`
- An Elysia macro named `auth` MUST be defined using `resolve` to extract
  session and user from request headers via `auth.api.getSession({ headers })`
- Protected routes MUST use the `{ auth: true }` option to enforce
  authentication
- CORS MUST be configured using `@elysiajs/cors` with explicit origin,
  credentials, and allowed headers

**Prohibited Patterns**:

- `'use server'` directives are prohibited; do NOT create server action files
- `FormData` submission to server actions is prohibited; use Treaty client calls
  with typed request bodies
- Direct `fetch('/api/...')` calls from client components are prohibited; use
  the Eden Treaty client for type safety

**Rationale**: Elysia provides a type-safe, high-performance REST API layer that
runs on Bun. Eden Treaty propagates route types to the client, eliminating
manual type synchronization. Externalizing the API from Next.js enables
consumption by mobile apps, third-party integrations, and other non-browser
clients. Removing server actions eliminates the tight coupling between React
components and server-side mutation logic.

### XIII. Client-Side Data Fetching with TanStack Query

All client-side data fetching and mutation state MUST be managed through
TanStack Query (`@tanstack/react-query`) using the Eden Treaty client as the
underlying fetch mechanism. TanStack Query provides caching, background
refetching, deduplication, and optimistic updates on top of the type-safe
Eden Treaty layer.

**QueryClient Setup**:

- A single `QueryClient` instance MUST be created in a client-side provider
  component (e.g., `src/shared/presentation/providers/query-provider.tsx`)
- The `QueryClientProvider` MUST wrap the application at the root layout level
- Default options SHOULD configure sensible `staleTime` and `gcTime` policies
  appropriate to the domain; `retry: 1` is the recommended default

**Query Patterns**:

- All data fetching in client components MUST use `useQuery` or
  `useSuspenseQuery` from `@tanstack/react-query`
- Query functions MUST use the Eden Treaty client (`api`) for the actual API
  call and MUST unwrap the `{ data, error }` response to throw on error
- Query keys MUST follow a consistent factory pattern per module (e.g.,
  `productKeys.list(filters)`, `productKeys.detail(id)`)
- Query key factories MUST be co-located in the module's
  `presentation/queries/` directory

**Mutation Patterns**:

- Client-side mutations MUST use `useMutation` from `@tanstack/react-query`
- Mutations MUST call the Eden Treaty client inside `mutationFn`
- Successful mutations MUST invalidate relevant query keys via
  `queryClient.invalidateQueries` in `onSuccess` or `onSettled`
- Optimistic updates SHOULD be used for UI-critical mutations where perceived
  latency matters
- Mutation error handling MUST leverage the typed error responses from Eden
  Treaty response schemas

**File Organization**:

- Query key factories: `presentation/queries/[resource]-keys.ts`
- Custom query hooks: `presentation/queries/use-[resource].ts`
- Custom mutation hooks: `presentation/queries/use-[mutation-name].ts`

**Prohibited Patterns**:

- `useEffect` + `setState` for data fetching is prohibited; use `useQuery`
- Manual `isLoading` / `isError` state tracking for API calls is prohibited;
  use TanStack Query's built-in states (`isPending`, `isError`, `data`)
- Storing server-fetched data in Zustand stores is prohibited when TanStack
  Query can manage the cache; Zustand remains appropriate for client-only UI
  state
- Direct Eden Treaty calls from client components without TanStack Query
  wrapping are prohibited for read operations

**Rationale**: TanStack Query eliminates boilerplate loading/error state
management, provides automatic cache invalidation and background refetching,
and integrates seamlessly with Eden Treaty's typed responses. This separation
keeps components focused on rendering while the query layer manages server
state lifecycle.

## Technology Standards

**Framework**: Next.js 16.x with App Router (rendering, routing, SSR)
**API Layer**: Elysia (REST API framework, mounted in Next.js catch-all route)
**API Client**: @elysiajs/eden (Eden Treaty for end-to-end type-safe API calls)
**Client Data Layer**: @tanstack/react-query 5.x (caching, deduplication,
background refetching, optimistic updates on top of Eden Treaty)
**Language**: TypeScript 5.x (strict mode)
**UI Library**: React 19.x with React Compiler
**Styling**: Tailwind CSS 4.x
**Database**: PostgreSQL 18.x with Kysely v0.28.x query builder
**Database Extensions**: Extension usage (for example, `pg_trgm`) is permitted
only via idempotent migrations
**Migrations**: kysely-ctl v0.20.x CLI (create with `bun db:migrate:create`, run
with `bun db:migrate`)
**Type Generation**: `db:codegen` command for database types
**Authentication**: better-auth 1.4.x (mounted on Elysia via `.mount()`)
**Validation**: 
- Zod 4.x (schema validation for forms, shared DTOs, and general type inference)
- TypeBox via Elysia's `t` object (native Elysia route validation with automatic
  TypeScript inference and OpenAPI generation)
**Forms**: TanStack Form 1.x (headless form management with Zod integration)
**Testing**: Jest v30.x + React Testing Library (when tests requested)
**Linting**: ESLint 9.x with next/core-web-vitals config
**Package Manager**: Bun only (`npm`, `yarn`, `pnpm`, and `deno` are prohibited)

**Versioning**: Semantic Versioning (MAJOR.MINOR.PATCH)

- MAJOR: Backward incompatible governance changes
- MINOR: New principle/section or materially expanded guidance
- PATCH: Clarifications and non-semantic refinements

## Development Workflow

### Branch Strategy

- `main`: Production-ready code, protected
- Feature branches: `###-feature-name` pattern
- All changes via pull request

### Quality Gates

1. TypeScript compilation passes with no errors
2. ESLint passes with no warnings
3. Code review approved
4. No secrets in commit history
5. Library research uses Context7 documentation (where available)
6. New features use vertical slice module structure (VII)
7. Database naming conventions followed: snake_case in DB, camelCase in code (VIII)
8. All primary keys use UUID v7 auto-generation (VIII)
9. Migrations executed using `bun db:migrate` only (VIII)
10. Soft delete patterns implemented with `deleted_at`; no hard deletes without
    approval (IX)
11. Multi-tenancy enforced: `organization_id` on all business entities, queries
    scoped to active org (X)
12. API route behavior matches documented contracts, including recoverable error
    semantics (III, XI)
13. DB constraints enforce critical domain invariants where feasible (VIII)
14. Performance claims include reproducible evidence and matching
    extension/index strategy where applicable (VIII, XI)
15. Elysia route handlers define explicit request body and response schemas
    using TypeBox or Zod (XII)
16. All client-side API calls use Eden Treaty client, not raw `fetch` (XII)
17. No `'use server'` directives or server action files in the codebase (XII)
18. better-auth mounted on Elysia with auth macro for protected routes (V, XII)
19. Client components use `useQuery`/`useMutation` from TanStack Query for all
    data fetching and mutations; no `useEffect` + `setState` fetch patterns
    (XIII)
20. Query key factories exist per module in `presentation/queries/` with
    consistent naming (XIII)
21. Server-fetched data not duplicated into Zustand stores when TanStack Query
    cache suffices (XIII)

### File Organization

```text
src/
├── modules/              # Feature modules (vertical slices)
│   ├── products/         # Example: Products module
│   │   ├── domain/       # Entities and domain types
│   │   │   ├── entities/
│   │   │   └── types/
│   │   ├── application/  # Services, repository interfaces, DTOs
│   │   │   ├── services/
│   │   │   ├── repositories/  # Interfaces only (e.g., IProductRepository)
│   │   │   └── types/    # getManyProps, getManyReturn, etc.
│   │   ├── infrastructure/  # Repository implementations
│   │   │   └── repositories/  # Concrete implementations (e.g., ProductRepository)
│   │   └── presentation/ # Routes, APIs, components, stores, queries, schemas
│   │       ├── routes/   # Elysia route handler plugins (e.g., productRoutes)
│   │       ├── queries/  # TanStack Query key factories + custom hooks
│   │       ├── components/  # React components
│   │       ├── stores/   # Zustand stores (client-only UI state)
│   │       ├── types/    # Presentation-layer types
│   │       └── schemas/  # Zod validation schemas
│   ├── auth/             # Example: Authentication module
│   ├── orders/           # Example: Orders module
│   └── ...               # Other feature modules
├── lib/                  # Shared utilities and helpers
│   └── api-client.ts     # Eden Treaty client (isomorphic)
├── types/                # Cross-module TypeScript definitions
└── styles/               # Global styles, Tailwind config
```

**Key Rules**:

- Each module is self-contained; minimize cross-module imports
- Domain layer has zero external dependencies (no React, no Kysely)
- Application layer depends only on Domain layer
- Infrastructure layer implements Application layer interfaces
- Presentation layer can depend on Application and Infrastructure layers
- Import direction: Domain ← Application ← Infrastructure ← Presentation
- Elysia route plugins in `presentation/routes/` are composed into the main
  Elysia app instance via `.use()`

## Governance

This constitution supersedes all other development practices within this
project.

**Amendment Process**:

1. Propose change via pull request to `constitution.md`
2. Document rationale and impact on existing code/process
3. Increment version per semantic versioning rules
4. Update `LAST_AMENDED_DATE` on ratification
5. Propagate changes to dependent templates and documentation

**Compliance Review**:

- All PRs MUST verify compliance with constitution principles
- Deviations require explicit justification documented in Complexity Tracking
- Claimed completed validations MUST include evidence references in PR notes

**Guidance Files**:

- `AGENTS.md`: Primary development guidance with rule references
- `.agent/rules/*.md`: Detailed guides for specific domains

**Version**: 2.3.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-03-07
