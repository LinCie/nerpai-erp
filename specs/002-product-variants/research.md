# Research: Product Variants

**Feature Branch**: `002-product-variants`
**Date**: 2026-02-25
**Status**: Complete

## Context7 Library References

| Library       | Context7 ID               | Version   |
| ------------- | ------------------------- | --------- |
| Kysely        | `/kysely-org/kysely`      | `v0.28.3` |
| Next.js       | `/vercel/next.js`         | `v16.1.6` |
| TanStack Form | `/websites/tanstack_form` | latest    |

## Research Topics

### 1. Data Model Approach: Normalized Relational vs EAV vs JSONB

**Decision**: Normalized Relational

**Rationale**:

- The spec explicitly mandates the normalized relational approach
- PostgreSQL foreign key constraints enforce referential integrity at the database level (DIR-002)
- CHECK constraints can enforce non-negative price/stock at DB level (DIR-003, DIR-004)
- Composite unique constraints enforce SKU uniqueness per organization (DIR-001)
- Soft-delete via `deleted_at` column is straightforward per-entity (Constitution IX)
- Joins are manageable since variant count per product is bounded in practice (SC-003 targets ≤100 variants with <1s load)

**Alternatives Considered**:

- **EAV (Entity-Attribute-Value)**: Offers schema flexibility without DDL changes, but sacrifices type safety, complicates queries with excessive joins, and makes DB-level constraints nearly impossible. Rejected because the spec requires DB-enforced integrity (DIR-001 through DIR-005).
- **JSONB columns**: Could store variant configurations as JSON, reducing table count. Rejected because: (1) foreign key constraints cannot reference JSON fields, violating DIR-002; (2) CHECK constraints on nested JSON are fragile; (3) the constitution requires structured relational patterns.

**Sources**: Exa research on Stack Overflow "Modeling Product Variants" (90k views), Medium article "Database Design for Product Management", Reddit r/dotnet discussion on normalized variant schemas.

---

### 2. Database Schema: Table Design

**Decision**: Five tables following the normalized approach described in the spec's Key Entities section.

**Tables**:

1. `attribute` — Named dimension (e.g., "Color") scoped to an organization
2. `attribute_option` — Specific value for an attribute (e.g., "Red")
3. `product_attribute` — Join between product and attribute with `display_order`
4. `product_variant` — Orderable unit with SKU, price, stock, active status
5. `variant_option` — Join between variant and the specific attribute options that define it

**Rationale**:

- Matches the spec's five Key Entities exactly (Attribute, Attribute Option, Product–Attribute Association, Product Variant, Variant Configuration)
- `product_attribute` stores per-product display order (FR-017, DIR-005) — more flexible than global order
- `variant_option` is immutable after creation per spec ("Immutable after creation")
- Each table gets standard columns: `id` (UUID v7), `organization_id` (multi-tenancy), `created_at`, `updated_at`, `deleted_at` (soft delete)

**Constraint Strategy** (from Exa/PostgreSQL docs research):

- `product_variant.sku` + `organization_id` → composite UNIQUE constraint (DIR-001)
- `product_variant.price` → `CHECK (price >= 0)` (DIR-004)
- `product_variant.stock_quantity` → `CHECK (stock_quantity >= 0)` (DIR-003)
- `product_attribute.display_order` → `CHECK (display_order > 0)` + composite UNIQUE on `(product_id, display_order)` (DIR-005)
- Foreign keys with `ON DELETE CASCADE` from attribute_option → attribute, and `ON DELETE CASCADE` from product_variant → product

**Kysely Migration Patterns** (from Context7 `/kysely-org/kysely/v0.28.3`):

- Use `col.primaryKey().defaultTo(sql\`uuidv7()\`)` for UUID v7 PKs (existing pattern in codebase)
- Use `col.notNull().references('table.column').onDelete('cascade')` for FK constraints
- CHECK constraints via raw SQL: `await sql\`ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)\`.execute(db)`— Kysely schema builder does not expose`addCheckConstraint` method, so raw SQL is required
- Composite unique constraints via raw SQL: `await sql\`ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (...)\`.execute(db)`or via`db.schema.alterTable(...).addUniqueConstraint('name', ['col1', 'col2']).execute()`

