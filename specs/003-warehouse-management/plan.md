# Implementation Plan: Warehouse Management

**Branch**: `003-warehouse-management` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-warehouse-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a complete warehouse management module enabling organizations to create, list, search, update, soft-delete, and restore physical storage locations. The warehouse entity has rich address and contact fields, an immutable code per organization, and supports text search across name/code/city/province. The presentation layer uses TanStack Form with shared `formOptions` for consistent client/server validation, organized into accessible multi-section forms using shadcn `FieldSet`/`FieldLegend`/`FieldSeparator` components. All operations enforce multi-tenant isolation via `organization_id`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui (Field, Input, Textarea, Dialog, Card, AlertDialog)
**Storage**: PostgreSQL 18.x — 1 new table (`warehouse`) with CHECK, normalized UNIQUE across all rows (including soft-deleted), and FK constraints
**Testing**: Jest v30.x + React Testing Library; run `bun test` and `bun run lint` as feature quality gates
**Target Platform**: Web (Next.js server-rendered)
**Project Type**: web — existing Next.js App Router project
**Performance Goals**: Warehouse list for ≤100 warehouses loads in <1 second (SC-002). Create form completes in <60s (SC-001). Search returns in <500ms (SC-003).
**Constraints**: Organization isolation (all queries scoped by org). Soft deletes on all entities. UUID v7 for all PKs. Warehouse code unique per org (including soft-deleted). Code immutable after creation.
**Scale/Scope**: Per-org: practical max ~1000 warehouses (no hard limit). 11 user-editable fields per warehouse.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [x] **I. Type Safety**: Strict mode enabled, no `any` types — all entity interfaces use concrete types, Zod schemas provide runtime validation
- [x] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler) — form components use `useForm`, `useStore`, `useTransform` only at top level
- [x] **III. Next.js Standards**: App Router patterns, Server Actions validation — dynamic route `[warehouseId]`, `revalidatePath('/warehouses')` per contract, Zod validation via `createServerValidate`
- [x] **IV. A11y & Performance**: Semantic HTML, Core Web Vitals targets — `<fieldset>`/`<legend>` grouping, `aria-required`, `aria-invalid`, `role="alert"` on errors, keyboard-navigable forms
- [x] **V. Code Quality**: Review process, security practices — parameterized Kysely queries, org-scoped data access, code uniqueness validated server-side
- [x] **VI. Documentation-First Research**: Context7 verification for all library research — TanStack Form `/websites/tanstack_form`, Kysely `/kysely-org/kysely/v0.28.3`, Next.js `/vercel/next.js/v16.1.6` (documented in research.md)
- [x] **VII. Vertical Slice Architecture**: Code organized in `src/modules/warehouses/` with domain, application, infrastructure, presentation layers — new module following same pattern as `products`
- [x] **VIII. Database Naming, Extensions & Integrity**: DB uses snake_case, app uses camelCase, migrations use `db:migrate:create`, CHECK constraints for non-empty name/code, no new extensions required (pg_trgm deferred with documented justification)
- [x] **UUID v7 Compliance**: All primary keys use UUID v7 auto-generation via `uuidv7()` default
- [x] **Soft Delete Enforcement**: Warehouse entity has `deleted_at` column, repository provides `softDelete()` and `restore()` methods, no hard deletes
- [x] **X. Multi-Tenancy**: `organization_id` on warehouse table (FK to `organization.id` with ON DELETE CASCADE), all queries scoped to active org
- [x] **XI. Contract Fidelity**: Server Actions match documented contracts in `contracts/server-actions.md` with explicit success + error shapes (validation, not-found, duplicate code, forbidden)

**Research Phase Check:**

- [x] All library versions verified via Context7 (TanStack Form, Kysely v0.28.3, Next.js v16.1.6)
- [x] Context7 library IDs documented in research.md
- [x] Prior knowledge invalidated when Context7 data retrieved
- [x] Performance/index claims documented in data-model.md; pg_trgm deferred with justification per Constitution VIII (ILIKE sufficient for ≤100 warehouses per SC-003)

