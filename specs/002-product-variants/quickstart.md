# Quickstart: Product Variants

**Feature Branch**: `002-product-variants`
**Date**: 2026-02-25

## Prerequisites

- PostgreSQL 18.x running and accessible via `DATABASE_URL` in `.env`
- Bun installed as the package manager
- Project dependencies installed (`bun install`)
- Feature 001 (Basic Product CRUD) fully implemented — `product` table exists
- better-auth migration applied (tables: `user`, `session`, `organization`, `member`, etc.)
- A user account with an active organization and at least one product

## New Dependencies

```bash
# Drag-and-drop for attribute reorder (FR-017)
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# shadcn components (if not already installed)
bunx --bun shadcn@latest add table checkbox alert-dialog
```

## Implementation Order

Follow this sequence to build the feature layer by layer:

### Step 1: Database Migrations

Create four migration files (one per new table) plus one for the `@dnd-kit` dependency:

```bash
# Create migration files
bun db:migrate:create create_attribute_table
bun db:migrate:create create_attribute_option_table
bun db:migrate:create create_product_attribute_table
bun db:migrate:create create_product_variant_and_variant_option_tables

# Edit each migration file at:
# src/shared/infrastructure/persistence/migrations/XXXX_create_*.ts
# Reference: specs/002-product-variants/data-model.md (Migration SQL section)

# Run all migrations
bun db:migrate

# Regenerate TypeScript types
bun db:codegen
```

Tables created:

- `attribute` — Named variant dimensions (Color, Size, etc.)
- `attribute_option` — Values for each attribute (Red, Blue, Small, Large)
- `product_attribute` — Product-to-attribute join with display_order
- `product_variant` — Orderable units with SKU, price, stock, status
- `variant_option` — Variant-to-attribute-option configuration entries

Includes CHECK constraints (price ≥ 0, stock_quantity ≥ 0, display_order > 0), composite UNIQUE constraints (SKU per org, one option per attribute per variant), and RESTRICT FK on `variant_option.attribute_option_id`.

### Step 2: Domain Layer

Create entity type definitions for all new entities:

```
src/modules/products/domain/entities/attribute.ts
src/modules/products/domain/entities/attribute-option.ts
src/modules/products/domain/entities/product-attribute.ts
src/modules/products/domain/entities/product-variant.ts
src/modules/products/domain/entities/variant-option.ts
```

Also add domain utility types:

```
src/modules/products/domain/types/index.ts  # Extend with variant-related types
```

These are pure TypeScript types with zero external dependencies.

### Step 3: Application Layer

Create repository interfaces, services, and DTOs:

```
src/modules/products/application/repositories/attribute.repository.interface.ts
src/modules/products/application/repositories/variant.repository.interface.ts
src/modules/products/application/services/attribute.service.ts
src/modules/products/application/services/variant.service.ts
src/modules/products/application/types/index.ts  # Extend with new param/return types
```

Key application logic:

- **SKU generation** — deterministic format `{PRODUCT_CODE}-{OPTION_1}-{OPTION_2}` with collision suffix
- **Cartesian product** — generate variant combinations from selected option sets
- **Attribute removal gated confirmation** — count affected variants before deactivation
- **Option deletion guard** — check variant_option references before allowing deletion (FR-014)

### Step 4: Infrastructure Layer

Create Kysely repository implementations:

```
src/modules/products/infrastructure/repositories/attribute.repository.ts
src/modules/products/infrastructure/repositories/variant.repository.ts
```

These implement their respective interfaces using Kysely queries. Key patterns:

- All queries filter by `organization_id` (Constitution X)
- All read queries filter `deleted_at IS NULL` by default (Constitution IX)
- Variant generation uses Kysely transactions for atomicity
- SKU collision check uses `SELECT EXISTS` before insert

### Step 5: Presentation Layer — Schemas & Actions

Create Zod validation schemas:

```
src/modules/products/presentation/schemas/attribute.schema.ts
src/modules/products/presentation/schemas/variant.schema.ts
```

Create Server Actions:

```
src/modules/products/presentation/actions/attribute.actions.ts
src/modules/products/presentation/actions/variant.actions.ts
```

Reference: `specs/002-product-variants/contracts/server-actions.md`

### Step 6: Presentation Layer — Components

Create React components for attribute management:

```
src/modules/products/presentation/components/attribute-list.tsx
src/modules/products/presentation/components/attribute-add-dialog.tsx
src/modules/products/presentation/components/attribute-edit-dialog.tsx
src/modules/products/presentation/components/attribute-option-list.tsx
src/modules/products/presentation/components/attribute-option-form.tsx
```

Create React components for variant configuration:

```
src/modules/products/presentation/components/product-attribute-config.tsx    # Attribute selection + drag-drop reorder
src/modules/products/presentation/components/variant-combination-matrix.tsx  # Checkbox grid for selecting combinations
src/modules/products/presentation/components/variant-list.tsx                # Table of generated variants
src/modules/products/presentation/components/variant-edit-row.tsx            # Inline editing of SKU/price/stock
src/modules/products/presentation/components/variant-empty-state.tsx         # Empty state for products with no variants
```

### Step 7: Route Pages

Add product detail page and variant configuration sub-pages:

```
src/app/(app)/products/[productId]/page.tsx            # Product detail with variant list
src/app/(app)/products/[productId]/loading.tsx          # Loading skeleton
src/app/(app)/products/[productId]/variants/page.tsx    # Variant configuration page
src/app/(app)/products/[productId]/variants/loading.tsx # Loading skeleton
src/app/(app)/products/attributes/page.tsx              # Attribute management page
src/app/(app)/products/attributes/loading.tsx           # Loading skeleton
```

Update existing:

```
src/app/(app)/products/page.tsx  # Add link to product detail (click product row → /products/[id])
```

## Verification

After implementation, verify by:

1. **Build check**: `bun run build` — TypeScript compilation passes with no errors
2. **Lint check**: `bun run lint` — ESLint passes with no warnings
3. **Contract check**: Server Actions return explicit recoverable errors per `contracts/server-actions.md`
4. **DB constraint check**: Verify CHECK and UNIQUE constraints with negative test data
5. **Manual smoke test**:
   - Navigate to Attributes page → create "Color" with options "Red", "Blue", "Green"
   - Create "Size" with options "S", "M", "L"
   - Open a product → assign Color and Size attributes
   - Drag to reorder attributes → verify order persists
   - Select option combinations → generate variants
   - Verify 6 variants appear (Red-S, Red-M, Red-L, Blue-S, Blue-M, Blue-L)
   - Edit a variant's price, stock, and SKU → verify persistence
   - Toggle a variant inactive → verify visual differentiation
   - Try to delete an option used by variants → verify block message (FR-014)
   - Remove an attribute → verify confirmation dialog with variant count (FR-016)
   - Add "Yellow" to Color → verify only new combinations generated (FR-011)
   - Verify SKU auto-generation and collision resolution

## Key Files Reference

| File                                                     | Purpose                                          |
| -------------------------------------------------------- | ------------------------------------------------ |
| `specs/002-product-variants/data-model.md`               | Entity schema, relationships, constraints        |
| `specs/002-product-variants/contracts/server-actions.md` | Server Actions interface contracts               |
| `specs/002-product-variants/research.md`                 | Technology decisions and Context7 references     |
| `src/shared/infrastructure/persistence/index.ts`         | Kysely database instance (import `db` from here) |
| `src/shared/infrastructure/auth/auth.ts`                 | better-auth instance (import `auth` from here)   |
| `.specify/memory/constitution.md`                        | Project constitution (all rules)                 |
