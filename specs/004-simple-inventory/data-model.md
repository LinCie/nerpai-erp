# Data Model: Simple Inventory Module

**Feature Branch**: `004-simple-inventory`  
**Date**: 2026-03-02  
**Status**: Draft

## Design Philosophy

This module uses a **ledger-based architecture** where the `stock_movement` table is the single source of truth. Current stock levels are derived via `SUM(delta)` aggregation, guaranteeing mathematical consistency by design (DIR-002). There is no separate "stock level" table — this eliminates dual-write drift and simplifies the data model.

## Entities

### Stock Movement

An immutable record of a change in stock quantity. Every receive, dispatch, adjustment, or transfer operation creates one or more stock movement records. Movements are append-only — they are never updated or individually deleted.

| Column          | DB Name (snake_case) | App Name (camelCase) | Type          | Nullable | Default             | Notes                                          |
| --------------- | -------------------- | -------------------- | ------------- | -------- | ------------------- | ---------------------------------------------- |
| Primary Key     | `id`                 | `id`                 | `UUID`        | No       | `uuidv7()`          | UUID v7, auto-generated                        |
| Product         | `product_id`         | `productId`          | `UUID`        | No       | —                   | FK → `product.id`                              |
| Product Variant | `product_variant_id` | `productVariantId`   | `UUID`        | Yes      | `NULL`              | FK → `product_variant.id`. NULL = base product |
| Warehouse       | `warehouse_id`       | `warehouseId`        | `UUID`        | No       | —                   | FK → `warehouse.id`                            |
| Movement Type   | `movement_type`      | `movementType`       | `VARCHAR(20)` | No       | —                   | Enum: `receive`, `dispatch`, `adjustment`      |
| Delta           | `delta`              | `delta`              | `INTEGER`     | No       | —                   | Positive for additions, negative for removals  |
| Reference ID    | `reference_id`       | `referenceId`        | `UUID`        | Yes      | `NULL`              | Links paired movements (e.g., transfer pair)   |
| Notes           | `notes`              | `notes`              | `TEXT`        | Yes      | `NULL`              | User-provided context for the movement         |
| Created By      | `created_by`         | `createdBy`          | `UUID`        | No       | —                   | FK → `user.id` — who performed the action      |
| Organization    | `organization_id`    | `organizationId`     | `UUID`        | No       | —                   | FK → `organization.id`                         |
| Created At      | `created_at`         | `createdAt`          | `TIMESTAMPTZ` | No       | `CURRENT_TIMESTAMP` | Immutable timestamp of the movement            |
| Deleted At      | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ` | Yes      | `NULL`              | Constitution IX compliance (see plan.md)       |

### Computed: Stock Level (Virtual Entity)

Current stock is not stored — it is computed on-the-fly via aggregate query. This type exists only in the application layer.

```typescript
// Not a database table — computed via SUM(delta)
interface StockLevel {
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  currentStock: number; // = SUM(delta) from stock_movement
}
```

## Relationships

```
organization (1) ──────< stock_movement (many)
   └── id (PK)              └── organization_id (FK)

product (1) ──────< stock_movement (many)
   └── id (PK)         └── product_id (FK)

product_variant (1) ──────< stock_movement (many)  [optional]
   └── id (PK)                └── product_variant_id (FK, nullable)

warehouse (1) ──────< stock_movement (many)
   └── id (PK)            └── warehouse_id (FK)

user (1) ──────< stock_movement (many)
   └── id (PK)        └── created_by (FK)