## Project Structure

### Documentation (this feature)

```text
specs/003-warehouse-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — technology decisions & Context7 references
├── data-model.md        # Phase 1 output — warehouse entity, constraints, indexes, domain types
├── quickstart.md        # Phase 1 output — step-by-step implementation guide
├── contracts/
│   └── server-actions.md  # Phase 1 output — warehouse CRUD action contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   └── warehouses/                        # NEW module (vertical slice)
│       ├── domain/
│       │   ├── entities/
│       │   │   └── warehouse.ts           # NEW — Warehouse entity type
│       │   └── types/
│       │       └── index.ts               # NEW — domain value types (if needed)
│       ├── application/
│       │   ├── repositories/
│       │   │   └── warehouse.repository.interface.ts  # NEW — IWarehouseRepository
│       │   ├── services/
│       │   │   └── warehouse.service.ts   # NEW — warehouse business logic
│       │   └── types/
│       │       └── index.ts               # NEW — GetWarehousesParams, CreateWarehouseParams, etc.
│       ├── infrastructure/
│       │   └── repositories/
│       │       └── warehouse.repository.ts  # NEW — Kysely implementation
│       └── presentation/
│           ├── actions/
│           │   └── warehouse.actions.ts   # NEW — createWarehouse, updateWarehouse, softDelete, restore
│           ├── schemas/
│           │   └── warehouse.schema.ts    # NEW — warehouseBaseSchema, warehouseCreateSchema, warehouseUpdateSchema
│           ├── components/
│           │   ├── warehouse-form.tsx              # NEW — create form with TanStack Form + fieldsets
│           │   ├── warehouse-edit-form.tsx         # NEW — edit form (code field read-only)
│           │   ├── warehouse-add-dialog.tsx        # NEW — dialog wrapper for create
│           │   ├── warehouse-edit-dialog.tsx       # NEW — dialog wrapper for edit
│           │   ├── warehouse-list.tsx              # NEW — client component table
│           │   ├── warehouse-list-server.tsx       # NEW — server component data fetcher
│           │   ├── warehouse-search.tsx            # NEW — search input with URL param sync
│           │   ├── warehouse-empty-state.tsx       # NEW — illustrated empty state (FR-019)
│           │   ├── warehouse-delete-dialog.tsx     # NEW — soft-delete confirmation
│           │   └── warehouse-trash-list.tsx        # NEW — deleted warehouses view
│           ├── lib/
│           │   └── form-options.ts         # NEW — createWarehouseFormOptions, updateWarehouseFormOptions
│           └── types/
│               └── index.ts                # NEW — presentation-layer types
├── app/(app)/
│   └── warehouses/
│       ├── page.tsx                        # NEW — warehouse list page (Server Component)
│       ├── loading.tsx                     # NEW — loading skeleton
│       ├── [warehouseId]/
│       │   ├── page.tsx                   # NEW — warehouse detail page
│       │   └── loading.tsx                # NEW — loading skeleton
│       └── trash/
│           ├── page.tsx                   # NEW — trash view page
│           └── loading.tsx                # NEW — loading skeleton
└── shared/
    └── infrastructure/
        └── persistence/
            └── migrations/
                └── XXXX_create_warehouse_table.ts  # NEW — warehouse table migration
```

**Structure Decision**: Creating a new `src/modules/warehouses/` vertical slice module. Warehouse is an independent entity with its own CRUD lifecycle, separate from Products. While warehouses will integrate with Products later via Inventory, they are operated and managed independently, justifying a standalone module.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                        | Why Needed                                                                                                                        | Simpler Alternative Rejected Because                                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ILIKE without pg_trgm index for substring search | Per-org warehouse count is small (practical max ~1000); ILIKE on B-tree index satisfies SC-003 target (500ms for ≤100 warehouses) | pg_trgm would add extension dependency and GIN index overhead for a use case that's well within budget; documented upgrade path in data-model.md for when needed |
