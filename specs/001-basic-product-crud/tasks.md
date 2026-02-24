# Tasks: Basic Product CRUD

**Feature**: Basic Product CRUD  
**Branch**: `001-basic-product-crud`  
**Input**: Design documents from `/specs/001-basic-product-crud/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/server-actions.md, research.md  
**Tests**: Not requested - implementation tasks only

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and existing structure verification

- [X] T001 Verify existing project structure per plan.md at `src/modules/products/`
- [X] T002 [P] Verify Kysely CamelCasePlugin configuration in `src/shared/infrastructure/persistence/index.ts`
- [X] T003 [P] Verify better-auth organization plugin and session handling in `src/lib/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Infrastructure

- [X] T004 Create database migration for product table using `bun db:migrate:create create_product_table`
  - Location: `src/shared/infrastructure/persistence/migrations/1771947520603_create_product_table.ts`
  - Include: `id UUID PRIMARY KEY DEFAULT uuidv7()`, `name VARCHAR(255) NOT NULL`, `organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ`
  - Include indexes: `product_organization_id_idx`, `product_organization_id_deleted_at_idx`
- [X] T005 Run migration using `bun db:migrate`
- [X] T006 Regenerate database types using `bun db:codegen`

### Domain Layer (Shared Across All Stories)

- [X] T007 [P] Create Product entity type in `src/modules/products/domain/entities/product.ts`
- [X] T008 [P] Create domain types index in `src/modules/products/domain/types/index.ts`

### Application Layer (Shared Interfaces)

- [X] T009 Create repository interface in `src/modules/products/application/repositories/product.repository.interface.ts`
  - Methods: `getMany()`, `getById()`, `create()`, `update()`, `softDelete()`, `restore()`
- [X] T010 [P] Create application DTOs in `src/modules/products/application/types/index.ts`
  - Interfaces: `GetProductsParams`, `CreateProductParams`, `UpdateProductParams`, `SoftDeleteProductParams`, `RestoreProductParams`

### Infrastructure Layer

- [X] T011 Implement ProductRepository in `src/modules/products/infrastructure/repositories/product.repository.ts`
  - Depends on: T009 (interface), T007 (entity)
  - Implements all repository interface methods with Kysely queries
  - Includes soft delete filtering (`deletedAt IS NULL` by default)
  - Includes organization scoping on all queries

### Presentation Layer - Shared

- [X] T012 Create Zod validation schema in `src/modules/products/presentation/schemas/product.schema.ts`
  - Validation: name required, min 1 char, max 255 chars, trimmed
  - Use Zod 4 syntax with `{ error: "..." }` parameter
- [X] T013 Create presentation types in `src/modules/products/presentation/types/index.ts`

**Checkpoint**: Foundation ready - database schema, repository, and shared types complete

---

## Phase 3: User Story 1 - Create Product (Priority: P1) 🎯 MVP

**Goal**: Allow users to create a new product with a name field

**Independent Test**: Navigate to `/products`, click "Add Product", enter a valid name, save. Product appears in list.

### Implementation

- [ ] T014 [P] Create product service method in `src/modules/products/application/services/product.service.ts`
  - Method: `createProduct()`
  - Depends on: T011 (repository)
- [ ] T015 [P] Implement `createProduct` Server Action in `src/modules/products/presentation/actions/product.actions.ts`
  - Validates session and organization
  - Validates input with Zod schema (T012)
  - Calls service method (T014)
  - Revalidates `/products` path
- [ ] T016 Create `ProductForm` component in `src/modules/products/presentation/components/product-form.tsx`
  - Uses TanStack Form v1 with `@tanstack/react-form-nextjs`
  - Client-side validation with Zod
  - Submits to `createProduct` Server Action (T015)
  - Shows validation errors and success states
- [ ] T017 Create `AddProductDialog` component in `src/modules/products/presentation/components/product-add-dialog.tsx`
  - Uses Radix UI Dialog
  - Contains ProductForm component (T016)
  - Triggered from product list page

**Checkpoint**: User Story 1 complete - can create products

---

## Phase 4: User Story 2 - View Products List (Priority: P1)

