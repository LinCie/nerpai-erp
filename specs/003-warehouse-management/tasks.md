# Tasks: Warehouse Management

**Feature Branch**: `003-warehouse-management`
**Input**: Design documents from `/specs/003-warehouse-management/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/server-actions.md, research.md, quickstart.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and module structure

- [x] T001 Create warehouse module directory structure at `src/modules/warehouses/`
- [x] T002 [P] Create domain layer directories: `src/modules/warehouses/domain/entities/` and `src/modules/warehouses/domain/types/`
- [x] T003 [P] Create application layer directories: `src/modules/warehouses/application/repositories/`, `src/modules/warehouses/application/services/`, `src/modules/warehouses/application/types/`
- [x] T004 [P] Create infrastructure layer directory: `src/modules/warehouses/infrastructure/repositories/`
- [x] T005 [P] Create presentation layer directories: `src/modules/warehouses/presentation/actions/`, `src/modules/warehouses/presentation/schemas/`, `src/modules/warehouses/presentation/components/`, `src/modules/warehouses/presentation/lib/`, `src/modules/warehouses/presentation/types/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Layer

- [x] T006 Create migration `create_warehouse_table` using `bun db:migrate:create create_warehouse_table`
- [x] T007 [P] Write migration Up in `src/shared/infrastructure/persistence/migrations/XXXX_create_warehouse_table.ts`:
  - Create `warehouse` table with all 15 columns per data-model.md
  - Add `organization_id` FK with `ON DELETE CASCADE`
  - Add indexes: `warehouse_organization_id_idx`, `warehouse_org_deleted_at_idx`, `warehouse_name_search_idx`, `warehouse_city_idx`, `warehouse_province_idx`
  - Add unique index across all records: `warehouse_org_code_unique` on normalized (`organization_id`, `lower(btrim(code))`) to block code reuse even when soft-deleted (FR-012)
  - Add CHECK constraints: `warehouse_name_not_empty`, `warehouse_code_not_empty`
- [x] T008 Write migration Down: `DROP TABLE IF EXISTS warehouse`
- [x] T009 Run migration: `bun db:migrate`
- [x] T010 Regenerate database types: `bun db:codegen`

### Domain Layer

- [x] T011 [P] Create `Warehouse` entity interface in `src/modules/warehouses/domain/entities/warehouse.ts` with all fields per data-model.md
- [x] T012 [P] Create domain types in `src/modules/warehouses/domain/types/index.ts`

### Application Layer

- [x] T013 [P] Create repository interface `IWarehouseRepository` in `src/modules/warehouses/application/repositories/warehouse.repository.interface.ts` with methods: `findById`, `findByCode`, `findMany`, `create`, `update`, `softDelete`, `restore`
- [x] T014 [P] Create application DTOs in `src/modules/warehouses/application/types/index.ts`: `GetWarehousesParams`, `GetWarehouseParams`, `CreateWarehouseParams`, `UpdateWarehouseParams`, `SoftDeleteWarehouseParams`, `RestoreWarehouseParams`
- [x] T015 Implement `WarehouseService` in `src/modules/warehouses/application/services/warehouse.service.ts` with business logic for CRUD operations, code uniqueness validation (including soft-deleted warehouses for FR-012), empty string to null conversion

### Infrastructure Layer

- [x] T016 Implement `WarehouseRepository` in `src/modules/warehouses/infrastructure/repositories/warehouse.repository.ts`:
  - Implement all `IWarehouseRepository` methods using Kysely
  - Filter all queries by `organization_id` (Constitution X)
  - Apply soft-delete filtering (`deleted_at IS NULL`) by default
  - Implement search across name, code, city, province using `ILIKE`

### Presentation Layer - Schemas & Form Options

- [x] T017 [P] Create Zod schemas in `src/modules/warehouses/presentation/schemas/warehouse.schema.ts`:
  - `warehouseBaseSchema` — common fields (name, address, contact, notes)
  - `warehouseCreateSchema` — extends base with `code` field (alphanumeric/hyphen/underscore only)
  - `warehouseUpdateSchema` — same as base (no code field)
- [x] T017A Define postal code validation rules in `src/modules/warehouses/presentation/schemas/warehouse.schema.ts` (DIR-004):
  - Country = Indonesia (default): postal code must be exactly 5 digits when provided
  - Country != Indonesia: postal code allows 1-20 alphanumeric characters, spaces, and hyphens
