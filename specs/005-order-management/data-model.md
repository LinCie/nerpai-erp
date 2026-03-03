# Data Model: Order Management Module

**Feature Branch**: `005-order-management`  
**Date**: 2026-03-03  
**Status**: Draft

## Design Philosophy

This module uses a **state-machine-driven lifecycle** for orders with an **immutable audit trail** for status transitions. The order entity stores the current status, while the `order_status_history` table provides a complete, immutable log of every transition. Line items snapshot product data at creation time, making orders self-contained and immune to future product changes.

## Entities

### Order

Represents a customer order being tracked through the fulfillment pipeline. An order is created with "unpaid" status and progresses sequentially through the pipeline, with branch paths to "cancelled" or "return" terminal states.

| Column        | DB Name (snake_case) | App Name (camelCase) | Type            | Nullable | Default             | Notes                                                              |
| ------------- | -------------------- | -------------------- | --------------- | -------- | ------------------- | ------------------------------------------------------------------ |
| Primary Key   | `id`                 | `id`                 | `UUID`          | No       | `uuidv7()`          | UUID v7, auto-generated                                            |
| Customer Name | `customer_name`      | `customerName`       | `VARCHAR(255)`  | No       | —                   | Free-text customer identifier                                      |
| Status        | `status`             | `status`             | `VARCHAR(20)`   | No       | `'unpaid'`          | Current pipeline status (CHECK constrained)                        |
| Total Amount  | `total_amount`       | `totalAmount`        | `NUMERIC(12,2)` | No       | `0`                 | Sum of all line item subtotals                                     |
| Version       | `version`            | `version`            | `INTEGER`       | No       | `1`                 | Optimistic locking counter                                         |
| Organization  | `organization_id`    | `organizationId`     | `UUID`          | No       | —                   | FK → `organization.id`                                             |
| Created By    | `created_by`         | `createdBy`          | `UUID`          | No       | —                   | FK → `user.id` — who created the order                             |
| Created At    | `created_at`         | `createdAt`          | `TIMESTAMPTZ`   | No       | `CURRENT_TIMESTAMP` | When the order was created                                         |
| Updated At    | `updated_at`         | `updatedAt`          | `TIMESTAMPTZ`   | No       | `CURRENT_TIMESTAMP` | Last modification timestamp                                        |
| Deleted At    | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ`   | Yes      | `NULL`              | Constitution IX compliance (never used at app layer — see plan.md) |

### Order Item (Line Item)

Represents an individual product/variant entry within an order. All product data (name, SKU, unit price) is snapshotted at creation time. The FK references to product/variant are retained for traceability but not relied upon for display.

| Column          | DB Name (snake_case) | App Name (camelCase) | Type            | Nullable | Default             | Notes                                                    |
| --------------- | -------------------- | -------------------- | --------------- | -------- | ------------------- | -------------------------------------------------------- |
| Primary Key     | `id`                 | `id`                 | `UUID`          | No       | `uuidv7()`          | UUID v7, auto-generated                                  |
| Order           | `order_id`           | `orderId`            | `UUID`          | No       | —                   | FK → `order.id`                                          |
| Product         | `product_id`         | `productId`          | `UUID`          | Yes      | `NULL`              | FK → `product.id` (nullable — traceability only)         |
| Product Variant | `product_variant_id` | `productVariantId`   | `UUID`          | Yes      | `NULL`              | FK → `product_variant.id` (nullable — traceability only) |
| Product Name    | `product_name`       | `productName`        | `VARCHAR(255)`  | No       | —                   | Snapshotted product name at order creation time          |
| SKU             | `sku`                | `sku`                | `VARCHAR(100)`  | No       | —                   | Snapshotted SKU at order creation time                   |
| Unit Price      | `unit_price`         | `unitPrice`          | `NUMERIC(12,2)` | No       | —                   | Snapshotted unit price at order creation time            |
| Quantity        | `quantity`           | `quantity`           | `INTEGER`       | No       | —                   | Number of units ordered (> 0)                            |
| Subtotal        | `subtotal`           | `subtotal`           | `NUMERIC(12,2)` | No       | —                   | = quantity × unit_price (stored for query convenience)   |
| Created At      | `created_at`         | `createdAt`          | `TIMESTAMPTZ`   | No       | `CURRENT_TIMESTAMP` | When the line item was added                             |
| Deleted At      | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ`   | Yes      | `NULL`              | Constitution IX compliance                               |