```

- **Organization → Stock Movements**: All movements scoped to org for multi-tenancy
- **Product → Stock Movements**: Track stock per product
- **Product Variant → Stock Movements**: Optional granularity. NULL variant means base product tracking (FR-007)
- **Warehouse → Stock Movements**: Track stock per location
- **User → Stock Movements**: Audit trail of who performed each action (FR-006)

### Cascade Rules

| From Table       | To Table          | On Delete | Rationale                                                      |
| ---------------- | ----------------- | --------- | -------------------------------------------------------------- |
| `stock_movement` | `organization`    | CASCADE   | Organization deletion removes all its movements                |
| `stock_movement` | `product`         | CASCADE   | Product deletion cascades to movement records (spec edge case) |
| `stock_movement` | `product_variant` | CASCADE   | Variant deletion cascades to movement records                  |
| `stock_movement` | `warehouse`       | CASCADE   | Warehouse deletion cascades to movement records                |
| `stock_movement` | `user`            | RESTRICT  | Cannot delete a user who has performed inventory actions       |

## Constraints

### CHECK Constraints

| Constraint Name                    | Table            | Expression                                                     | Spec Reference |
| ---------------------------------- | ---------------- | -------------------------------------------------------------- | -------------- |
| `stock_movement_type_check`        | `stock_movement` | `CHECK (movement_type IN ('receive','dispatch','adjustment'))` | FR-006         |
| `stock_movement_delta_not_zero`    | `stock_movement` | `CHECK (delta <> 0)`                                           | DIR-002        |
| `stock_movement_receive_positive`  | `stock_movement` | `CHECK (movement_type <> 'receive' OR delta > 0)`              | FR-002         |
| `stock_movement_dispatch_negative` | `stock_movement` | `CHECK (movement_type <> 'dispatch' OR delta < 0)`             | FR-003         |

### Foreign Key Constraints

| Constraint Name                  | Table            | Column(s)            | References            | On Delete |
| -------------------------------- | ---------------- | -------------------- | --------------------- | --------- |
| `stock_movement_product_fk`      | `stock_movement` | `product_id`         | `product(id)`         | CASCADE   |
| `stock_movement_variant_fk`      | `stock_movement` | `product_variant_id` | `product_variant(id)` | CASCADE   |
| `stock_movement_warehouse_fk`    | `stock_movement` | `warehouse_id`       | `warehouse(id)`       | CASCADE   |
| `stock_movement_organization_fk` | `stock_movement` | `organization_id`    | `organization(id)`    | CASCADE   |
| `stock_movement_created_by_fk`   | `stock_movement` | `created_by`         | `user(id)`            | RESTRICT  |

## Indexes

| Index Name                     | Table            | Column(s)                                                         | Type   | Purpose                                   |
| ------------------------------ | ---------------- | ----------------------------------------------------------------- | ------ | ----------------------------------------- |
| `stock_movement_pkey`          | `stock_movement` | `id`                                                              | PK     | Primary key                               |
| `stock_movement_aggregate_idx` | `stock_movement` | `(organization_id, product_id, product_variant_id, warehouse_id)` | B-tree | Stock aggregation (`SUM(delta)` GROUP BY) |
| `stock_movement_timeline_idx`  | `stock_movement` | `(organization_id, created_at DESC)`                              | B-tree | Movement history ordered by time          |
| `stock_movement_warehouse_idx` | `stock_movement` | `(warehouse_id, organization_id)`                                 | B-tree | Warehouse-specific stock queries          |
| `stock_movement_product_idx`   | `stock_movement` | `(product_id, organization_id)`                                   | B-tree | Product-specific stock history            |
| `stock_movement_reference_idx` | `stock_movement` | `(reference_id)`                                                  | B-tree | Lookup paired transfer movements          |

### Query Optimization Notes

1. **Stock Level Dashboard** (most common query):

   ```sql
   SELECT product_id, product_variant_id, warehouse_id,
          COALESCE(SUM(delta), 0) AS current_stock
   FROM stock_movement
   WHERE organization_id = $1
     AND deleted_at IS NULL
   GROUP BY product_id, product_variant_id, warehouse_id;
   ```

   **Index used**: `stock_movement_aggregate_idx`

2. **Single Product Stock at Warehouse**:

   ```sql
   SELECT COALESCE(SUM(delta), 0) AS current_stock
   FROM stock_movement
   WHERE organization_id = $1
     AND product_id = $2
     AND (product_variant_id = $3 OR ($3 IS NULL AND product_variant_id IS NULL))
     AND warehouse_id = $4
     AND deleted_at IS NULL;
   ```

   **Index used**: `stock_movement_aggregate_idx`

3. **Movement History for Product/Warehouse**:
   ```sql
   SELECT * FROM stock_movement
   WHERE organization_id = $1
     AND product_id = $2
     AND warehouse_id = $3
     AND deleted_at IS NULL
   ORDER BY created_at DESC
   LIMIT $4 OFFSET $5;
   ```
   **Index used**: `stock_movement_aggregate_idx` + sort on `created_at`

## Validation Rules

| Entity         | Field              | Rule                                                                        | Error Message                                 |
| -------------- | ------------------ | --------------------------------------------------------------------------- | --------------------------------------------- |
| Stock Movement | `productId`        | Required, must reference existing active product                            | "Product is required"                         |
| Stock Movement | `productVariantId` | Optional, if provided must reference existing active variant of the product | "Invalid product variant"                     |
| Stock Movement | `warehouseId`      | Required, must reference existing active warehouse                          | "Warehouse is required"                       |
| Stock Movement | `movementType`     | Required, must be one of: `receive`, `dispatch`, `adjustment`               | "Invalid movement type"                       |
| Stock Movement | `delta`            | Required, non-zero integer. Sign must match movement type.                  | "Quantity must be a non-zero integer"         |
| Stock Movement | `notes`            | Optional, max 1000 chars                                                    | "Notes must be 1000 characters or less"       |
| Transfer       | source warehouse   | Must differ from destination warehouse                                      | "Source and destination must be different"    |
| Transfer       | quantity           | Must be positive integer                                                    | "Transfer quantity must be positive"          |
| Dispatch       | resulting balance  | Warn if resulting stock < 0 (do not block per FR-004)                       | "Warning: This will result in negative stock" |

## Domain Types

### Stock Movement Entity (TypeScript)

```typescript
// src/modules/inventory/domain/entities/stock-movement.ts