- [x] T017B Define country field normalization + validation in `src/modules/warehouses/presentation/schemas/warehouse.schema.ts` (DIR-004):
  - Trim and normalize input before validation/storage
  - Enforce non-empty when provided and max length constraint aligned with schema
- [x] T018 Create form options in `src/modules/warehouses/presentation/lib/form-options.ts`:
  - `createWarehouseFormOptions` — default values with code field, country defaults to "Indonesia"
  - `updateWarehouseFormOptions` — default values without code field

**Checkpoint**: Foundation ready - database schema, repository layer, and shared form options complete. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Create Warehouse (Priority: P1) 🎯 MVP

**Goal**: Enable organization users to create warehouses with name, unique code, and complete address information

**Independent Test**: Navigate to warehouse management page, click "New Warehouse", fill in name "Gudang Utama", code "WH-KDR-001", address details (street, city "Kediri", postal code), and save. The warehouse appears in the list with all provided information.

### Implementation for User Story 1

- [x] T019 Create `createWarehouse` Server Action in `src/modules/warehouses/presentation/actions/warehouse.actions.ts`:
  - Validate with `createServerValidate` using `createWarehouseFormOptions`
  - Validate authenticated user has active organization before operation; redirect to organization selection when missing, return typed `FORBIDDEN` only for unauthorized access
  - Check code uniqueness (including soft-deleted warehouses per FR-012)
  - Normalize all text inputs (trim) before validation/storage; convert empty strings to null for optional fields
  - Call `warehouseService.create()`
  - Return typed outcomes: success, validation, not-found, forbidden (+ redirect for no active organization)
  - Revalidate `/warehouses` path on success
- [x] T020 Create `warehouse-form.tsx` component in `src/modules/warehouses/presentation/components/warehouse-form.tsx`:
  - TanStack Form with `createWarehouseFormOptions`
  - Fields grouped in 4 fieldsets: Basic Info (name, code), Address (streetAddress, city, province, postalCode, country), Contact (contactName, contactPhone, contactEmail), Notes (notes)
  - Add immediate duplicate-code feedback on code input with 300ms debounce and on-blur fallback to satisfy SC-005
  - Full accessibility: `aria-required`, `aria-invalid`, `aria-describedby` on all inputs
  - Character counter for notes field (max 1000)
  - `noValidate` on form element
  - Loading state with spinner during submission
- [x] T021 Create `warehouse-add-dialog.tsx` component in `src/modules/warehouses/presentation/components/warehouse-add-dialog.tsx`:
  - Dialog wrapper using shadcn `Dialog` component
  - Contains `WarehouseForm` component
  - Success closes dialog and shows toast notification
  - Error displays in form with `role="alert"`

**Checkpoint**: User Story 1 complete - can create warehouses with validation and error handling

---

## Phase 4: User Story 2 - List and Search Warehouses (Priority: P1)

**Goal**: Enable users to view all warehouses in their organization and search/filter them

**Independent Test**: Open warehouse list page and verify all warehouses for the current organization are displayed with names, codes, and cities. Type "Surabaya" in search box and verify only Surabaya warehouses appear. Verify illustrated empty state displays when no warehouses exist.

### Implementation for User Story 2

- [x] T022 [P] Create `warehouse-list.tsx` component in `src/modules/warehouses/presentation/components/warehouse-list.tsx`:
  - Client component displaying warehouse data table
  - Columns: Name, Code, City, Province, Actions (Edit, Delete)
  - Responsive design with horizontal scroll on mobile
  - Empty state handling (delegates to `WarehouseEmptyState`)
- [x] T023 [P] Create `warehouse-list-server.tsx` component in `src/modules/warehouses/presentation/components/warehouse-list-server.tsx`:
  - Server component that fetches warehouse data
  - Validate authenticated user has active organization membership before query; handle forbidden path
  - Calls `warehouseService.findMany()` with organization filter
  - Passes data to client `WarehouseList` component
- [x] T024 Create `warehouse-search.tsx` component in `src/modules/warehouses/presentation/components/warehouse-search.tsx`:
  - Search input with debounce (300ms)
  - Syncs with URL query params (`?search=...`)
  - Search across name, code, city, province using `ILIKE`