### Order Status History

An immutable audit log of every status transition for an order. Records are append-only — they are never updated or individually deleted.

| Column          | DB Name (snake_case) | App Name (camelCase) | Type          | Nullable | Default             | Notes                                     |
| --------------- | -------------------- | -------------------- | ------------- | -------- | ------------------- | ----------------------------------------- |
| Primary Key     | `id`                 | `id`                 | `UUID`        | No       | `uuidv7()`          | UUID v7, auto-generated                   |
| Order           | `order_id`           | `orderId`            | `UUID`        | No       | —                   | FK → `order.id`                           |
| Previous Status | `previous_status`    | `previousStatus`     | `VARCHAR(20)` | Yes      | `NULL`              | NULL for the initial creation entry       |
| New Status      | `new_status`         | `newStatus`          | `VARCHAR(20)` | No       | —                   | The status after this transition          |
| Changed By      | `changed_by`         | `changedBy`          | `UUID`        | No       | —                   | FK → `user.id` — who performed the action |
| Created At      | `created_at`         | `createdAt`          | `TIMESTAMPTZ` | No       | `CURRENT_TIMESTAMP` | When the transition occurred              |
| Deleted At      | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ` | Yes      | `NULL`              | Constitution IX compliance (never used)   |

## Relationships

```
organization (1) ──────< order (many)
   └── id (PK)              └── organization_id (FK)

user (1) ──────< order (many)
   └── id (PK)        └── created_by (FK)

order (1) ──────< order_item (many)
   └── id (PK)        └── order_id (FK)

order (1) ──────< order_status_history (many)
   └── id (PK)        └── order_id (FK)

product (1) ──────< order_item (many)  [optional — traceability]
   └── id (PK)         └── product_id (FK, nullable)

product_variant (1) ──────< order_item (many)  [optional — traceability]
   └── id (PK)                └── product_variant_id (FK, nullable)

user (1) ──────< order_status_history (many)
   └── id (PK)        └── changed_by (FK)
