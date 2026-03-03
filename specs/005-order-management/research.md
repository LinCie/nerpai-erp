# Research: Order Management Module

**Feature Branch**: `005-order-management`  
**Date**: 2026-03-03  
**Status**: Complete

## Research Topics

### R1: Order Status State Machine Design Pattern

**Decision**: Implement a pure-data state machine using a TypeScript `Record<OrderStatus, OrderStatus[]>` transition map, enforced at the application layer with DB CHECK constraints on the status column.

**Rationale**:

- Industry best practice for order management systems (confirmed via Exa research on Spryker OMS, CommerceTools, and Spring State Machine patterns) is to use a formal state machine definition rather than nested if/else blocks
- For this module's complexity level (7 statuses, sparse transition matrix), a simple adjacency-map approach is superior to a full state machine library or the State Design Pattern (which introduces one class per state — overkill for 7 states with no per-state behavior beyond transition validation)
- The transition map is defined once in the domain layer and consumed by the service layer, making it testable and independent of any framework
- DB CHECK constraint on `status` column ensures only valid values are stored; application layer enforces valid _transitions_

**Pattern**:

```typescript
// Domain layer — single source of truth for allowed transitions
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  unpaid: ["paid", "cancelled"],
  paid: ["process", "cancelled"],
  process: ["sent", "cancelled"],
  sent: ["completed", "return"],
  completed: ["return"],
  return: [], // terminal
  cancelled: [], // terminal
} as const;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}
```

**Alternatives considered**:

1. **State Design Pattern (one class per state)**: Each state class implements allowed transitions. Elegant for complex per-state behavior (e.g., entering "Paid" triggers payment processing). Rejected because our transitions have no side effects beyond status updates and audit logging — the added class hierarchy provides no benefit over a simple map.
2. **Full state machine library (XState, robot3)**: Provides visualizations, guards, and hierarchical states. Rejected as adding unnecessary dependency for a flat 7-state sequential pipeline.
3. **Database-level transition enforcement via triggers**: A PostgreSQL trigger that validates `NEW.status` against `OLD.status`. Rejected because it couples business logic to the database layer and is harder to test — validated first at application layer, with DB as a safety net for status values only.

**External Sources**:

- Spryker OMS: State machines model order processes with explicit transition definitions
- CommerceTools: States with transition rules, versioned for safe modification
- Spring State Machine: Formal state + event + transition model for complex workflows

### R2: Optimistic Locking for Concurrent Order Status Changes

**Decision**: Use a `version` integer column on the `order` table with application-level optimistic locking. Status transition updates include `WHERE version = $expected_version` and check the update result count.

**Rationale**:

- The spec explicitly calls out concurrent status changes: "Last-write-wins with optimistic locking; if the status has changed since the page was loaded, the user is notified to refresh"
- Optimistic locking via version column is the standard approach for web applications where holding database locks across HTTP requests is impractical (confirmed via Exa research on OneUptime, Reintech, and EDB articles)
- Pattern: Read order with version → user takes action → `UPDATE ... SET status = $new, version = version + 1 WHERE id = $id AND version = $loaded_version` → if 0 rows updated, another user changed the order
- Simpler and more predictable than PostgreSQL advisory locks or serializable isolation
- No additional dependencies required — Kysely supports this natively via `WHERE` clause and `.returning()` to check affected rows

**Implementation pattern**:

```typescript
const result = await db
  .updateTable("order")
  .set({
    status: newStatus,
    version: sql`version + 1`,
    updatedAt: sql`CURRENT_TIMESTAMP`,
  })
  .where("id", "=", orderId)
  .where("version", "=", loadedVersion)
  .where("organizationId", "=", organizationId)
  .returning(["id"])
  .executeTakeFirst();

if (!result) {
  throw new OrderConcurrencyError(
    "Order was modified by another user. Please refresh.",
  );
}
```

**Alternatives considered**:

1. **Timestamp-based optimistic locking (`updated_at`)**: Compare timestamps instead of version. Rejected due to clock skew risk and lower-precision granularity compared to integer version.
2. **PostgreSQL row-level locking (`SELECT ... FOR UPDATE`)**: Blocks concurrent reads. Rejected because it holds locks during the HTTP request-response cycle, reducing concurrency.
3. **Last-write-wins without detection**: Simplest approach but violates the spec requirement to notify users of concurrent changes.

**Context7 Library ID**: `/kysely-org/kysely` (v0.28.3)

