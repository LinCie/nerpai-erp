# Quickstart: Basic Product CRUD

**Feature Branch**: `001-basic-product-crud`
**Date**: 2026-02-24

## Prerequisites

- PostgreSQL 18.x running and accessible via `DATABASE_URL` in `.env`
- Bun installed as the package manager
- Project dependencies installed (`bun install`)
- better-auth migration already applied (tables: `user`, `session`, `organization`, `member`, etc.)
- A user account with an active organization

## Implementation Order

Follow this sequence to build the feature layer by layer:

### Step 1: Database Migration

```bash
# Create the migration file
bun db:migrate:create create_product_table

# Edit the generated migration file at:
# src/shared/infrastructure/persistence/migrations/XXXX_create_product_table.ts

# Run the migration
bun db:migrate

# Regenerate TypeScript types
bun db:codegen
```

The migration creates the `product` table with columns: `id`, `name`, `organization_id`, `created_at`, `updated_at`, `deleted_at` and appropriate indexes.

For substring name search (`ILIKE '%query%'`) and stronger integrity:
- Enable `pg_trgm` via idempotent migration SQL (`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
- Add a trimmed non-empty name constraint (e.g., `CHECK (char_length(btrim(name)) > 0)`)
- Add a trigram index for search (`USING gin (name gin_trgm_ops)`)

### Step 2: Domain Layer

Create the product entity type definition:

```
src/modules/products/domain/entities/product.ts
src/modules/products/domain/types/index.ts
```

These are pure TypeScript types with zero external dependencies.

### Step 3: Application Layer

Create the repository interface and service:

```
src/modules/products/application/repositories/product.repository.interface.ts
src/modules/products/application/types/index.ts
src/modules/products/application/services/product.service.ts
```

The service contains all business logic. The repository interface defines the contract that the infrastructure layer must implement.

### Step 4: Infrastructure Layer

Create the Kysely repository implementation:

```
src/modules/products/infrastructure/repositories/product.repository.ts
```

This implements `IProductRepository` using Kysely queries against the `product` table.

### Step 5: Presentation Layer

Create validation schemas, Server Actions, and React components:

```
src/modules/products/presentation/schemas/product.schema.ts
src/modules/products/presentation/actions/product.actions.ts
src/modules/products/presentation/components/product-list.tsx
src/modules/products/presentation/components/product-form.tsx
src/modules/products/presentation/components/product-delete-dialog.tsx
src/modules/products/presentation/components/product-empty-state.tsx
src/modules/products/presentation/components/product-trash-list.tsx
src/modules/products/presentation/types/index.ts
```

### Step 6: Route Pages

Update the existing products page and add the trash page:

```
src/app/(app)/products/page.tsx        # Replace placeholder with real product list
src/app/(app)/products/trash/page.tsx   # New: Trash view
src/app/(app)/products/loading.tsx      # New: Loading skeleton
```

## Verification

After implementation, verify by:

1. **Build check**: `bun run build` — TypeScript compilation passes with no errors
2. **Lint check**: `bun run lint` — ESLint passes with no warnings
3. **Contract check**: Server Actions return explicit recoverable errors (`validation`, `not found`) per `contracts/server-actions.md`
4. **Performance evidence**: Capture query plan/benchmark for product search if claiming sub-second response at target scale
5. **Manual smoke test**:
   - Navigate to Products page → empty state shown
   - Click "Add Product" → form appears
   - Enter a name and submit → product appears in list
   - Click edit → change name → save → name updated
   - Click delete → confirm → product removed from list
   - Navigate to Trash → deleted product visible
   - Click restore → product returns to active list
   - Use search bar to filter products by name

## Key Files Reference

| File                                                       | Purpose                                                |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `specs/001-basic-product-crud/data-model.md`               | Entity schema and relationships                        |
| `specs/001-basic-product-crud/contracts/server-actions.md` | Server Actions interface contracts                     |
| `specs/001-basic-product-crud/research.md`                 | Technology decisions and Context7 references           |
| `src/shared/infrastructure/persistence/index.ts`           | Kysely database instance (import `db` from here)       |
| `src/shared/infrastructure/auth/auth.ts`                   | better-auth instance (import `auth` from here)         |
| `.specify/memory/constitution.md`                          | Project constitution (all rules that must be followed) |