```

- **Organization → Orders**: All orders scoped to org for multi-tenancy (X)
- **User → Orders**: Track who created each order
- **Order → Order Items**: One order has many line items (1-to-many)
- **Order → Status History**: Complete audit trail of transitions (1-to-many, append-only)
- **Product / Variant → Order Items**: Nullable FKs for traceability only; display data is snapshotted

> **Deferred Column — Payment Proof**: FR-011 specifies that the data model should accommodate a payment proof image reference. A `payment_proof_url` (or similar) column on the `order` table is **deferred to the future implementation phase** when image upload is built. No column is added in this initial migration to avoid unused schema elements.

### Cascade Rules

| From Table             | To Table            | On Delete | Rationale                                                  |
| ---------------------- | ------------------- | --------- | ---------------------------------------------------------- |
| `order`                | `organization`      | CASCADE   | Organization deletion removes all its orders               |
| `order`                | `user` (created_by) | RESTRICT  | Cannot delete a user who has created orders                |
| `order_item`           | `order`             | CASCADE   | Order deletion cascades to its line items                  |
| `order_item`           | `product`           | SET NULL  | Product deletion nullifies FK — snapshotted data preserved |
| `order_item`           | `product_variant`   | SET NULL  | Variant deletion nullifies FK — snapshotted data preserved |
| `order_status_history` | `order`             | CASCADE   | Order deletion cascades to its history                     |
| `order_status_history` | `user` (changed_by) | RESTRICT  | Cannot delete a user who has performed status transitions  |

## Constraints

### CHECK Constraints

| Constraint Name               | Table                  | Expression                                                                                  | Spec Reference |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| `order_status_check`          | `order`                | `CHECK (status IN ('unpaid','paid','process','sent','completed','return','cancelled'))`     | DIR-001        |
| `order_customer_name_check`   | `order`                | `CHECK (TRIM(customer_name) <> '')`                                                         | FR-001, VIII   |
| `order_total_amount_check`    | `order`                | `CHECK (total_amount >= 0)`                                                                 | FR-001         |
| `order_version_check`         | `order`                | `CHECK (version >= 1)`                                                                      | R2             |
| `order_item_quantity_check`   | `order_item`           | `CHECK (quantity > 0)`                                                                      | FR-012         |
| `order_item_unit_price_check` | `order_item`           | `CHECK (unit_price >= 0)`                                                                   | FR-001         |
| `order_item_subtotal_check`   | `order_item`           | `CHECK (subtotal >= 0)`                                                                     | FR-001         |
| `order_item_name_check`       | `order_item`           | `CHECK (TRIM(product_name) <> '')`                                                          | FR-001, VIII   |
| `order_item_sku_check`        | `order_item`           | `CHECK (TRIM(sku) <> '')`                                                                   | FR-001, VIII   |
| `order_history_status_check`  | `order_status_history` | `CHECK (new_status IN ('unpaid','paid','process','sent','completed','return','cancelled'))` | FR-009         |

### Foreign Key Constraints

| Constraint Name               | Table                  | Column(s)            | References            | On Delete |
| ----------------------------- | ---------------------- | -------------------- | --------------------- | --------- |
| `order_organization_fk`       | `order`                | `organization_id`    | `organization(id)`    | CASCADE   |
| `order_created_by_fk`         | `order`                | `created_by`         | `user(id)`            | RESTRICT  |
| `order_item_order_fk`         | `order_item`           | `order_id`           | `order(id)`           | CASCADE   |
| `order_item_product_fk`       | `order_item`           | `product_id`         | `product(id)`         | SET NULL  |
| `order_item_variant_fk`       | `order_item`           | `product_variant_id` | `product_variant(id)` | SET NULL  |
| `order_history_order_fk`      | `order_status_history` | `order_id`           | `order(id)`           | CASCADE   |
| `order_history_changed_by_fk` | `order_status_history` | `changed_by`         | `user(id)`            | RESTRICT  |

## Indexes

| Index Name                       | Table                  | Column(s)                            | Type   | Purpose                                |
| -------------------------------- | ---------------------- | ------------------------------------ | ------ | -------------------------------------- |
| `order_pkey`                     | `order`                | `id`                                 | PK     | Primary key                            |
| `order_org_status_idx`           | `order`                | `(organization_id, status)`          | B-tree | Filter orders by status within org     |
| `order_org_timeline_idx`         | `order`                | `(organization_id, created_at DESC)` | B-tree | Order list sorted by newest first      |
| `order_customer_search_idx`      | `order`                | `customer_name`                      | GIN    | Substring search via `pg_trgm`         |
| `order_item_pkey`                | `order_item`           | `id`                                 | PK     | Primary key                            |
| `order_item_order_idx`           | `order_item`           | `(order_id)`                         | B-tree | FK lookup — items for an order         |
| `order_item_product_idx`         | `order_item`           | `(product_id)`                       | B-tree | Traceability — items by product        |
| `order_status_history_pkey`      | `order_status_history` | `id`                                 | PK     | Primary key                            |
| `order_status_history_order_idx` | `order_status_history` | `(order_id, created_at DESC)`        | B-tree | Status history for an order (timeline) |

### Query Optimization Notes

1. **Orders List (most common query)**:

   ```sql
   SELECT o.*, COUNT(oi.id) AS item_count
   FROM "order" o
   LEFT JOIN order_item oi ON oi.order_id = o.id AND oi.deleted_at IS NULL
   WHERE o.organization_id = $1
     AND o.deleted_at IS NULL
     AND ($2::varchar IS NULL OR o.status = $2)
     AND ($3::varchar IS NULL OR o.customer_name ILIKE '%' || $3 || '%')
   GROUP BY o.id
   ORDER BY o.created_at DESC
   LIMIT $4 OFFSET $5;
   ```

   **Indexes used**: `order_org_status_idx`, `order_org_timeline_idx`, `order_customer_search_idx`

2. **Order Detail with Items**:

   ```sql
   SELECT o.* FROM "order" o
   WHERE o.id = $1 AND o.organization_id = $2 AND o.deleted_at IS NULL;

   SELECT oi.* FROM order_item oi
   WHERE oi.order_id = $1 AND oi.deleted_at IS NULL
   ORDER BY oi.created_at ASC;
   ```

   **Indexes used**: `order_pkey`, `order_item_order_idx`

3. **Status History for Order**:

   ```sql
   SELECT osh.*, u.name AS changed_by_name
   FROM order_status_history osh
   LEFT JOIN "user" u ON u.id = osh.changed_by
   WHERE osh.order_id = $1 AND osh.deleted_at IS NULL
   ORDER BY osh.created_at ASC;
   ```

   **Index used**: `order_status_history_order_idx`

## Validation Rules

| Entity            | Field          | Rule                                               | Error Message                                     |
| ----------------- | -------------- | -------------------------------------------------- | ------------------------------------------------- |
| Order             | `customerName` | Required, non-empty after trim, max 255 chars      | "Customer name is required"                       |
| Order             | `items`        | Required, at least 1 item (FR-012)                 | "At least one line item is required"              |
| Order Item        | `productName`  | Required, non-empty after trim                     | "Product name is required"                        |
| Order Item        | `sku`          | Required, non-empty after trim                     | "SKU is required"                                 |
| Order Item        | `unitPrice`    | Required, >= 0, numeric                            | "Unit price must be a non-negative number"        |
| Order Item        | `quantity`     | Required, integer > 0                              | "Quantity must be a positive integer"             |
| Status Transition | `from → to`    | Must be in `ORDER_STATUS_TRANSITIONS` map          | "Invalid status transition from {from} to {to}"   |
| Status Transition | `version`      | Must match current order version (optimistic lock) | "Order was modified by another user"              |
| Order Edit        | `status`       | Only editable when status = "unpaid" (FR-014)      | "Order can only be edited while in Unpaid status" |

## Domain Types

### Order Entity (TypeScript)

```typescript
// src/modules/orders/domain/entities/order.ts