**Goal**: Display a searchable list of all products in the organization

**Independent Test**: Navigate to `/products` and see a table listing all products with names. Can search/filter by name.

### Implementation

- [ ] T018 [P] Extend product service with `getProducts()` method in `src/modules/products/application/services/product.service.ts`
  - Supports optional search parameter
  - Filters by organization and excludes deleted products
  - Depends on: T011 (repository)
- [ ] T019 [P] Create `ProductList` component in `src/modules/products/presentation/components/product-list.tsx`
  - Displays products in a table format
  - Shows product name and action buttons (edit, delete)
  - Uses TanStack Table or simple HTML table
- [ ] T020 Create `ProductEmptyState` component in `src/modules/products/presentation/components/product-empty-state.tsx`
  - Shows when no products exist
  - Includes CTA to add first product
- [ ] T021 Create search/filter component in `src/modules/products/presentation/components/product-search.tsx`
  - Input field for name search
  - Client-side or server-side filtering (server-side preferred for scale)
- [ ] T022 Create products page in `src/app/(app)/products/page.tsx`
  - Server Component
  - Fetches products using service (T018)
  - Renders ProductList (T019) or EmptyState (T020)
  - Includes AddProductDialog trigger (T017)
  - Includes search component (T021)
- [ ] T023 Create loading state in `src/app/(app)/products/loading.tsx`
  - Skeleton UI for product list

**Checkpoint**: User Story 2 complete - can view and search products

---

## Phase 5: User Story 3 - Edit Product (Priority: P2)

**Goal**: Allow users to edit a product's name

**Independent Test**: Click edit on a product, change name, save. New name appears in list.

### Implementation

- [ ] T024 [P] Extend product service with `updateProduct()` method in `src/modules/products/application/services/product.service.ts`
  - Validates product exists and belongs to organization
  - Updates name and updated_at timestamp
  - Depends on: T011 (repository)
- [ ] T025 [P] Implement `updateProduct` Server Action in `src/modules/products/presentation/actions/product.actions.ts`
  - Validates session and organization
  - Validates input with Zod schema (T012)
  - Calls service method (T024)
  - Revalidates `/products` path
- [ ] T026 Create `EditProductDialog` component in `src/modules/products/presentation/components/product-edit-dialog.tsx`
  - Reuses ProductForm component (T016) with pre-populated data
  - Submits to `updateProduct` Server Action (T025)
- [ ] T027 Update `ProductList` component (T019) to include edit action
  - Add edit button to each product row
  - Opens EditProductDialog (T026)

**Checkpoint**: User Story 3 complete - can edit products

---

## Phase 6: User Story 4 - Delete Product (Priority: P2)

**Goal**: Allow users to soft-delete products with confirmation

**Independent Test**: Click delete on a product, confirm in dialog. Product disappears from active list.

### Implementation

- [ ] T028 [P] Extend product service with `softDeleteProduct()` method in `src/modules/products/application/services/product.service.ts`
  - Validates product exists and belongs to organization
  - Sets deleted_at timestamp
  - Depends on: T011 (repository)
- [ ] T029 [P] Implement `softDeleteProduct` Server Action in `src/modules/products/presentation/actions/product.actions.ts`
  - Validates session and organization
  - Calls service method (T028)
  - Revalidates `/products` and `/products/trash` paths
- [ ] T030 Create `ProductDeleteDialog` component in `src/modules/products/presentation/components/product-delete-dialog.tsx`
  - Confirmation dialog using Radix UI
  - Shows product name being deleted
  - Cancel and Confirm buttons
  - Submits to `softDeleteProduct` Server Action (T029)
- [ ] T031 Update `ProductList` component (T019) to include delete action
  - Add delete button to each product row
  - Opens ProductDeleteDialog (T030)

**Checkpoint**: User Story 4 complete - can soft-delete products

---

## Phase 7: User Story 5 - Restore Deleted Product (Priority: P2)

**Goal**: Allow users to restore soft-deleted products from Trash view

**Independent Test**: Navigate to `/products/trash`, see deleted products, click restore. Product reappears in active list.

### Implementation