### R3: Order Line Items with Snapshotted Product Data

**Decision**: Store snapshotted product data (name, SKU, unit_price) directly on the `order_item` table. Retain a nullable FK to `product_variant` for traceability.

**Rationale**:

- Spec FR-001 explicitly requires: "Each line item MUST snapshot the product name, SKU, and unit price at creation time so that the order record is self-contained and immune to future product edits or deletions"
- This is standard practice in order management systems — the order item is a point-in-time record that must remain valid even if the product is later renamed, repriced, or deleted
- Nullable FK `product_variant_id` retained for traceability (e.g., "which product was this originally?") but NOT relied upon for display
- `product_id` also retained as nullable FK for same reason
- Subtotal = `quantity × unit_price`, computed in query or stored as a computed column

**Data flow**:

```
Product Picker → Select Product/Variant → Copy (name, sku, unitPrice) → Save to order_item
```

### R4: Searchable Product/Variant Picker Component

**Decision**: Use shadcn/ui `Combobox` pattern (Popover + Command) for the searchable product picker, with server-side search via debounced query.

**Rationale**:

- Spec FR-001 requires: "searchable product picker to select products/variants via a combobox; product name, SKU, and unit price auto-populate"
- shadcn/ui provides the `Combobox` component using `Popover` + `Command` + `CommandInput` + `CommandList` (confirmed via shadcn MCP registry)
- The picker searches across both products (base items) and product variants (specific SKU/price units)
- When a product with variants is selected, the user must pick a specific variant to populate the line item
- Search is server-side (avoids loading all products into client memory) with debounced input

**Component structure**:

```
ProductPicker (Combobox)
├── Popover
│   └── Command
│       ├── CommandInput (search input)
│       └── CommandList
│           ├── CommandGroup "Products"
│           │   └── CommandItem (product name + variants indicator)
│           └── CommandGroup "Variants"
│               └── CommandItem (variant SKU + price)
```

**shadcn components needed**: `combobox` (Popover + Command), `badge`, `table`, `dialog`, `alert-dialog`, `card`, `button`, `input`, `pagination`, `separator`, `skeleton`

### R5: Visual Order Status Stepper Component

**Decision**: Build a custom stepper component using semantic HTML, Tailwind CSS, and Lucide icons. No shadcn `Stepper` component exists — this is a custom presentation component.

**Rationale**:

- Spec FR-016 requires: "visual stepper/progress bar showing the full main pipeline (Unpaid → Paid → Process → Sent → Completed) with the current status highlighted and completed steps visually distinct"
- shadcn/ui does NOT include a stepper component (confirmed via shadcn MCP registry search — no `stepper` item found)
- Custom stepper built with: horizontal flex layout, circle indicators for each step, connecting lines between steps, color coding for completed/current/upcoming steps
- For terminal states (Cancelled, Return), display a status badge instead of the stepper (per spec)

### R6: TanStack Form Array Fields for Order Line Items

**Decision**: Use TanStack Form's array field API (`field.pushValue`, `field.removeValue`) for dynamic line item management within the order creation/edit form.

**Rationale**:

- Orders require dynamic line items (add/remove products with quantities) — this maps directly to TanStack Form's array field pattern
- Context7 documentation confirms array management via `field.pushValue()` for adding items and indexed field access `items[${index}].fieldName` for nested fields
- Existing project uses TanStack Form extensively (products, warehouses, inventory) — consistent pattern
- Server-side validation via `createServerValidate` with Zod schema ensures minimum 1 line item (FR-012)

**Context7 Library ID**: `/tanstack/form` (v1.11.0)

**Key pattern for line items**:

```typescript
// Form field for items array
<form.Field name="items">
  {(itemsField) => (
    <>
      {itemsField.state.value.map((_, index) => (
        <form.Field key={index} name={`items[${index}].productVariantId`}>
          {(subField) => (/* render product picker + quantity input */)}
        </form.Field>
      ))}
      <Button onClick={() => itemsField.pushValue({ productVariantId: "", quantity: 1 })}>
        Add Item
      </Button>
    </>
  )}
</form.Field>
```

### R7: Kysely Patterns for Order Module

**Decision**: Use Kysely v0.28.x patterns for: transactions (order + items creation), joins (order list with aggregated item count), pagination (limit/offset), and optimistic locking updates.

**Rationale**:

- **Transactions**: Order creation requires atomic insert of `order` + `order_item[]` + initial `order_status_history` entry. Kysely's `db.transaction().execute()` handles this (same pattern as inventory transfers, confirmed via Context7)
- **Joins**: Order list needs product information — `LEFT JOIN` on order items for display. Kysely `leftJoin()` with `on()` callback (confirmed via Context7)
- **Pagination**: Standard `LIMIT/OFFSET` pattern with separate `COUNT(*)` query for total (matches existing product/warehouse patterns)
- **Insert + Returning**: Order insert returns the new order ID for subsequent item inserts. Kysely `.returning(["id"])` (confirmed via Context7)

**Context7 Library ID**: `/kysely-org/kysely` (v0.28.3)

### R8: Index Strategy for Order Queries

**Decision**: Composite indexes on `(organization_id, status)` for filtered lists, `(organization_id, created_at DESC)` for timeline ordering, and `(order_id)` on child tables for FK joins.

**Rationale**:

- Primary query pattern: list orders filtered by status within an org → needs composite index on `(organization_id, status)`
- Secondary pattern: order list sorted by newest first → needs `(organization_id, created_at DESC)`
- Child table queries: order items and status history by order ID → need FK indexes on `order_id`
- Customer name search uses `ILIKE '%term%'` → requires `pg_trgm` GIN index for performant substring search (per Constitution VIII: "substring search MUST use `pg_trgm` indexes or documented equivalent")

**Index plan**:

```sql
-- Order table indexes
CREATE INDEX order_org_status_idx ON "order" (organization_id, status);
CREATE INDEX order_org_timeline_idx ON "order" (organization_id, created_at DESC);
CREATE INDEX order_customer_search_idx ON "order" USING GIN (customer_name gin_trgm_ops);

-- Order item indexes (FK lookups)
CREATE INDEX order_item_order_idx ON order_item (order_id);
CREATE INDEX order_item_product_idx ON order_item (product_id);

-- Status history indexes
CREATE INDEX order_status_history_order_idx ON order_status_history (order_id);
CREATE INDEX order_status_history_timeline_idx ON order_status_history (order_id, created_at DESC);
```

### R9: Soft Delete vs Terminal Status for Orders

**Decision**: Include `deleted_at` column on all order module tables for Constitution IX compliance, but never invoke soft delete at the application layer. Orders use status-based lifecycle (Cancelled/Return) instead of deletion.

**Rationale**:

- Constitution IX requires ALL entities have `deleted_at` column — non-negotiable
- Spec explicitly states: "Soft delete is NOT used for orders — cancellation is the mechanism for removing orders from the active pipeline. Orders are never physically deleted."
- Resolution: Same pattern as `stock_movement` in inventory module — include `deleted_at` for schema compliance, but repository does NOT expose `softDelete()`/`restore()` methods
- Orders in "Cancelled" or "Return" terminal states remain in the database permanently, queryable via status filter
- `order_item` and `order_status_history` also include `deleted_at` for compliance; they cascade with their parent order's lifecycle

**Justified deviation**: Documented in plan.md Complexity Tracking section.

## Context7 References

| Library       | Context7 ID          | Version | Used For                                                       |
| ------------- | -------------------- | ------- | -------------------------------------------------------------- |
| Kysely        | `/kysely-org/kysely` | v0.28.3 | Transactions, joins, pagination, insert+returning, updates     |
| TanStack Form | `/tanstack/form`     | v1.11.0 | Array fields for line items, server-side validation, SSR forms |

## External Research Sources

| Source             | Topic                                              | Key Finding                                                           |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| Spryker Docs       | State machine order process modeling               | Formal state + transition definitions for OMS                         |
| CommerceTools Docs | State machines best practices                      | Version states, test transitions, plan impact of changes              |
| Medium (VivyBlog)  | Order orchestration with Spring State Machine      | State enums + event-driven transitions with persistence               |
| Medium (JIN)       | State Pattern for e-commerce order management      | State pattern encapsulates per-state behavior                         |
| OneUptime Blog     | Optimistic locking implementation                  | Version column pattern with conflict detection and retry strategies   |
| Reintech           | Implementing optimistic locking in PostgreSQL      | Version identifier, verify before update, handle conflicts gracefully |
| EDB                | PostgreSQL anti-patterns: read-modify-write cycles | Atomic UPDATE with WHERE clause prevents lost updates                 |
| shadcn MCP         | Combobox pattern (Popover + Command)               | Searchable select built with Command + Popover primitives             |
| shadcn MCP         | Badge component variants                           | Variant/status badges with color customization                        |