/** Stock Movement — immutable audit record of a stock level change */
export interface StockMovement {
  id: string; // UUID v7
  productId: string; // FK → product.id
  productVariantId: string | null; // FK → product_variant.id, null = base product
  warehouseId: string; // FK → warehouse.id
  movementType: MovementType;
  delta: number; // Positive = addition, negative = removal
  referenceId: string | null; // Links paired transfer movements
  notes: string | null; // Max 1000 chars
  createdBy: string; // FK → user.id
  organizationId: string; // FK → organization.id
  createdAt: Date; // Immutable timestamp
  deletedAt: Date | null; // Constitution IX compliance
}
```

### Domain Types

```typescript
// src/modules/inventory/domain/types/index.ts

/** Movement type enum — constrained in DB via CHECK */
export type MovementType = "receive" | "dispatch" | "adjustment";

/** Computed stock level — not stored in DB */
export interface StockLevel {
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  currentStock: number;
}

/** Stock level with product/warehouse details for dashboard display */
export interface StockLevelWithDetails {
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantSku: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  currentStock: number;
}
```

### Application Layer DTOs

```typescript
// src/modules/inventory/application/types/index.ts

/** Params for recording a stock receive */
export interface ReceiveStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  quantity: number; // Must be > 0
  notes?: string | null;
  createdBy: string;
  organizationId: string;
}

/** Params for recording a stock dispatch */
export interface DispatchStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  quantity: number; // Must be > 0 (will be negated internally)
  notes?: string | null;
  createdBy: string;
  organizationId: string;
}

/** Params for a manual stock adjustment */
export interface AdjustStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  newQuantity: number; // Absolute target quantity
  notes?: string | null;
  createdBy: string;
  organizationId: string;
}

/** Params for transferring stock between warehouses */
export interface TransferStockParams {
  productId: string;
  productVariantId?: string | null;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number; // Must be > 0
  notes?: string | null;
  createdBy: string;
  organizationId: string;
}

/** Params for querying stock levels */
export interface GetStockLevelsParams {
  organizationId: string;
  productId?: string;
  warehouseId?: string;
  search?: string; // Search across product name, variant SKU, warehouse name
  limit?: number;
  offset?: number;
}