- [ ] T032 [P] Extend product service with `restoreProduct()` method in `src/modules/products/application/services/product.service.ts`
  - Validates product exists and belongs to organization
  - Clears deleted_at timestamp (sets to null)
  - Depends on: T011 (repository)
- [ ] T033 [P] Extend product service with `getDeletedProducts()` method in `src/modules/products/application/services/product.service.ts`
  - Returns only soft-deleted products for organization
  - Depends on: T011 (repository)
- [ ] T034 [P] Implement `restoreProduct` Server Action in `src/modules/products/presentation/actions/product.actions.ts`
  - Validates session and organization
  - Calls service method (T032)
  - Revalidates `/products` and `/products/trash` paths
- [ ] T035 Create `ProductTrashList` component in `src/modules/products/presentation/components/product-trash-list.tsx`
  - Displays deleted products in a table
  - Shows product name, deletion date, and restore action
  - Empty state when no deleted products
- [ ] T036 Create Trash page in `src/app/(app)/products/trash/page.tsx`
  - Server Component
  - Fetches deleted products using service (T033)
  - Renders ProductTrashList (T035)
  - Link back to active products
- [ ] T037 Create loading state in `src/app/(app)/products/trash/loading.tsx`

**Checkpoint**: User Story 5 complete - can view and restore deleted products

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### UI/UX Polish

- [ ] T038 [P] Add error logging to all Server Actions (error-level logging per spec)
- [ ] T039 [P] Add loading states and optimistic UI where appropriate
- [ ] T040 [P] Ensure keyboard navigation works for all interactive elements
- [ ] T041 [P] Verify accessibility (ARIA labels, focus management) on all components

### Integration & Navigation

- [ ] T042 Add navigation link to Products in app layout/sidebar
- [ ] T043 Add navigation link to Trash view in products section
- [ ] T044 Verify proper error handling and user feedback (toast notifications)

### Performance & Validation

- [ ] T045 Verify product list renders within 1 second for 1000 products
- [ ] T046 Verify product creation completes in under 30 seconds
- [ ] T047 Verify search functionality finds products in under 5 seconds
- [ ] T048 Run TypeScript compilation check (`tsc --noEmit`)
- [ ] T049 Run ESLint check (`bun run lint`)

### Security

- [ ] T050 Verify organization isolation — queries scoped to one organization MUST return zero products belonging to a different organization
  - Validate `ProductRepository` methods all include `organizationId` filter
  - Confirm Server Actions extract `activeOrganizationId` from session before every data operation
  - Covers: FR-006 (organization isolation), SC-004 (100% correct isolation)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3-7 (User Stories in parallel) → Phase 8 (Polish)
```

- **Phase 1**: No dependencies - verification only
- **Phase 2**: CRITICAL - must complete before any user stories
  - Database migration (T004) blocks all repository work
  - Repository implementation (T011) blocks all service work
  - Service methods can be added incrementally per story
- **Phase 3-7**: Can run in parallel after Phase 2 complete
  - Each user story is independent
  - No cross-story dependencies
- **Phase 8**: Depends on all user stories being functional

### User Story Dependencies

All user stories are **independent**:

| Story         | Depends On   | Can Start After                  |
| ------------- | ------------ | -------------------------------- |
| US1 - Create  | Phase 2      | T011 complete                    |
| US2 - View    | Phase 2      | T011 complete                    |
| US3 - Edit    | Phase 2, US2 | T018 complete (for product list) |
| US4 - Delete  | Phase 2, US2 | T018 complete (for product list) |
| US5 - Restore | Phase 2      | T011 complete                    |

**Note**: US3 and US4 technically only need the product list from US2 to have a UI to trigger edit/delete actions. The underlying functionality is independent.

### Task Dependencies Within Stories

**Pattern for each story**:

1. Service method (can start immediately after Phase 2)
2. Server Action (depends on service method)
3. UI Components (can run in parallel after Server Action)
4. Page integration (depends on all components)

---

## Parallel Execution Examples

### Example 1: Complete Phase 2 Foundation

```bash
# All Phase 2 tasks can run in parallel after setup:
T004 - Create database migration
T007 - Create Product entity
T008 - Create domain types
T009 - Create repository interface
T010 - Create application DTOs
T012 - Create Zod schema
T013 - Create presentation types