/** Order — a customer order tracked through the fulfillment pipeline */
export interface Order {
  id: string; // UUID v7
  customerName: string; // Free-text customer identifier
  status: OrderStatus; // Current pipeline status
  totalAmount: string; // NUMERIC stored as string (Kysely pattern)
  version: number; // Optimistic locking counter
  organizationId: string; // FK → organization.id
  createdBy: string; // FK → user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // Constitution IX compliance
}
```

### Order Item Entity (TypeScript)

```typescript
// src/modules/orders/domain/entities/order-item.ts

/** Order Item — a snapshotted product/variant entry within an order */
export interface OrderItem {
  id: string; // UUID v7
  orderId: string; // FK → order.id
  productId: string | null; // FK → product.id (nullable — traceability)
  productVariantId: string | null; // FK → product_variant.id (nullable — traceability)
  productName: string; // Snapshotted at creation time
  sku: string; // Snapshotted at creation time
  unitPrice: string; // Snapshotted at creation time (NUMERIC as string)
  quantity: number; // > 0
  subtotal: string; // = quantity × unitPrice (NUMERIC as string)
  createdAt: Date;
  deletedAt: Date | null; // Constitution IX compliance
}
```

### Order Status History Entity (TypeScript)

```typescript
// src/modules/orders/domain/entities/order-status-history.ts

/** Order Status History — immutable audit record of a status transition */
export interface OrderStatusHistory {
  id: string; // UUID v7
  orderId: string; // FK → order.id
  previousStatus: OrderStatus | null; // NULL for initial creation
  newStatus: OrderStatus;
  changedBy: string; // FK → user.id
  createdAt: Date;
  deletedAt: Date | null; // Constitution IX compliance
}
```

### Domain Types

```typescript
// src/modules/orders/domain/types/index.ts

/** Order status enum — constrained in DB via CHECK */
export type OrderStatus =
  | "unpaid"
  | "paid"
  | "process"
  | "sent"
  | "completed"
  | "return"
  | "cancelled";

/** Pipeline (non-terminal) statuses in display order */
export const PIPELINE_STATUSES: readonly OrderStatus[] = [
  "unpaid",
  "paid",
  "process",
  "sent",
  "completed",
] as const;

/** Terminal statuses */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  "return",
  "cancelled",
] as const;

