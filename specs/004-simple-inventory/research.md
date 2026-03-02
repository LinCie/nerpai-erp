# Research: Simple Inventory Module

**Feature Branch**: `004-simple-inventory`  
**Date**: 2026-03-02  
**Status**: Complete

## Research Topics

### R1: Stock Data Architecture — Single Table vs Dual Table

**Decision**: Single table (`stock_movement`) as the sole source of truth, with current stock derived via aggregate queries (`SUM(delta)`).

**Rationale**:

- Guarantees mathematical consistency by design (DIR-002): current stock ≡ SUM of all movements, with no possibility of dual-write drift
- Simpler schema — one source of truth, no cache invalidation concerns
- Append-only writes eliminate update contention for concurrent stock operations
- Aligns with ledger-based inventory pattern used by all major WMS systems (confirmed via Exa research on StackOverflow and system design references)
- For the expected ERP scale (hundreds to low thousands of products, moderate movement frequency), aggregate queries with proper indexes will meet the SC-001 (<2s) performance target

**Alternatives considered**:

1. **Dual table (stock_movement + stock_level cache)**: Faster reads via denormalized quantity column, but introduces dual-write consistency risk and increased complexity. Rejected because the scale doesn't warrant the added complexity.
2. **Materialized view for current stock**: PostgreSQL materialized views offer fast reads but require explicit `REFRESH` (staleness risk). Continuous aggregates (TimescaleDB) solve this but add a dependency. Rejected as premature optimization.
3. **Full event sourcing with CQRS**: Overkill for this use case — no need for event replay, aggregate reconstruction, or complex projections. The audit trail is adequately served by the append-only movement table.

**Performance note**: If aggregate query performance degrades as movement volume grows, the migration path to a summary table or materialized view is straightforward and non-breaking.

### R2: Kysely Transaction Support for Atomic Transfers

**Decision**: Use Kysely's `db.transaction().execute()` for atomic transfer operations (dispatch from source + receive at destination).

**Rationale**:

- Kysely provides first-class transaction support via `db.transaction().execute(async (trx) => { ... })` — auto-rollback on exception, auto-commit on success
- Supports isolation level configuration via `.setIsolationLevel('serializable')` for critical operations
- Savepoints available for partial rollback scenarios
- Transaction context (`trx`) replaces `db` for all queries within the transaction, ensuring atomicity

**Context7 Library ID**: `/kysely-org/kysely` (v0.28.3, Source Reputation: High, Benchmark: 88.9)

**Key pattern for transfers**:

```typescript
await db.transaction().execute(async (trx) => {
  // Insert dispatch movement (negative delta)
  await trx.insertInto('stockMovement').values({ ... delta: -quantity }).execute()
  // Insert receive movement (positive delta)
  await trx.insertInto('stockMovement').values({ ... delta: quantity }).execute()
})
```

### R3: Aggregate Functions in Kysely

**Decision**: Use Kysely's built-in `db.fn` module for type-safe aggregate queries.

**Rationale**:

- `db.fn.sum()`, `db.fn.count()` provide type-safe aggregation
- `COALESCE` available via `db.fn.coalesce()` for handling NULL sums (empty product/warehouse)
- `GROUP BY` and `HAVING` clauses fully supported
- Expression builder supports complex subqueries for dashboard-level aggregation

**Context7 Library ID**: `/kysely-org/kysely`

**Key pattern for stock level computation**:

```typescript
const { sum, coalesce } = db.fn;

const stockLevels = await db
  .selectFrom("stockMovement")
  .select([
    "productId",
    "productVariantId",
    "warehouseId",
    coalesce(sum("delta"), sql.lit(0)).as("currentStock"),
  ])
  .where("organizationId", "=", organizationId)
  .groupBy(["productId", "productVariantId", "warehouseId"])
  .execute();
```

### R4: Cascade Behavior on Parent Entity Deletion

**Decision**: Use FK `ON DELETE CASCADE` at the database level. When a parent entity (product, variant, warehouse) is hard-deleted, all associated stock movements are automatically removed. For soft deletes, filter at query time.

**Rationale**:

- Spec explicitly states: "Deletion of referenced entities with active stock → Cascade delete stock records and history"
- Existing project pattern uses FK ON DELETE CASCADE (e.g., `warehouse → organization`)
- For soft deletes (normal case): stock movements remain in the DB but are excluded from aggregation by joining with parent tables and checking `parent.deleted_at IS NULL`
- This preserves the full audit trail while hiding soft-deleted entity stock from the UI