- [x] T024A Add province filter support:
  - Add province select/filter UI and URL param (`?province=...`)
  - Combine with text search in repository query
  - Preserve filter state across navigation and reload
- [x] T025 Create `warehouse-empty-state.tsx` component in `src/modules/warehouses/presentation/components/warehouse-empty-state.tsx`:
  - Illustrated empty state with icon/illustration
  - Message: "No warehouses yet"
  - Prominent "Create Your First Warehouse" CTA button
  - Navigates to create form on click (FR-019)
- [x] T026 Create warehouse list page in `src/app/(app)/warehouses/page.tsx`:
  - Server Component
  - Combines `WarehouseSearch`, `WarehouseListServer`, and `WarehouseAddDialog`
  - Reads search params and passes to list server component
- [x] T026A Add pagination support on list page:
  - Support `page` and `limit` query params with sane defaults
  - Render pagination controls and total count metadata
  - Ensure pagination works with search and province filters
- [x] T027 [P] Create loading skeleton in `src/app/(app)/warehouses/loading.tsx`:
  - shadcn `Skeleton` components for table rows
  - 5 skeleton rows matching table structure

**Checkpoint**: User Story 2 complete - can list, search, and view warehouses with empty state

---

## Phase 5: User Story 3 - Update Warehouse Details (Priority: P2)

**Goal**: Enable users to edit warehouse information including name, address, and contact details

**Independent Test**: Open an existing warehouse, click edit, change the street address and contact phone, save, and verify changes persist. Verify code field is displayed as read-only/disabled.

### Implementation for User Story 3

- [x] T028 Create `updateWarehouse` Server Action in `src/modules/warehouses/presentation/actions/warehouse.actions.ts`:
  - Validate with `createServerValidate` using `updateWarehouseFormOptions`
  - Validate authenticated user has active organization before operation; redirect to organization selection when missing, return typed `FORBIDDEN` only for unauthorized access
  - Ignore any `code` value in FormData (FR-018 - immutable)
  - Normalize all text inputs (trim) before validation/storage; convert empty strings to null for optional fields
  - Call `warehouseService.update()`
  - Return typed outcomes: success, validation, not-found, forbidden (+ redirect for no active organization)
  - Revalidate `/warehouses` path on success
- [x] T029 Create `warehouse-edit-form.tsx` component in `src/modules/warehouses/presentation/components/warehouse-edit-form.tsx`:
  - TanStack Form with `updateWarehouseFormOptions`
  - Same 4 fieldsets as create form: Basic Info, Address, Contact, Notes
  - **Code field**: Rendered as read-only/disabled `<Input>` NOT managed by TanStack Form
  - Pre-populated with existing warehouse data via props
  - Full accessibility: `aria-required`, `aria-invalid`, `aria-describedby`
- [x] T030 Create `warehouse-edit-dialog.tsx` component in `src/modules/warehouses/presentation/components/warehouse-edit-dialog.tsx`:
  - Dialog wrapper using shadcn `Dialog` component
  - Contains `WarehouseEditForm` component
  - Passes warehouse data to form
  - Success closes dialog and shows toast
  - Error displays in form

**Checkpoint**: User Story 3 complete - can edit warehouse details with immutable code field

---

## Phase 6: User Story 4 - Soft-Delete and Restore Warehouse (Priority: P2)

**Goal**: Enable users to mark warehouses as inactive (soft-delete) and restore them later

**Independent Test**: Soft-delete a warehouse, verify it no longer appears in active list, check trash view shows the warehouse with restore option, restore it and verify it reappears in active list. Attempt to create new warehouse with same code as soft-deleted warehouse and verify it fails with duplicate code error.

### Implementation for User Story 4

- [x] T031 Create `softDeleteWarehouse` Server Action in `src/modules/warehouses/presentation/actions/warehouse.actions.ts`:
  - Non-form action accepting `id` via FormData hidden field
  - Validate authenticated user has active organization before operation; redirect to organization selection when missing, return typed `FORBIDDEN` only for unauthorized access
  - Call `warehouseService.softDelete()`
  - Return typed outcomes: success, validation, not-found, forbidden (+ redirect for no active organization)
  - Revalidate `/warehouses` path on success
