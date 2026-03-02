# Quickstart: Simple Inventory Module

**Feature Branch**: `004-simple-inventory`  
**Date**: 2026-03-02

## Prerequisites

- Node.js / Bun installed
- PostgreSQL 18.x running with database created
- `DATABASE_URL` environment variable set
- Existing modules deployed: products, product variants, warehouses
- At least one organization with an active user session

## Setup

### 1. Create the migration

```bash
bun db:migrate:create create_stock_movement_table
```

### 2. Write the migration

Copy the SQL from [data-model.md — Migration SQL](./data-model.md#migration-sql) into the generated migration file. The migration creates:

- `stock_movement` table with UUID v7 PK
- CHECK constraints for movement type, delta sign
- FK constraints to product, product_variant, warehouse, user, organization
- Composite indexes for aggregate queries and timeline lookups

### 3. Run the migration

```bash
bun db:migrate
```

### 4. Regenerate database types

```bash
bun db:codegen
```

This updates `src/shared/infrastructure/persistence/types.ts` with the new `StockMovement` table type.

### 5. Verify

```bash
bun run lint
```

## Module Structure

Create the vertical slice module:

```bash
mkdir -p src/modules/inventory/{domain/{entities,types},application/{repositories,services,types},infrastructure/repositories,presentation/{actions,components,schemas,lib,types}}
```

## Key Implementation Order

1. **Domain layer**: Entity interface (`stock-movement.ts`), types (`MovementType`, `StockLevel`)
2. **Application layer**: Repository interface, service (business logic for receive/dispatch/adjust/transfer)
3. **Infrastructure layer**: Kysely repository implementation with aggregate queries
4. **Presentation layer**: Zod schemas → Server actions → Components

## Quick Verification

After implementation, verify the core flow:

1. Navigate to `/inventory` — should show empty stock dashboard
2. Click "Receive Stock" — fill product, warehouse, quantity → submit
3. Dashboard should show the received quantity
4. Click "Dispatch Stock" — dispatch some quantity → verify stock decreases
5. Try dispatching more than available → negative stock warning should appear
6. Perform "Adjust Stock" → set to specific value → verify

## Architecture Notes

- **No `stock_level` table**: Current stock is always `SUM(delta)` from `stock_movement`
- **Transfers**: Two movements (dispatch + receive) within a single DB transaction, linked by `reference_id`
- **All movements immutable**: No update/delete operations on `stock_movement` records
- **Multi-tenancy**: All queries filter by `organization_id` from session
