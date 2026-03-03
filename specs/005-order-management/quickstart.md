# Quickstart: Order Management Module

**Feature Branch**: `005-order-management`  
**Date**: 2026-03-03

## Prerequisites

- Node.js / Bun installed
- PostgreSQL 18.x running with database created
- `DATABASE_URL` environment variable set
- Existing modules deployed: products, product variants, warehouses
- At least one organization with an active user session
- At least one product with a variant (for creating orders)

## Setup

### 1. Enable pg_trgm extension (if not already enabled)

```bash
bun db:migrate:create enable_pg_trgm_extension
```

Copy the extension SQL from [data-model.md — Migration 1](./data-model.md#migration-1-enable-pg_trgm-extension) into the generated migration file.

### 2. Create the order tables migration

```bash
bun db:migrate:create create_order_tables
```

Copy the SQL from [data-model.md — Migration 2](./data-model.md#migration-2-create-order-tables) into the generated migration file. The migration creates:

- `order` table with UUID v7 PK, status CHECK, optimistic locking version column
- `order_item` table with snapshotted product data and nullable FK references
- `order_status_history` table for immutable audit trail
- CHECK constraints for all business rules
- Composite indexes for filtered queries and pg_trgm GIN index for customer search

### 3. Run the migrations

```bash
bun db:migrate
```

### 4. Regenerate database types

```bash
bun db:codegen
```

This updates `src/shared/infrastructure/persistence/types.ts` with the new `Order`, `OrderItem`, and `OrderStatusHistory` table types.

### 5. Verify

```bash
bun run lint
```

## Module Structure

Create the vertical slice module:

```bash
mkdir -p src/modules/orders/{domain/{entities,types},application/{repositories,services,types},infrastructure/repositories,presentation/{actions,components,schemas,lib,types}}
```

## Key Implementation Order

1. **Domain layer**: Entity interfaces (`order.ts`, `order-item.ts`, `order-status-history.ts`), types (status enum, transition map, helpers)
2. **Application layer**: Repository interfaces (order, order-item, order-status-history), service (business logic for create, update, transition, list, detail), application types/DTOs
3. **Infrastructure layer**: Kysely repository implementations with transactions, joins, and optimistic locking
4. **Presentation layer**: Zod schemas → Server actions → Components (order form, order list, order detail, status stepper, product picker)

## Quick Verification

After implementation, verify the core flow:

1. Navigate to `/orders` — should show empty order list
2. Click "Create Order" — fill customer name, search and select product, set quantity → submit
3. Order should appear in list with "Unpaid" status
4. Click order to view detail — should show stepper at "Unpaid" position
5. Click "Advance to Paid" → confirmation dialog → confirm → status changes to "Paid"
6. Continue advancing through Process → Sent → Completed
7. Verify status history shows all transitions with timestamps and user
8. Create another order and test "Cancel" from Unpaid status
9. Create another order, advance to "Sent", and test "Return"
10. Verify that terminal states (Cancelled, Return) show badge instead of stepper

## Architecture Notes

- **State machine in domain layer**: `ORDER_STATUS_TRANSITIONS` map is the single source of truth for valid transitions, consumed by the service layer
- **Optimistic locking**: `version` column on `order` table prevents concurrent status changes; version mismatch surfaces as user-friendly error
- **Snapshotted line items**: Product data is copied to `order_item` at creation — immune to future product edits/deletions
- **Atomic order creation**: `order` + `order_item[]` + initial `order_status_history` entry created within a single DB transaction
- **Status transitions within transaction**: `order` status update + `order_status_history` insert happen atomically
- **Multi-tenancy**: All queries filter by `organization_id` from session
- **No soft delete at app layer**: `deleted_at` columns exist for Constitution IX compliance, but orders use status-based lifecycle (Cancelled/Return) — never soft-deleted
- **`pg_trgm` for customer search**: GIN index with trigram operators enables performant `ILIKE '%...%'` substring search
