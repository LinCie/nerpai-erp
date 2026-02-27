# Quickstart: Warehouse Management

**Feature Branch**: `003-warehouse-management`
**Date**: 2026-02-26
**Status**: Draft

## Prerequisites

- Node.js / Bun installed
- PostgreSQL 18.x running with the existing database
- The `001-basic-product-crud` and `002-product-variants` migrations have been applied
- Active development server: `bun run dev`

## Step-by-Step Implementation Order

### Phase 1: Database Layer

1. **Create migration**: `bun db:migrate:create create_warehouse_table`
2. **Write migration Up**:
   - Create `warehouse` table with all columns per data-model.md
   - All primary keys use `uuidv7()` default
   - Add `organization_id` FK with `ON DELETE CASCADE`
   - Add indexes: `warehouse_organization_id_idx`, `warehouse_org_deleted_at_idx`, `warehouse_name_search_idx`, `warehouse_city_idx`, `warehouse_province_idx`
   - Add partial unique index: `warehouse_code_org_unique` (`code`, `organization_id`) WHERE `deleted_at IS NULL`
   - Add CHECK constraints: `warehouse_name_not_empty`, `warehouse_code_not_empty`
   - Add `update_updated_at` trigger (reuse existing function or create with `CREATE OR REPLACE`)
3. **Write migration Down**: `DROP TABLE IF EXISTS warehouse; DROP TRIGGER IF EXISTS ...`
4. **Run migration**: `bun db:migrate`
5. **Regenerate types**: `bun db:codegen`

### Phase 2: Domain Layer

6. **Create entity type**: `src/modules/warehouses/domain/entities/warehouse.ts`
   - Define `Warehouse` interface per data-model.md
7. **Create domain types**: `src/modules/warehouses/domain/types/index.ts`
   - Export any domain-specific value types if needed

### Phase 3: Application Layer

8. **Create repository interface**: `src/modules/warehouses/application/repositories/warehouse.repository.interface.ts`
   - Define `IWarehouseRepository` with methods: `findById`, `findByCode`, `findMany`, `create`, `update`, `softDelete`, `restore`
9. **Create application types**: `src/modules/warehouses/application/types/index.ts`
   - Define DTOs: `GetWarehousesParams`, `GetWarehouseParams`, `CreateWarehouseParams`, `UpdateWarehouseParams`, `SoftDeleteWarehouseParams`, `RestoreWarehouseParams` (per data-model.md)
10. **Create service**: `src/modules/warehouses/application/services/warehouse.service.ts`
    - Business logic for CRUD operations
    - Code uniqueness validation (including soft-deleted warehouses for FR-012)
    - Empty string → null conversion for optional fields

### Phase 4: Infrastructure Layer

11. **Create repository implementation**: `src/modules/warehouses/infrastructure/repositories/warehouse.repository.ts`
    - Implement `IWarehouseRepository` using Kysely
    - All queries filtered by `organization_id` (Constitution X)
    - Soft-delete filtering (`deleted_at IS NULL`) applied by default
    - Search across name, code, city, province using `ILIKE`

### Phase 5: Presentation Layer — Schemas

12. **Create Zod schemas**: `src/modules/warehouses/presentation/schemas/warehouse.schema.ts`
    - `warehouseBaseSchema` — common fields (name, address, contact, notes)
    - `warehouseCreateSchema` — extends base with `code` field
    - `warehouseUpdateSchema` — same as base (no code)

### Phase 6: Presentation Layer — Form Options

13. **Create form options**: `src/modules/warehouses/presentation/lib/form-options.ts`
    - `createWarehouseFormOptions` — default values with `code` field, country defaults to "Indonesia"
    - `updateWarehouseFormOptions` — default values without `code` field

### Phase 7: Presentation Layer — Server Actions

14. **Create server actions**: `src/modules/warehouses/presentation/actions/warehouse.actions.ts`
    - `createWarehouse` — validates with `createServerValidate`, checks code uniqueness, calls service
    - `updateWarehouse` — validates with `createServerValidate`, ignores `code` field (FR-018), calls service
    - `softDeleteWarehouse` — validates ID, calls service, returns `{ success }` shape
    - `restoreWarehouse` — validates ID, calls service, returns `{ success }` shape
    - All actions follow contracts in `contracts/server-actions.md`

### Phase 8: Presentation Layer — Components

15. **Create warehouse form**: `src/modules/warehouses/presentation/components/warehouse-form.tsx`
    - TanStack Form with `createWarehouseFormOptions`
    - Fields grouped in fieldsets: Basic Info, Address, Contact, Notes
    - Full accessibility: `aria-required`, `aria-invalid`, `aria-describedby`
    - Loading state with `Loader2` spinner
    - `noValidate` on form element

16. **Create warehouse edit form**: `src/modules/warehouses/presentation/components/warehouse-edit-form.tsx`
    - TanStack Form with `updateWarehouseFormOptions`
    - Code field rendered as read-only (disabled input, not managed by TanStack Form)
    - Pre-populated with existing warehouse data

17. **Create add warehouse dialog**: `src/modules/warehouses/presentation/components/warehouse-add-dialog.tsx`
    - Dialog with `WarehouseForm`
    - Success closes dialog + shows toast

18. **Create edit warehouse dialog**: `src/modules/warehouses/presentation/components/warehouse-edit-dialog.tsx`
    - Dialog with `WarehouseEditForm`
    - Success closes dialog + shows toast

19. **Create warehouse list**: `src/modules/warehouses/presentation/components/warehouse-list.tsx`
    - Client component displaying warehouse table
    - Columns: Name, Code, City, Province, Actions

20. **Create warehouse list server**: `src/modules/warehouses/presentation/components/warehouse-list-server.tsx`
    - Server component that fetches data and passes to client list

21. **Create warehouse search**: `src/modules/warehouses/presentation/components/warehouse-search.tsx`
    - Search input with debounce, updates URL params

22. **Create warehouse empty state**: `src/modules/warehouses/presentation/components/warehouse-empty-state.tsx`
    - Illustrated empty state with "Create Your First Warehouse" CTA (FR-019)

23. **Create delete dialog**: `src/modules/warehouses/presentation/components/warehouse-delete-dialog.tsx`
    - Confirmation dialog before soft-delete

24. **Create trash list**: `src/modules/warehouses/presentation/components/warehouse-trash-list.tsx`
    - Shows soft-deleted warehouses with restore option

### Phase 9: App Routes

25. **Create warehouse pages**:
    - `src/app/(app)/warehouses/page.tsx` — Warehouse list page (Server Component)
    - `src/app/(app)/warehouses/loading.tsx` — Loading skeleton
    - `src/app/(app)/warehouses/[warehouseId]/page.tsx` — Warehouse detail page
    - `src/app/(app)/warehouses/[warehouseId]/loading.tsx` — Loading skeleton
    - `src/app/(app)/warehouses/trash/page.tsx` — Trash view

### Phase 10: Navigation & Polish

26. **Update sidebar navigation**: Add "Warehouses" link to the app sidebar
27. **Seed data**: Create optional seed script for Indonesian warehouse test data

## Key Reminders

- All database columns use `snake_case`, TypeScript uses `camelCase` (Constitution VIII)
- Kysely camelCase plugin handles conversion automatically
- All entities have `deleted_at` column for soft delete (Constitution IX)
- All queries scoped by `organization_id` (Constitution X)
- UUID v7 for all primary keys (Constitution VIII)
- `code` is immutable after creation (FR-018) — enforced at both UI and server action level
- Soft-deleted warehouses block code reuse (FR-012) — check includes deleted records
- Country defaults to "Indonesia" in both schema and form options
