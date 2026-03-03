# Implementation Plan: Order Management Module

**Branch**: `005-order-management` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-order-management/spec.md`

## Summary

Implement an order management module that tracks customer orders through a 7-status fulfillment pipeline (Unpaid → Paid → Process → Sent → Completed, with Cancel and Return branches). The module features a state-machine-driven lifecycle enforced at the application layer, optimistic locking for concurrent access safety, snapshotted line items for order immutability, a searchable product picker for order creation, and a visual stepper for pipeline visualization. Status transitions are fully audited with user attribution and timestamps.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui (Combobox, Badge, Table, Dialog, AlertDialog, Card, Button, Input, Pagination, Separator, Skeleton)  
**Storage**: PostgreSQL 18.x — 3 new tables (`order`, `order_item`, `order_status_history`) with CHECK, FK, GIN (pg_trgm), and B-tree index constraints  
**Testing**: Jest v30.x + React Testing Library (when tests requested)  
**Target Platform**: Web (Linux server)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Order creation in <60s (SC-001). Orders list loads in <2s for up to 5,000 orders (SC-002). Filter by status in <1s (SC-003). Advance status in <3 clicks (SC-004).  
**Constraints**: Multi-tenancy (organization_id), soft delete compliance (schema-only — app never invokes), UUID v7 PKs, flat permissions (any authenticated user), optimistic locking for concurrent access  
**Scale/Scope**: Hundreds to low thousands of orders, moderate daily creation frequency (ERP scale)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [x] **I. Type Safety**: Strict mode enabled, no `any` types — all entities, DTOs, state machine types, and service types use strict TypeScript interfaces and discriminated unions
- [x] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler) — follows existing component patterns for forms and lists
- [x] **III. Next.js Standards**: App Router patterns, Server Actions validation — server actions handle mutations with Zod validation; read actions called from Server Components
- [x] **IV. A11y & Performance**: Semantic HTML, Core Web Vitals targets — order list uses `<table>`, stepper uses `<ol>` with ARIA attributes, dialogs use `<dialog>` or Radix primitives
- [x] **V. Code Quality**: Review process, security practices — parameterized queries via Kysely, session validation on all actions, no raw SQL concatenation
- [x] **VI. Documentation-First Research**: Context7 verification for all library research — Kysely `/kysely-org/kysely` v0.28.3, TanStack Form `/tanstack/form` v1.11.0
- [x] **VII. Vertical Slice Architecture**: Code organized in `src/modules/orders/` with domain/application/infrastructure/presentation layers
- [x] **VIII. Database Naming, Extensions & Integrity**: DB uses snake_case, app uses camelCase, migrations use `db:migrate:create`, `pg_trgm` extension via idempotent migration, domain invariants enforced at DB level (CHECK constraints on status, customer_name, quantities), GIN index for substring search
- [x] **UUID v7 Compliance**: All primary keys use UUID v7 auto-generation via `uuidv7()` SQL function
- [x] **Soft Delete Enforcement**: All 3 tables have `deleted_at` column for compliance. See Complexity Tracking for justified deviation on not exposing softDelete/restore methods (orders use status-based lifecycle per spec assumptions)
- [x] **X. Multi-Tenancy**: `organization_id` present on `order` table, all queries scoped to active org. Child tables (`order_item`, `order_status_history`) inherit org scope through their parent order FK.
- [x] **XI. Contract Fidelity**: Server Action behaviors match documented success + recoverable error contracts in `contracts/server-actions.md`

**Research Phase Check:**

- [x] All library versions verified via Context7 (Kysely v0.28.3, TanStack Form v1.11.0)
- [x] Context7 library IDs documented in research.md
- [x] Prior knowledge invalidated when Context7 data retrieved
- [x] Performance/index claims include strategy (composite B-tree + GIN pg_trgm indexes documented in research.md R8)

## Project Structure

### Documentation (this feature)

```text
specs/005-order-management/
├── plan.md              # This file
├── research.md          # Phase 0 output — complete
├── data-model.md        # Phase 1 output — complete
├── quickstart.md        # Phase 1 output — complete
├── contracts/           # Phase 1 output
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/modules/orders/
├── domain/
│   ├── entities/
│   │   ├── order.ts                  # Order entity interface
│   │   ├── order-item.ts             # OrderItem entity interface
│   │   └── order-status-history.ts   # OrderStatusHistory entity interface
│   └── types/
│       └── index.ts                  # OrderStatus, transitions map, helpers
├── application/
│   ├── repositories/
│   │   ├── order.repository.interface.ts
│   │   ├── order-item.repository.interface.ts
│   │   └── order-status-history.repository.interface.ts
│   ├── services/
│   │   └── order.service.ts          # Business logic: create, update, transition, search
│   └── types/
│       └── index.ts                  # Service param/result DTOs
├── infrastructure/
│   └── repositories/
│       ├── order.repository.ts       # Kysely implementation (with optimistic locking)
│       ├── order-item.repository.ts  # Kysely implementation
│       └── order-status-history.repository.ts
└── presentation/
    ├── actions/
    │   └── order.actions.ts          # Server Actions (create, update, transition, reads)
    ├── components/
    │   ├── order-list.tsx            # Order table with filters (US-2)
    │   ├── order-form-dialog.tsx     # Create/edit order dialog (US-1, US-3)
    │   ├── order-detail.tsx          # Full order detail view (US-6)
    │   ├── order-status-stepper.tsx  # Visual pipeline stepper (FR-016)
    │   ├── order-status-badge.tsx    # Status badge for terminal states
    │   ├── product-picker.tsx        # Searchable product/variant combobox (FR-001)
    │   ├── order-line-items.tsx      # Dynamic line item management
    │   ├── order-status-actions.tsx  # Advance/Cancel/Return buttons with confirmation
    │   └── order-status-history.tsx  # Chronological transition log
    ├── schemas/
    │   └── order.schema.ts           # Zod validation schemas
    ├── lib/
    │   └── form-options.ts           # TanStack Form options
    └── types/
        └── index.ts                  # Presentation-layer types
```

**Structure Decision**: Follows the established vertical slice architecture (VII) matching the patterns in `src/modules/warehouses/`, `src/modules/products/`, and `src/modules/inventory/`. The orders module is self-contained with cross-module dependencies only on domain entities from products (consumed via FK references and the product picker search query).

## Complexity Tracking

> **Constitution Check violations that must be justified**

| Violation                                                                                         | Why Needed                                                                                                                                                                   | Simpler Alternative Rejected Because                                                                                                                                       |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IX. Soft Delete: All 3 tables have `deleted_at` but no `softDelete()`/`restore()` methods exposed | Orders use status-based lifecycle (Cancelled/Return) per spec: "Soft delete is NOT used for orders — cancellation is the mechanism. Orders are never physically deleted."    | Adding softDelete/restore contradicts the spec's explicit design decision. The `deleted_at` columns exist for schema compliance; the application layer enforces lifecycle. |
| IX. Soft Delete: `order_status_history` has `deleted_at` but records are immutable                | Status history records are append-only audit entries (FR-009, DIR-003). Allowing deletion/restoration would violate the audit trail invariant and compromise accountability. | Same justification as inventory module's `stock_movement` — the column exists for compliance, but the invariant takes precedence.                                          |