/** State machine: valid transitions from each status */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  unpaid: ["paid", "cancelled"],
  paid: ["process", "cancelled"],
  process: ["sent", "cancelled"],
  sent: ["completed", "return"],
  completed: ["return"],
  return: [],
  cancelled: [],
} as const;

/** Check if a transition is valid */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** Check if a status is terminal */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[status].length === 0;
}

/** Display labels for statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  process: "Processing",
  sent: "Sent",
  completed: "Completed",
  return: "Returned",
  cancelled: "Cancelled",
};
```

### Application Layer DTOs

```typescript
// src/modules/orders/application/types/index.ts

/** Params for creating a new order */
export interface CreateOrderParams {
  customerName: string;
  items: CreateOrderItemParams[];
  createdBy: string;
  organizationId: string;
}

export interface CreateOrderItemParams {
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number; // Numeric value (converted to NUMERIC on insert)
  quantity: number; // > 0
}

/** Params for updating an order (only while unpaid) */
export interface UpdateOrderParams {
  id: string;
  customerName: string;
  items: CreateOrderItemParams[];
  version: number; // Optimistic locking
  organizationId: string;
}

/** Params for transitioning order status */
export interface TransitionOrderStatusParams {
  orderId: string;
  newStatus: OrderStatus;
  version: number; // Optimistic locking
  changedBy: string;
  organizationId: string;
}

/** Params for listing orders */
export interface GetOrdersParams {
  organizationId: string;
  status?: OrderStatus;
  search?: string; // Customer name search
  limit?: number; // Default: 20
  offset?: number; // Default: 0
}

/** Params for getting a single order with details */
export interface GetOrderDetailParams {
  orderId: string;
  organizationId: string;
}