---

### 3. SKU Generation Algorithm

**Decision**: Deterministic format `{PRODUCT_CODE}-{OPTION_CODE_1}-{OPTION_CODE_2}` with collision resolution via incrementing suffix.

**Rationale**:

- FR-005 specifies the exact format and collision resolution behavior
- Option order in SKU follows `display_order` from `product_attribute` (FR-017)
- Product code is derived from product name (uppercased, whitespace→hyphen, non-alphanumeric removed, truncated to reasonable length)
- Option codes are derived from option value names (similar transformation)
- Collision check: query `product_variant` WHERE `sku = candidate AND organization_id = org` → if exists, append `-2`, `-3`, etc.
- User can override via FR-006

**Implementation**:

- Pure function in application service layer (domain-independent)
- Takes product name, sorted option values (by display_order), and existing SKUs set
- Returns unique SKU string

**Sources**: Exa research — Ergonode PIM docs on SKU structure best practices, ShipBob SKU variation management guide, Symbia Logistics SKU naming conventions.

---

### 4. Variant Combination Generation (Cartesian Product)

**Decision**: Use a simple TypeScript cartesian product utility in the application service layer.

**Rationale**:

- Generating variant combinations = cartesian product of selected options across attributes
- The spec requires selective generation: users choose which combinations become active (FR-004)
- For adding new options (FR-011): compute new combinations only (diff against existing)
- No external library needed — a simple recursive/reduce implementation suffices

**Implementation**:

```typescript
function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
    [[]],
  );
}
```

- Input: `[["Red", "Blue"], ["S", "M", "L"]]`
- Output: `[["Red","S"], ["Red","M"], ["Red","L"], ["Blue","S"], ...]`
- Performance is fine: even 5 attributes × 10 options = 100,000 combinations (well beyond practical use). For the target 3×3=27, it's instant.

**Sources**: Context7 TanStack Form array examples, Exa Stack Overflow cartesian product implementations (multiple confirmed patterns).

---

### 5. Kysely Migration Patterns for CHECK and UNIQUE Constraints

**Decision**: Use raw SQL via `sql` template tag for CHECK constraints; use `addUniqueConstraint` for composite unique constraints where possible.

**Rationale**:

- Context7 Kysely v0.28.3 docs confirm the schema builder supports `.notNull()`, `.references()`, `.unique()`, `.onDelete()` on column builders
- For CHECK constraints, Kysely does not expose a typed API — confirmed by Exa research (Wanago.io article on Kysely constraints + Kysely GitHub issues)
- The existing codebase uses `sql\`CURRENT_TIMESTAMP\``and`sql\`uuidv7()\`` patterns, confirming raw SQL is idiomatic
- `addUniqueConstraint('name', ['col1', 'col2'])` is available on `alterTable` builder per Kysely GitHub issue #224

**Migration approach**:

```typescript
// CHECK constraint pattern
await sql`ALTER TABLE product_variant ADD CONSTRAINT product_variant_price_non_negative CHECK (price >= 0)`.execute(
  db,
);

// Composite UNIQUE constraint pattern
await db.schema
  .alterTable("product_variant")
  .addUniqueConstraint("product_variant_sku_organization_id_unique", [
    "sku",
    "organization_id",
  ])
  .execute();
```

---

### 6. Next.js Dynamic Routes for Product Detail / Variant Configuration

**Decision**: Add `src/app/(app)/products/[productId]/` route group with page, loading, and variant sub-pages.

**Rationale**:

- Context7 Next.js v16.1.6 confirms `params` is a `Promise<{ slug: string }>` in App Router pages
- `revalidatePath('/products/[productId]', 'page')` invalidates specific product variant pages after mutations
- Existing pattern: `src/app/(app)/products/page.tsx` for product list → extend with `[productId]/page.tsx` for detail
- Server Components are default (Constitution III); variant config page uses client components only for interactive elements (drag-drop reorder, checkbox matrix)

**Route structure**:

```
src/app/(app)/products/[productId]/
  ├── page.tsx              # Product detail with variant list (Server Component)
  ├── loading.tsx           # Loading skeleton
  └── variants/
      └── page.tsx          # Variant configuration page (attribute selection, combination matrix)
```

---

### 7. TanStack Form for Dynamic Variant Forms

**Decision**: Use TanStack Form with Zod validation for attribute/option CRUD forms. For the variant configuration matrix (checkbox-based selection), use standard React state + Server Actions rather than TanStack Form.

**Rationale**:

- Context7 TanStack Form docs show `mode="array"` for dynamic field arrays — perfect for attribute options (adding/removing option values on an attribute form)
- The variant combination matrix is better served by a simple checkbox grid (not a traditional form) — TanStack Form adds unnecessary complexity for a boolean matrix
- Existing codebase pattern: TanStack Form with formOptions + createServerValidate for standard CRUD forms (see `product.actions.ts`)
- Zod schemas validate attribute name (1-255 chars), option value name (1-255 chars), variant price (non-negative decimal), stock quantity (non-negative integer)

---

### 8. UI Components (shadcn/ui)

**Decision**: Leverage existing shadcn/ui components already installed in the project, add `table`, `checkbox`, `alert-dialog` as needed.

**Components already available** (confirmed in `src/shared/presentation/components/ui/`):

- `dialog.tsx` — for attribute/option CRUD dialogs
- `badge.tsx` — for variant status indicators (active/inactive, out of stock)
- `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx` — standard form elements
- `skeleton.tsx` — loading states
- `sonner.tsx` — toast notifications

**New components needed**:

- `@shadcn/table` — for variant list/matrix display
- `@shadcn/checkbox` — for variant combination selection matrix
- `@shadcn/alert-dialog` — for confirmation dialogs (attribute removal warning per FR-016)

**Drag-and-drop for attribute reorder** (FR-017):

- Use `@dnd-kit/core` + `@dnd-kit/sortable` — lightweight, React 19 compatible, well-documented
- Alternative considered: `react-beautiful-dnd` — deprecated, not maintained
- Alternative considered: Native HTML drag-and-drop — insufficient for accessible keyboard reordering

---

### 9. Soft Delete Strategy for Variant Entities

**Decision**: Apply `deleted_at` soft delete to `attribute`, `attribute_option`, and `product_variant`. Do NOT soft-delete `product_attribute` or `variant_option` join records.

**Rationale**:

- Constitution IX requires soft delete for all business entities
- `attribute` and `attribute_option` are reusable across products — soft delete preserves history
- `product_variant` has its own lifecycle (active/inactive per FR-010 + soft-delete for actual deletion)
- `product_attribute` (join table) represents a live configuration — removing an attribute from a product per FR-016 soft-deactivates the _variants_, not the join record itself. However, for full compliance with Constitution IX, the join record should also have `deleted_at`.
- `variant_option` is immutable and referential — removing a variant removes the variant_option entries. Since variant_option only exists to define a variant's configuration, soft-deleting the variant suffices. But for Constitution IX compliance, `variant_option` should also carry `deleted_at`.

**Final decision**: All five tables get `deleted_at` for Constitution IX compliance.

---

### 10. Organization Isolation Strategy

**Decision**: `organization_id` on `attribute`, `attribute_option` (inherited via attribute), `product_variant` (inherited via product). Repository methods require `organizationId` parameter.

**Rationale**:

- Constitution X requires `organization_id` on all business entities
- `attribute` is org-scoped directly (FR-001, FR-013)
- `attribute_option` inherits org scope via its parent `attribute` FK — but for query safety (avoiding joins for every option query), also store `organization_id` directly on `attribute_option`
- `product_variant` inherits org scope via its parent `product` FK — similarly, store `organization_id` directly for efficient queries
- `product_attribute` inherits via both `product_id` and `attribute_id` — no separate `organization_id` needed as both parents are org-scoped, but for consistency and direct filtering, add it
- `variant_option` inherits via `product_variant_id` — same reasoning, add `organization_id`

**Trade-off**: Slight denormalization (org_id repeated) vs. query efficiency and security (every query directly filters by org without joins). The constitution explicitly requires org_id on all business entities, so this is mandatory.