**Trade-off**:

- Stock movements for soft-deleted parents are invisible in aggregate views but remain queryable for audit purposes
- If a parent is permanently hard-deleted (rare, requires approval per constitution IX), all movements cascade-delete — acceptable since the parent entity no longer exists

### R5: Stock Movement as Immutable Audit Log vs Constitution Soft Delete

**Decision**: Add `deleted_at` column to `stock_movement` for constitutional compliance, but never invoke soft-delete on individual movements at the application layer.

**Rationale**:

- Constitution IX requires ALL entities to have `deleted_at` column
- Stock movements are semantically immutable (FR-006: "immutable, chronological audit trail")
- Resolution: Include `deleted_at` in schema for compliance, but the `IStockMovementRepository` interface will NOT expose `softDelete()` or `restore()` methods
- Movements are never individually deleted — they are garbage-collected only via FK CASCADE when a parent is hard-deleted
- This is documented as a justified deviation in the Complexity Tracking section

### R6: Negative Stock Handling

**Decision**: Allow negative stock with a client-side warning before confirmation (FR-004). No database-level constraint preventing negative balances.

**Rationale**:

- Spec explicitly allows negative stock: "System MUST allow users to dispatch stock even if it results in a negative balance, but MUST display a clear warning" (FR-004)
- No CHECK constraint on running total (would require complex deferred triggers)
- Warning implemented in the presentation layer: before dispatch, query current stock → if resulting balance < 0, show confirmation dialog
- Service layer validates and records the warning acknowledgment but does not block the operation

### R7: TanStack Form for Inventory Actions

**Decision**: Use TanStack Form v1.x with existing patterns for receive/dispatch/adjustment forms.

**Rationale**:

- Project already uses TanStack Form extensively (products, warehouses)
- Existing patterns: `createServerValidate`, form options, Zod schema validation
- Inventory forms are simpler than existing forms (fewer fields: product, variant, warehouse, quantity, notes)

**Context7 Library ID**: `/tanstack/form` (v1.11.0)

### R8: Index Strategy for Stock Movement Queries

**Decision**: Composite indexes on `(organization_id, product_id, product_variant_id, warehouse_id)` for aggregation performance, plus time-based indexes for history queries.

**Rationale**:

- Primary query pattern: aggregate SUM(delta) grouped by product/variant/warehouse — needs composite index covering the GROUP BY columns
- Secondary pattern: movement history for a specific product at a specific warehouse — covered by the same composite + time ordering
- Dashboard query: all stock levels across all warehouses — needs org-level index with aggregate scan
- No need for `pg_trgm` or specialized text search indexes (movements don't have text search requirements)

**Index plan**:

```sql
-- Primary: stock aggregation per item per location
CREATE INDEX stock_movement_aggregate_idx
  ON stock_movement (organization_id, product_id, product_variant_id, warehouse_id);

-- Secondary: movement history timeline
CREATE INDEX stock_movement_timeline_idx
  ON stock_movement (organization_id, created_at DESC);

-- Tertiary: warehouse-specific queries
CREATE INDEX stock_movement_warehouse_idx
  ON stock_movement (warehouse_id, organization_id);
```

## Context7 References

| Library       | Context7 ID          | Version | Used For                                 |
| ------------- | -------------------- | ------- | ---------------------------------------- |
| Kysely        | `/kysely-org/kysely` | v0.28.3 | Transactions, aggregates, query patterns |
| TanStack Form | `/tanstack/form`     | v1.11.0 | Form management pattern reference        |

## External Research Sources

| Source               | URL                                    | Topic                                  |
| -------------------- | -------------------------------------- | -------------------------------------- |
| Dev.to               | Building Event Store in PostgreSQL     | Event sourcing vs ledger patterns      |
| Reintech             | PostgreSQL Event Sourcing              | Immutable event streams                |
| SystemDesignHandbook | Design Inventory Management System     | Multi-warehouse inventory architecture |
| StackOverflow        | Data model with stock movement support | Ledger-based inventory patterns        |
| OneUptime Blog       | PostgreSQL Audit Trails with Triggers  | Audit log schema design                |
| PostgreSQL Docs      | Materialized Views (§39.3)             | MV capabilities and limitations        |
| Stormatics           | PostgreSQL Materialized Views          | When MVs make sense vs don't           |
| Epsio Blog           | Postgres Materialized Views Guide      | MV optimization patterns               |