- [x] T032 Create `restoreWarehouse` Server Action in `src/modules/warehouses/presentation/actions/warehouse.actions.ts`:
  - Non-form action accepting `id` via FormData hidden field
  - Validate authenticated user has active organization before operation; redirect to organization selection when missing, return typed `FORBIDDEN` only for unauthorized access
  - Call `warehouseService.restore()`
  - Return typed outcomes: success, validation, not-found, forbidden (+ redirect for no active organization)
  - Revalidate `/warehouses` path on success
- [x] T033 Create `warehouse-delete-dialog.tsx` component in `src/modules/warehouses/presentation/components/warehouse-delete-dialog.tsx`:
  - Confirmation dialog using shadcn `AlertDialog`
  - Warning message about soft-delete (data preserved)
  - Cancel and Confirm buttons
  - Calls `softDeleteWarehouse` action on confirm
- [x] T034 Create `warehouse-trash-list.tsx` component in `src/modules/warehouses/presentation/components/warehouse-trash-list.tsx`:
  - Displays soft-deleted warehouses
  - Shows deletion date
  - Restore action for each warehouse
  - No permanent delete option in this feature (Constitution IX soft-delete enforcement)
- [x] T035 Create trash page in `src/app/(app)/warehouses/trash/page.tsx`:
  - Server Component
  - Validate authenticated user has active organization before query; redirect to organization selection when missing, handle forbidden path only for unauthorized access
  - Fetches soft-deleted warehouses via `warehouseService.findMany({ includeDeleted: true })`
  - Renders `WarehouseTrashList` component
- [x] T036 [P] Create loading skeleton in `src/app/(app)/warehouses/trash/loading.tsx`

**Checkpoint**: User Story 4 complete - can soft-delete and restore warehouses

---

## Phase 7: User Story 5 - Warehouse Detail View (Priority: P2)

**Goal**: Enable users to view complete details of a specific warehouse

**Independent Test**: Click on a warehouse from the list and verify all stored information is displayed. Click edit and verify navigation to edit form. Click delete and verify confirmation dialog.

### Implementation for User Story 5

- [x] T037 Create warehouse detail page in `src/app/(app)/warehouses/[warehouseId]/page.tsx`:
  - Dynamic route with `warehouseId` parameter
  - Server Component fetching warehouse by ID
  - Display all fields: name, code, full address, contact info, notes
  - Add inventory summary placeholder card (future integration): distinct SKUs and total quantity shown as "Not available yet"
  - Metadata: created_at, updated_at
  - Edit button → opens edit dialog or navigates to edit page
  - Delete button → opens delete confirmation dialog
- [x] T038 [P] Create loading skeleton in `src/app/(app)/warehouses/[warehouseId]/loading.tsx`:
  - shadcn `Skeleton` for header, address card, contact card, notes section
- [x] T039 Update `warehouse-list.tsx` to link rows to detail page:
  - Click on warehouse name → navigate to `/warehouses/[warehouseId]`
  - Maintain edit/delete actions in row

**Checkpoint**: User Story 5 complete - can view warehouse details with edit/delete access

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Navigation & Integration

- [ ] T040 [P] Add "Warehouses" link to sidebar navigation in existing sidebar component
- [ ] T041 [P] Create seed script for Indonesian warehouse test data (Kediri, Surabaya, Jakarta) in `src/shared/infrastructure/persistence/seeds/warehouse_seed.sql`

### Validation & Documentation

- [ ] T042 Verify all Server Actions match contracts in `contracts/server-actions.md`:
  - Typed success/error shapes for createWarehouse (`validation`, `not-found`, `forbidden`) + redirect behavior for no active organization
  - Typed success/error shapes for updateWarehouse (`validation`, `not-found`, `forbidden`) + redirect behavior for no active organization
  - Typed success/error shapes for softDeleteWarehouse (`validation`, `not-found`, `forbidden`) + redirect behavior for no active organization
  - Typed success/error shapes for restoreWarehouse (`validation`, `not-found`, `forbidden`) + redirect behavior for no active organization