/** Params for querying movement history */
export interface GetMovementHistoryParams {
  organizationId: string;
  productId?: string;
  productVariantId?: string | null;
  warehouseId?: string;
  movementType?: MovementType;
  limit?: number;
  offset?: number;
}

/** Result for getting current stock at a specific location */
export interface GetCurrentStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  organizationId: string;
}
```

## State Transitions

Stock movements are append-only — there are no state transitions on the movement records themselves. The "state" is the running total of deltas:

```
Stock Level = SUM(delta) of all stock_movement records
  WHERE product_id = X
    AND product_variant_id = Y (or IS NULL)
    AND warehouse_id = Z
    AND organization_id = O
    AND deleted_at IS NULL
```

### Movement Type Effects

```
receive     →  delta > 0  →  stock increases
dispatch    →  delta < 0  →  stock decreases (may go negative per FR-004)
adjustment  →  delta = (new_qty - current_stock)  →  stock set to exact value
transfer    →  dispatch from source + receive at destination (atomic, same reference_id)
```

## Migration SQL

### Migration: Create Stock Movement Table

```sql
-- Migration: create_stock_movement_table
-- Created: 2026-03-02
-- Description: Create stock_movement table for ledger-based inventory tracking

-- Up Migration
CREATE TABLE stock_movement (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variant(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouse(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL,
  delta INTEGER NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- CHECK constraints
ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_type_check
  CHECK (movement_type IN ('receive', 'dispatch', 'adjustment'));

ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_delta_not_zero
  CHECK (delta <> 0);

ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_receive_positive
  CHECK (movement_type <> 'receive' OR delta > 0);

ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_dispatch_negative
  CHECK (movement_type <> 'dispatch' OR delta < 0);

-- Indexes for stock aggregation and querying
CREATE INDEX stock_movement_aggregate_idx
  ON stock_movement (organization_id, product_id, product_variant_id, warehouse_id);

CREATE INDEX stock_movement_timeline_idx
  ON stock_movement (organization_id, created_at DESC);

CREATE INDEX stock_movement_warehouse_idx
  ON stock_movement (warehouse_id, organization_id);

CREATE INDEX stock_movement_product_idx
  ON stock_movement (product_id, organization_id);

CREATE INDEX stock_movement_reference_idx
  ON stock_movement (reference_id)
  WHERE reference_id IS NOT NULL;

-- Down Migration
-- DROP TABLE IF EXISTS stock_movement;
```

## Error Handling Scenarios

### Application-Level Errors

| Error Scenario                       | Error Type         | User Message                                          |
| ------------------------------------ | ------------------ | ----------------------------------------------------- |
| Validation — Product required        | `VALIDATION_ERROR` | "Product is required"                                 |
| Validation — Warehouse required      | `VALIDATION_ERROR` | "Warehouse is required"                               |
| Validation — Invalid quantity        | `VALIDATION_ERROR` | "Quantity must be a positive number"                  |
| Validation — Transfer same warehouse | `VALIDATION_ERROR` | "Source and destination warehouses must be different" |
| Product not found                    | `NOT_FOUND`        | "Product not found"                                   |
| Warehouse not found                  | `NOT_FOUND`        | "Warehouse not found"                                 |
| Variant not found or doesn't belong  | `NOT_FOUND`        | "Product variant not found"                           |
| Negative stock warning               | `WARNING`          | "This will result in negative stock ({n} units)"      |
| Database connection error            | `DATABASE_ERROR`   | "Unable to process stock movement. Please try again." |

### Database-Level Errors

| Error                           | Cause                                      | Handling                                            |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| `check_violation` (23514)       | Invalid movement type or zero delta        | Caught by application validation before reaching DB |
| `foreign_key_violation` (23503) | Invalid product/warehouse/variant/user ref | Caught by validation; surface as not-found error    |
| `not_null_violation` (23502)    | Missing required field                     | Caught by Zod schema validation                     |
