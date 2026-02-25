# Implementation Plan: Product Variants

**Branch**: `002-product-variants` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-product-variants/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a normalized relational product variant system enabling products to have configurable attributes (e.g., Color, Size) with option values (e.g., Red, Blue, S, M, L). Users can assign attributes to products, selectively generate variant combinations (cartesian product), and manage each variant independently with its own SKU, price, stock quantity, and active/inactive status. The approach uses five new database tables with full constraint enforcement (CHECK, UNIQUE, FK RESTRICT), following the existing vertical slice architecture established in feature 001.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, @dnd-kit/core + @dnd-kit/sortable (new)
**Storage**: PostgreSQL 18.x — 5 new tables (attribute, attribute_option, product_attribute, product_variant, variant_option) with CHECK, UNIQUE, and FK constraints
**Testing**: Jest v30.x + React Testing Library (when tests requested)
**Target Platform**: Web (Next.js server-rendered)
**Project Type**: web — existing Next.js App Router project
**Performance Goals**: Variant list for ≤100 variants loads in <1 second (SC-003). Attribute CRUD <60s from blank state (SC-001). 3×3 variant config in <3 minutes (SC-002).
**Constraints**: Organization isolation (all queries scoped by org). Soft deletes on all entities. UUID v7 for all PKs. SKU unique per org.
**Scale/Scope**: Per-product: practical max ~100 variants (5 attributes × ~5 options). Per-org: unlimited attributes.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [x] **I. Type Safety**: Strict mode enabled, no `any` types — all new entity interfaces use concrete types
- [x] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler) — interactive components (drag-drop, checkbox matrix) use standard React state
- [x] **III. Next.js Standards**: App Router patterns, Server Actions validation — dynamic route `[productId]`, revalidatePath per contract, Zod validation
- [x] **IV. A11y & Performance**: Semantic HTML, Core Web Vitals targets — table/checkbox use semantic elements, keyboard-navigable drag-drop via @dnd-kit
- [x] **V. Code Quality**: Review process, security practices — parameterized Kysely queries, org-scoped data access
- [x] **VI. Documentation-First Research**: Context7 verification for all library research — Kysely `/kysely-org/kysely/v0.28.3`, Next.js `/vercel/next.js/v16.1.6`, TanStack Form `/websites/tanstack_form` (documented in research.md)
- [x] **VII. Vertical Slice Architecture**: Code organized in `src/modules/products/` with domain, application, infrastructure, presentation layers — extending existing module
- [x] **VIII. Database Naming, Extensions & Integrity**: DB uses snake_case, app uses camelCase, migrations use `db:migrate:create`, CHECK constraints for price/stock/display_order, UNIQUE constraints for SKU+org, no new extensions required
- [x] **UUID v7 Compliance**: All primary keys use UUID v7 auto-generation via `uuidv7()` default
- [x] **Soft Delete Enforcement**: All 5 entities have `deleted_at` column, repositories provide soft delete methods
- [x] **X. Multi-Tenancy**: `organization_id` on all 5 new tables (direct or denormalized), all queries scoped to active org
- [x] **XI. Contract Fidelity**: Server Actions match documented contracts in `contracts/server-actions.md` with explicit success + error shapes (validation, not-found, referential integrity, SKU conflict)

**Research Phase Check:**

- [x] All library versions verified via Context7 (Kysely v0.28.3, Next.js v16.1.6, TanStack Form)
- [x] Context7 library IDs documented in research.md
- [x] Prior knowledge invalidated when Context7 data retrieved
- [x] Performance/index claims include index strategy documented in data-model.md

## Project Structure

### Documentation (this feature)

