# Implementation Plan: Simple Inventory Module

**Branch**: `004-simple-inventory` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-simple-inventory/spec.md`

## Summary

Implement a simple inventory module that tracks stock levels across products, product variants, and warehouse locations using an append-only ledger pattern. A single `stock_movement` table serves as the immutable source of truth, with current stock computed as `SUM(delta)` per product/variant/warehouse. The module integrates with existing `product`, `product_variant`, and `warehouse` modules, supports receive/dispatch/adjustment/transfer operations, and enforces multi-tenancy isolation. Negative stock is permitted with user-facing warnings.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui  
**Storage**: PostgreSQL 18.x — 1 new table (`stock_movement`) with CHECK, FK, and index constraints  
**Testing**: Jest v30.x + React Testing Library (when tests requested)  
**Target Platform**: Web (Linux server)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Stock dashboard loads in <2 seconds (SC-001). Stock operations complete with 100% accuracy (SC-002). Manual adjustment in <5 clicks (SC-003).  
**Constraints**: Multi-tenancy (organization_id), soft delete compliance, UUID v7 PKs, flat permissions (any authenticated user)  
**Scale/Scope**: Hundreds to low thousands of products, moderate daily movement frequency (ERP scale)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Required Verification:**

- [x] **I. Type Safety**: Strict mode enabled, no `any` types — all entities, DTOs, and service types use strict TypeScript interfaces
- [x] **II. React Discipline**: Hooks rules followed, minimize manual memoization (React Compiler) — follows existing component patterns
- [x] **III. Next.js Standards**: App Router patterns, Server Actions validation — server actions handle mutations with Zod validation
- [x] **IV. A11y & Performance**: Semantic HTML, Core Web Vitals targets — dashboard uses semantic tables, accessible forms
- [x] **V. Code Quality**: Review process, security practices — parameterized queries via Kysely, session validation on all actions
- [x] **VI. Documentation-First Research**: Context7 verification for all library research — Kysely `/kysely-org/kysely` v0.28.3, TanStack Form `/tanstack/form` v1.11.0
- [x] **VII. Vertical Slice Architecture**: Code organized in `src/modules/inventory/` with domain/application/infrastructure/presentation layers
- [x] **VIII. Database Naming, Extensions & Integrity**: DB uses snake_case, app uses camelCase, migrations use `db:migrate:create`, critical invariants have DB constraints (FK refs, non-empty checks)
- [x] **UUID v7 Compliance**: All primary keys use UUID v7 auto-generation via `uuidv7()` SQL function
- [x] **Soft Delete Enforcement**: `stock_movement` has `deleted_at` column for compliance. See Complexity Tracking for justified deviation on not exposing softDelete/restore methods (movements are immutable audit records per FR-006).
- [x] **X. Multi-Tenancy**: `organization_id` present on `stock_movement`, all queries scoped to active org
- [x] **XI. Contract Fidelity**: Server Action behaviors match documented success + recoverable error contracts in `contracts/server-actions.md`

**Research Phase Check:**

- [x] All library versions verified via Context7 (Kysely v0.28.3, TanStack Form v1.11.0)
- [x] Context7 library IDs documented in research.md
- [x] Prior knowledge invalidated when Context7 data retrieved
- [x] Performance/index claims include strategy (composite indexes documented in research.md R8)

## Project Structure

### Documentation (this feature)

```text
specs/004-simple-inventory/
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
src/modules/inventory/
├── domain/
│   ├── entities/
│   │   └── stock-movement.ts        # StockMovement entity interface
│   └── types/
│       └── index.ts                 # MovementType enum, StockLevel type
├── application/
│   ├── repositories/
│   │   └── stock-movement.repository.interface.ts
│   ├── services/
│   │   └── inventory.service.ts     # Business logic: receive, dispatch, adjust, transfer
│   └── types/
│       └── index.ts                 # Service param/result DTOs
├── infrastructure/
│   └── repositories/
│       └── stock-movement.repository.ts  # Kysely implementation
└── presentation/
    ├── actions/
    │   └── inventory.actions.ts     # Server Actions
    ├── components/
    │   ├── inventory-dashboard.tsx   # Main stock level view (US-1)
    │   ├── stock-receive-dialog.tsx  # Receive stock form (US-2)
    │   ├── stock-dispatch-dialog.tsx # Dispatch stock form (US-3)
    │   ├── stock-adjust-dialog.tsx   # Manual adjustment form (US-4)
    │   ├── stock-transfer-dialog.tsx # Transfer between warehouses (Edge Case)
    │   ├── movement-history.tsx      # Movement log view (FR-006)
    │   └── negative-stock-warning.tsx # Warning dialog for negative stock (FR-004)
    ├── schemas/
    │   └── inventory.schema.ts      # Zod validation schemas
    ├── lib/
    │   └── form-options.ts          # TanStack Form options
    └── types/
        └── index.ts                 # Presentation-layer types
```

**Structure Decision**: Follows the established vertical slice architecture (VII) matching the patterns in `src/modules/warehouses/` and `src/modules/products/`. The inventory module is self-contained with cross-module dependencies only on domain entities from products and warehouses (consumed via FK references, not direct imports).

## Complexity Tracking

> **Constitution Check violations that must be justified**

| Violation                                                                                    | Why Needed                                                                                                                                                                | Simpler Alternative Rejected Because                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IX. Soft Delete: `stock_movement` has `deleted_at` but no `softDelete()`/`restore()` methods | Stock movements are immutable audit records (FR-006). Allowing deletion/restoration would violate the audit trail invariant and break mathematical consistency (DIR-002). | Adding softDelete/restore would create a mechanism to tamper with the audit log. The column exists for schema compliance; the application layer enforces immutability. |
