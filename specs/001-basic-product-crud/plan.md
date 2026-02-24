# Implementation Plan: Basic Product CRUD

**Branch**: `001-basic-product-crud` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-basic-product-crud/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a minimal product CRUD (Create, Read, Update, Soft Delete, Restore) feature for the NERPAI ERP system. Products have a single `name` attribute (1-255 characters) and are scoped to an organization (multi-tenancy). The feature uses Next.js 16 App Router with Server Actions for mutations, Kysely for type-safe PostgreSQL queries, Zod 4 for validation, and TanStack Form v1 for client-side form management. Soft delete is enforced with a `deleted_at` column, and a dedicated Trash view enables product recovery.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Kysely 0.28.11, Zod 4.3.6, TanStack Form 1.28.3, Radix UI 1.4.3, Tailwind CSS 4.x, better-auth 1.4.18, Zustand (via stores), Lucide React 0.575.0, Motion 12.34.3
**Storage**: PostgreSQL 18.x via Kysely with CamelCasePlugin (auto snake_case ↔ camelCase conversion)
**Testing**: Jest v30.x + React Testing Library (when tests requested)
**Target Platform**: Web (Next.js on Linux server)
**Project Type**: Web application (Next.js App Router monolith)
**Performance Goals**: Product list renders within 1 second for up to 1000 products; product creation completes in under 30 seconds (user-facing)
**Constraints**: Organization-scoped data isolation; soft delete only (no hard delete); last-write-wins for concurrent edits
**Scale/Scope**: Initial scope is single organization context; supports up to 1000 products per organization for initial version

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [x] **I. Type Safety**: Strict mode enabled (`strict: true` in tsconfig.json confirmed), no `any` types — all new code will use proper types and `unknown` with type guards
- [x] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler via `babel-plugin-react-compiler` 1.0.0 confirmed in devDependencies)
- [x] **III. Next.js Standards**: App Router patterns (confirmed `src/app/` structure), Server Actions for mutations with Zod validation
- [x] **IV. A11y & Performance**: Semantic HTML for product forms/lists, keyboard navigation for all interactive elements, Core Web Vitals targets
- [x] **V. Code Quality**: Code review process, no secrets in code, Zod input validation on all Server Actions, parameterized queries via Kysely
- [x] **VI. Documentation-First Research**: Context7 verification completed for Kysely (`/kysely-org/kysely`), Zod 4 (`/websites/zod_dev_v4`), TanStack Form (`/websites/tanstack_form`)
- [x] **VII. Vertical Slice Architecture**: Code organized in `src/modules/products/` with domain, application, infrastructure, presentation layers
- [x] **VIII. Database Naming Conventions**: Database uses snake_case (`product` table, `organization_id`, `deleted_at`), application uses camelCase (automatic via CamelCasePlugin), migrations via `bun db:migrate:create`, types regenerated with `bun db:codegen`
- [x] **UUID v7 Compliance**: Product primary key uses UUID v7 via `uuidv7()` SQL function (same pattern as existing `better_auth_setup` migration)
- [x] **Soft Delete Enforcement**: Products table includes `deleted_at` column (nullable timestamp), repository provides `softDelete()` and `restore()` methods, queries filter `deleted_at IS NULL` by default
- [x] **X. Multi-Tenancy**: `organization_id` column on product table (UUID FK to `organization.id`), all queries scoped to `activeOrganizationId` from session

**Research Phase Check:**

- [x] All library versions verified via Context7 (where available)
- [x] Context7 library IDs documented in research.md
- [x] Prior knowledge invalidated when Context7 data retrieved

## Project Structure

### Documentation (this feature)

```text
specs/001-basic-product-crud/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (app)/
│       └── products/
│           ├── page.tsx              # Product list page (Server Component)
│           ├── trash/
│           │   └── page.tsx          # Trash view page (Server Component)
│           └── loading.tsx           # Loading state for Suspense
├── modules/
│   └── products/
│       ├── domain/
│       │   ├── entities/
│       │   │   └── product.ts        # Product entity type definitions
│       │   └── types/
│       │       └── index.ts          # Domain value objects & enums
│       ├── application/
│       │   ├── services/
│       │   │   └── product.service.ts    # Business logic (CRUD operations)
│       │   ├── repositories/
│       │   │   └── product.repository.interface.ts  # Repository interface (IProductRepository)
│       │   └── types/
│       │       └── index.ts          # Service DTOs (getManyProps, getManyReturn, etc.)
│       ├── infrastructure/
│       │   └── repositories/
│       │       └── product.repository.ts  # Kysely repository implementation
│       └── presentation/
│           ├── actions/
│           │   └── product.actions.ts     # Server Actions (create, update, softDelete, restore)
│           ├── components/
│           │   ├── product-list.tsx        # Product table/list component
│           │   ├── product-form.tsx        # Create/Edit form component (TanStack Form)
│           │   ├── product-delete-dialog.tsx  # Delete confirmation dialog
│           │   ├── product-empty-state.tsx  # Empty state component
│           │   └── product-trash-list.tsx   # Trash view list component
│           ├── schemas/
│           │   └── product.schema.ts      # Zod validation schemas
│           └── types/
│               └── index.ts              # Presentation-layer types
└── shared/
    └── infrastructure/
        └── persistence/
            └── migrations/
                └── XXXX_create_product_table.ts  # Product table migration
```

**Structure Decision**: Follows existing Vertical Slice Architecture pattern established in `src/modules/organizations/`. The `products` module directory already exists at `src/modules/products/` with an empty `presentation/` subdirectory. The new feature fills out all four layers (domain, application, infrastructure, presentation) within this module.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied by the design.