- [ ] T043 Run quickstart.md validation steps and verify all phases complete successfully
- [ ] T044 Run `bun test` and `bun run lint` to verify code quality
- [ ] T045 Verify ILIKE search performance is acceptable for ≤100 warehouses (Constitution VIII compliance documentation)
- [ ] T046 Validate SC-001 with a timed create-flow runbook and recorded execution evidence (<60s target)
- [ ] T047 Validate SC-002 with list-load timing evidence for 100 warehouses (<1s target)
- [ ] T048 Add Unicode address test coverage (create/read/search) to validate SC-007
- [ ] T048A Add postal code and country validation test coverage (create/update) to satisfy DIR-004

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - T006-T010 (Database) must complete before T011-T018 (Code)
  - T011-T018 can run in parallel after database migration
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5)
  - US1 (Create) and US2 (List) are both P1 and can be developed in parallel
  - US3, US4, US5 are P2 and can be developed in parallel after P1 stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (Create - P1)**: No dependencies on other stories - can start immediately after Foundational
- **User Story 2 (List/Search - P1)**: No dependencies on other stories - can start immediately after Foundational
  - US2 can be tested independently without US1 by seeding test data
- **User Story 3 (Update - P2)**: Depends on having warehouses to edit (US1 or seed data)
- **User Story 4 (Soft-Delete/Restore - P2)**: Depends on having warehouses to delete (US1 or seed data)
- **User Story 5 (Detail View - P2)**: Depends on having warehouses to view (US1 or seed data)

### Within Each User Story

- Domain/Presentation prep first (no dependencies)
- Server Actions before Components (components depend on actions)
- Dialog wrappers depend on Form components
- Page components integrate everything

### Parallel Opportunities

- All Setup tasks (T001-T005) can run in parallel
- All Foundational tasks (T011-T018) can run in parallel after database migration
- User Story 1 and User Story 2 can be developed in parallel (T019-T021 and T022-T027)
- User Stories 3, 4, 5 can be developed in parallel once P1 stories complete
- Within each story, Schema/Form Options, Actions, and Components marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Create Warehouse)

```bash
# Domain/Application prep (after Foundational complete):
Task: "T019 Create createWarehouse Server Action in warehouse.actions.ts"

# Presentation layer components in parallel:
Task: "T020 Create warehouse-form.tsx component with 4 fieldsets"
Task: "T021 Create warehouse-add-dialog.tsx dialog wrapper"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T018) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 - Create Warehouse (T019-T021)
4. Complete Phase 4: User Story 2 - List and Search Warehouses (T022-T027)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
   - Create a warehouse
   - See it in the list
   - Search for it
   - Verify empty state when no warehouses
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Stories 1 & 2 (P1) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 (Update) → Test independently → Deploy/Demo
4. Add User Story 4 (Soft-Delete/Restore) → Test independently → Deploy/Demo
5. Add User Story 5 (Detail View) → Test independently → Deploy/Demo
6. Complete Phase 8: Polish → Final validation
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Create)
   - Developer B: User Story 2 (List/Search)
   - Developers can work independently due to vertical slice isolation
3. Once P1 stories complete:
   - Developer A: User Story 3 (Update)
   - Developer B: User Story 4 (Soft-Delete/Restore)
   - Developer C: User Story 5 (Detail View)
4. Stories complete and integrate independently

---

## Summary

| Phase   | User Story               | Tasks                     | Priority | Parallelizable  |
| ------- | ------------------------ | ------------------------- | -------- | --------------- |
| Phase 1 | Setup                    | T001-T005                 | -        | Yes             |
| Phase 2 | Foundational             | T006-T018 + T017A + T017B | -        | After T010      |
| Phase 3 | US1: Create Warehouse    | T019-T021                 | P1       | No (sequential) |
| Phase 4 | US2: List/Search         | T022-T027 + T024A + T026A | P1       | Partial         |
| Phase 5 | US3: Update              | T028-T030                 | P2       | Partial         |
| Phase 6 | US4: Soft-Delete/Restore | T031-T036                 | P2       | Partial         |
| Phase 7 | US5: Detail View         | T037-T039                 | P2       | Partial         |
| Phase 8 | Polish                   | T040-T048 + T048A         | -        | Yes             |

**Total Tasks**: 53
**MVP Scope**: T001-T027 + T024A + T026A (User Stories 1 & 2) = 29 tasks
**Full Feature**: All 53 tasks

**Key Constraints**:

- Code field is immutable after creation (FR-018)
- Soft-deleted warehouses block code reuse (FR-012)
- All queries scoped by organization_id (Constitution X)
- All entities use soft delete with deleted_at (Constitution IX)
- UUID v7 for all primary keys (Constitution VIII)
- TanStack Form with shared formOptions for client/server validation