/** Order with item count for list display */
export interface OrderListItem {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: string;
  itemCount: number;
  version: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Order detail with items and status history */
export interface OrderDetail {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: string;
  version: number;
  createdBy: string;
  createdByName: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemDetail[];
  statusHistory: OrderStatusHistoryEntry[];
}

/** Status history entry with user name for display */
export interface OrderStatusHistoryEntry {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string;
  changedByName: string;
  createdAt: Date;
}

/** Order item detail for presentation (subset of OrderItem entity) */
export interface OrderItemDetail {
  id: string;
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

/** Product/variant search result for the product picker */
export interface ProductPickerItem {
  productId: string;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: string;
  hasVariants: boolean;
}
```

## State Transitions

### State Machine Diagram

```
                    ┌─────────────────────────────────────────┐
                    │          MAIN PIPELINE (sequential)     │
                    │                                         │
                    │  Unpaid → Paid → Process → Sent → Completed
                    │                                         │
                    └─────────────────────────────────────────┘
                              │                    │        │
                              │ (from Unpaid,      │ (from  │
                              │  Paid, Process)    │ Sent,  │
                              ▼                    │ Completed)
                          Cancelled                ▼
                          (terminal)            Return
                                               (terminal)
```

### Transition Matrix

| From Status | Allowed Transitions | Action Required              |
| ----------- | ------------------- | ---------------------------- |
| unpaid      | paid, cancelled     | Forward: confirmation dialog |
| paid        | process, cancelled  | Forward: confirmation dialog |
| process     | sent, cancelled     | Forward: confirmation dialog |
| sent        | completed, return   | Forward: confirmation dialog |
| completed   | return              | Return: confirmation dialog  |
| return      | _(none — terminal)_ | —                            |
| cancelled   | _(none — terminal)_ | —                            |

### Transition Flow

```
1. User clicks "Advance" or "Cancel"/"Return" button
2. Confirmation dialog appears: "Are you sure you want to advance this order to {status}?"
3. User confirms
4. Server action:
   a. Validate transition (canTransition check)
   b. Optimistic lock check (version matches)
   c. Within DB transaction:
      - UPDATE order SET status, version+1, updated_at
      - INSERT order_status_history (previous_status, new_status, changed_by, created_at)
   d. Return success or error
5. Client revalidates order data
```

## Migration SQL

### Migration 1: Enable pg_trgm Extension

```sql
-- Migration: enable_pg_trgm_extension
-- Created: 2026-03-03
-- Description: Enable pg_trgm for ILIKE substring search on customer_name

-- Up Migration
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Down Migration
-- DROP EXTENSION IF EXISTS pg_trgm;
```

### Migration 2: Create Order Tables

```sql
-- Migration: create_order_tables
-- Created: 2026-03-03
-- Description: Create order, order_item, and order_status_history tables

-- Up Migration

-- 1. Order table
CREATE TABLE "order" (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  customer_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- CHECK constraints for order
ALTER TABLE "order" ADD CONSTRAINT order_status_check
  CHECK (status IN ('unpaid', 'paid', 'process', 'sent', 'completed', 'return', 'cancelled'));

ALTER TABLE "order" ADD CONSTRAINT order_customer_name_check
  CHECK (TRIM(customer_name) <> '');

ALTER TABLE "order" ADD CONSTRAINT order_total_amount_check
  CHECK (total_amount >= 0);

ALTER TABLE "order" ADD CONSTRAINT order_version_check
  CHECK (version >= 1);

-- Indexes for order
CREATE INDEX order_org_status_idx ON "order" (organization_id, status);
CREATE INDEX order_org_timeline_idx ON "order" (organization_id, created_at DESC);
CREATE INDEX order_customer_search_idx ON "order" USING GIN (customer_name gin_trgm_ops);

-- 2. Order Item table
CREATE TABLE order_item (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product(id) ON DELETE SET NULL,
  product_variant_id UUID REFERENCES product_variant(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- CHECK constraints for order_item
ALTER TABLE order_item ADD CONSTRAINT order_item_quantity_check
  CHECK (quantity > 0);

ALTER TABLE order_item ADD CONSTRAINT order_item_unit_price_check
  CHECK (unit_price >= 0);

ALTER TABLE order_item ADD CONSTRAINT order_item_subtotal_check
  CHECK (subtotal >= 0);

ALTER TABLE order_item ADD CONSTRAINT order_item_name_check
  CHECK (TRIM(product_name) <> '');

ALTER TABLE order_item ADD CONSTRAINT order_item_sku_check
  CHECK (TRIM(sku) <> '');

-- Indexes for order_item
CREATE INDEX order_item_order_idx ON order_item (order_id);
CREATE INDEX order_item_product_idx ON order_item (product_id);

-- 3. Order Status History table
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- CHECK constraints for order_status_history
ALTER TABLE order_status_history ADD CONSTRAINT order_history_status_check
  CHECK (new_status IN ('unpaid', 'paid', 'process', 'sent', 'completed', 'return', 'cancelled'));

-- Indexes for order_status_history
CREATE INDEX order_status_history_order_idx ON order_status_history (order_id, created_at DESC);

-- Down Migration
-- DROP TABLE IF EXISTS order_status_history;
-- DROP TABLE IF EXISTS order_item;
-- DROP TABLE IF EXISTS "order";
```

## Error Handling Scenarios

### Application-Level Errors

| Error Scenario                             | Error Type             | User Message                                          |
| ------------------------------------------ | ---------------------- | ----------------------------------------------------- |
| Validation — Customer name required        | `VALIDATION_ERROR`     | "Customer name is required"                           |
| Validation — No line items                 | `VALIDATION_ERROR`     | "At least one line item is required"                  |
| Validation — Invalid quantity              | `VALIDATION_ERROR`     | "Quantity must be a positive integer"                 |
| Invalid status transition                  | `FORBIDDEN_TRANSITION` | "Cannot transition from {from} to {to}"               |
| Order not found                            | `NOT_FOUND`            | "Order not found"                                     |
| Order is locked (not unpaid)               | `ORDER_LOCKED`         | "Order can only be edited while in Unpaid status"     |
| Concurrent modification (version mismatch) | `CONCURRENCY_ERROR`    | "Order was modified by another user. Please refresh." |
| Database connection error                  | `DATABASE_ERROR`       | "Unable to process order. Please try again."          |

### Database-Level Errors

| Error                           | Cause                                         | Handling                                            |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `check_violation` (23514)       | Invalid status value or empty customer name   | Caught by application validation before reaching DB |
| `foreign_key_violation` (23503) | Invalid organization/user/product/variant ref | Caught by validation; surface as not-found error    |
| `not_null_violation` (23502)    | Missing required field                        | Caught by Zod schema validation                     |