# Then sequential:
T005 - Run migration (after T004)
T006 - Regenerate types (after T005)
T011 - Implement repository (after T006, T009, T007)
```

### Example 2: Implement User Story 1 (Create)

```bash
# After Phase 2 complete, all US1 tasks can run in parallel:
T014 - Create service method (createProduct)
T015 - Implement createProduct Server Action
T016 - Create ProductForm component

# Then:
T017 - Create AddProductDialog (uses T016)
```

### Example 3: Implement User Stories 2 & 5 in Parallel

```bash
# After Phase 2, US2 and US5 have no dependencies on each other:

# US2 Team:
T018 - getProducts service method
T019 - ProductList component
T020 - EmptyState component
T021 - Search component
T022 - Products page
T023 - Loading state

# US5 Team:
T032 - restoreProduct service method
T033 - getDeletedProducts service method
T034 - Implement restoreProduct Server Action
T035 - ProductTrashList component
T036 - Trash page
T037 - Trash loading state
```

### Example 4: Full Parallel Team Strategy

With 5 developers after Phase 2:

```
Developer A: US1 (Create)
Developer B: US2 (View)
Developer C: US3 (Edit)
Developer D: US4 (Delete)
Developer E: US5 (Restore)
```

Each works independently on their story, all merge when complete.

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

Recommended approach for minimal viable product:

1. **Complete Phase 1**: Verify setup
2. **Complete Phase 2**: Database and foundation (CRITICAL)
3. **Complete Phase 3**: US1 - Create Product
4. **Complete Phase 4**: US2 - View Products
5. **STOP and VALIDATE**:
   - Can create products
   - Products appear in list
   - Can search products
6. **Deploy/Demo**: MVP is live

### Incremental Delivery

After MVP, add remaining stories incrementally:

```
MVP: US1 (Create) + US2 (View) → Deploy/Demo
  ↓
Add US3 (Edit) → Deploy/Demo
  ↓
Add US4 (Delete) → Deploy/Demo
  ↓
Add US5 (Restore/Trash) → Deploy/Demo
  ↓
Phase 8: Polish → Final Release
```

Each increment adds value without breaking previous functionality.

### Full Feature Delivery

For complete feature in one go:

1. Phase 1 + Phase 2 (Foundation)
2. Phase 3, 4, 5, 6, 7 in parallel (all user stories)
3. Phase 8 (Polish)
4. Final validation and release

---

## Task Summary

| Phase     | Story         | Tasks  | Parallel Tasks |
| --------- | ------------- | ------ | -------------- |
| 1         | Setup         | 3      | 2              |
| 2         | Foundation    | 11     | 6              |
| 3         | US1 - Create  | 4      | 3              |
| 4         | US2 - View    | 6      | 4              |
| 5         | US3 - Edit    | 4      | 3              |
| 6         | US4 - Delete  | 4      | 3              |
| 7         | US5 - Restore | 6      | 4              |
| 8         | Polish        | 13     | 12             |
| **Total** |               | **51** | **37**         |

### Independent Test Criteria by Story

- **US1 (Create)**: Create product via form, verify in database
- **US2 (View)**: View list of products, verify search works
- **US3 (Edit)**: Edit product name, verify change persists
- **US4 (Delete)**: Delete product, verify soft delete (deleted_at set)
- **US5 (Restore)**: Restore deleted product, verify reappears in list

### MVP Scope Recommendation

**Minimum**: US1 (Create) + US2 (View)  
**Recommended**: US1 + US2 + US3 (Edit) + US4 (Delete)  
**Full Feature**: All 5 user stories

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- Each user story is designed to be independently completable and testable
- No tests requested per spec - all tasks are implementation only
- Repository pattern allows switching database implementations later
- Soft delete is enforced per Constitution IX - no hard deletes
- All queries are organization-scoped per Constitution X
- Zod 4 syntax used (not Zod 3) per research findings
- TanStack Form v1 with Next.js integration per research findings
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