```text
specs/002-product-variants/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — technology decisions & Context7 references
├── data-model.md        # Phase 1 output — 5 entities, constraints, indexes, domain types
├── quickstart.md        # Phase 1 output — step-by-step implementation guide
├── contracts/
│   └── server-actions.md  # Phase 1 output — attribute + variant action contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   └── products/                         # Extending existing module (vertical slice)
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── product.ts            # Existing — unchanged
│       │   │   ├── attribute.ts          # NEW — Attribute entity type
│       │   │   ├── attribute-option.ts   # NEW — Attribute Option entity type
│       │   │   ├── product-attribute.ts  # NEW — Product-Attribute join type
│       │   │   ├── product-variant.ts    # NEW — Product Variant entity type
│       │   │   └── variant-option.ts     # NEW — Variant Configuration type
│       │   └── types/
│       │       └── index.ts              # EXTENDED — variant-related domain types
│       ├── application/
│       │   ├── repositories/
│       │   │   ├── product.repository.interface.ts  # Existing — unchanged
│       │   │   ├── attribute.repository.interface.ts  # NEW
│       │   │   └── variant.repository.interface.ts    # NEW
│       │   ├── services/
│       │   │   ├── product.service.ts     # Existing — unchanged
│       │   │   ├── attribute.service.ts   # NEW — attribute + option business logic
│       │   │   └── variant.service.ts     # NEW — variant generation, SKU, config logic
│       │   └── types/
│       │       └── index.ts               # EXTENDED — new param/return types
│       ├── infrastructure/
│       │   └── repositories/
│       │       ├── product.repository.ts  # Existing — unchanged
│       │       ├── attribute.repository.ts  # NEW — Kysely implementation
│       │       └── variant.repository.ts    # NEW — Kysely implementation
│       └── presentation/
│           ├── actions/
│           │   ├── product.actions.ts       # Existing — unchanged
│           │   ├── attribute.actions.ts     # NEW — attribute CRUD actions
│           │   └── variant.actions.ts       # NEW — variant config & management actions
│           ├── schemas/
│           │   ├── product.schema.ts        # Existing — unchanged
│           │   ├── attribute.schema.ts      # NEW — Zod schemas for attributes/options
│           │   └── variant.schema.ts        # NEW — Zod schemas for variants
│           ├── components/
│           │   ├── product-list.tsx          # Existing — MODIFIED (product rows link to detail)
│           │   ├── attribute-list.tsx                # NEW
│           │   ├── attribute-add-dialog.tsx          # NEW
│           │   ├── attribute-edit-dialog.tsx         # NEW
│           │   ├── attribute-option-list.tsx         # NEW
│           │   ├── attribute-option-form.tsx         # NEW
│           │   ├── product-attribute-config.tsx      # NEW — drag-drop attribute reorder
│           │   ├── variant-combination-matrix.tsx    # NEW — checkbox grid
│           │   ├── variant-list.tsx                  # NEW — table of variants
│           │   ├── variant-edit-row.tsx              # NEW — inline SKU/price/stock editing
│           │   └── variant-empty-state.tsx           # NEW
│           ├── lib/
│           │   └── form-options.ts           # EXTENDED — attribute/variant form options
│           └── types/
│               └── index.ts                  # EXTENDED — variant presentation types
├── app/(app)/
│   └── products/
│       ├── page.tsx                          # MODIFIED — product rows become clickable links
│       ├── [productId]/
│       │   ├── page.tsx                      # NEW — product detail with variant list
│       │   ├── loading.tsx                   # NEW — loading skeleton
│       │   └── variants/
│       │       ├── page.tsx                  # NEW — variant configuration page
│       │       └── loading.tsx               # NEW — loading skeleton
│       └── attributes/
│           ├── page.tsx                      # NEW — attribute management page
│           └── loading.tsx                   # NEW — loading skeleton
└── shared/
    └── infrastructure/
        └── persistence/
            └── migrations/
                ├── XXXX_create_attribute_table.ts              # NEW
                ├── XXXX_create_attribute_option_table.ts       # NEW
                ├── XXXX_create_product_attribute_table.ts      # NEW
                └── XXXX_create_product_variant_and_variant_option_tables.ts  # NEW
```

**Structure Decision**: Extending the existing `src/modules/products/` vertical slice module. New entities, services, and repositories are added within the same module since Attributes and Variants are tightly coupled with Products. No new module is created.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                     | Why Needed                                                                 | Simpler Alternative Rejected Because                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Denormalized `organization_id` on join tables | Every query must filter by org (Constitution X) without joins for security | Could inherit via FK joins but adds latency and complexity to every query; constitution explicitly requires `organization_id` on all business entities |
