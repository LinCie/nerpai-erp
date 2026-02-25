# Tasks: Product Variants

**Feature**: Product Variants (002-product-variants)
**Branch**: `002-product-variants`
**Input**: Design documents from `/specs/002-product-variants/`
**Date**: 2026-02-25

---

## Phase 1: Setup (Project Dependencies)

**Purpose**: Install new dependencies required for the variant feature

- [x] T001 Install drag-and-drop dependencies for attribute reorder: `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] T002 [P] Add shadcn/ui components: `bunx --bun shadcn@latest add table checkbox alert-dialog`

---

## Phase 2: Foundational (Database Schema & Domain Layer)

**Purpose**: Database migrations and domain entities that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Migrations

- [x] T003 Create migration for attribute table: `bun db:migrate:make create_attribute_table` → edit `src/shared/infrastructure/persistence/migrations/XXXX_create_attribute_table.ts`
- [x] T004 [P] Create migration for attribute_option table: `bun db:migrate:make create_attribute_option_table` → edit `src/shared/infrastructure/persistence/migrations/XXXX_create_attribute_option_table.ts`
- [x] T005 [P] Create migration for product_attribute table: `bun db:migrate:make create_product_attribute_table` → edit `src/shared/infrastructure/persistence/migrations/XXXX_create_product_attribute_table.ts`
- [x] T006 Create migration for product_variant and variant_option tables: `bun db:migrate:make create_product_variant_and_variant_option_tables` → edit `src/shared/infrastructure/persistence/migrations/XXXX_create_product_variant_and_variant_option_tables.ts`
- [x] T007 Execute all migrations: `bun db:migrate`
- [x] T008 Regenerate TypeScript types from database: `bun db:codegen`

### Domain Layer

- [x] T009 [P] Create Attribute entity type in `src/modules/products/domain/entities/attribute.ts`
- [x] T010 [P] Create AttributeOption entity type in `src/modules/products/domain/entities/attribute-option.ts`
- [x] T011 [P] Create ProductAttribute entity type in `src/modules/products/domain/entities/product-attribute.ts`
- [x] T012 [P] Create ProductVariant entity type in `src/modules/products/domain/entities/product-variant.ts`
- [x] T013 [P] Create VariantOption entity type in `src/modules/products/domain/entities/variant-option.ts`
- [x] T014 Extend domain types in `src/modules/products/domain/types/index.ts` with variant-related types (VariantWithOptions, AttributeWithOptions, etc.)

**Checkpoint**: Foundation ready - database tables exist, types generated, domain entities defined

---

## Phase 3: User Story 1 - Define Product Attributes & Options (Priority: P1) 🎯 MVP

**Goal**: Organization users can create reusable attributes (Color, Size) and their option values (Red, Blue, Small, Large) that can be used across the product catalog

**Independent Test**: Navigate to `/products/attributes`, create attribute "Color" with options "Red" and "Blue", verify both appear in the list

### Application Layer

- [ ] T015 [P] Define IAttributeRepository interface in `src/modules/products/application/repositories/attribute.repository.interface.ts`
- [ ] T016 Implement AttributeRepository in `src/modules/products/infrastructure/repositories/attribute.repository.ts` (depends on T015)
- [ ] T017 Implement AttributeService in `src/modules/products/application/services/attribute.service.ts` with CRUD operations for attributes and options (depends on T009, T010, T016)
- [ ] T018 Extend application types in `src/modules/products/application/types/index.ts` with attribute service DTOs

### Presentation Layer - Schemas & Actions

- [ ] T019 [P] Create Zod schemas in `src/modules/products/presentation/schemas/attribute.schema.ts` (attribute name validation, option value validation)
- [ ] T020 Implement attribute Server Actions in `src/modules/products/presentation/actions/attribute.actions.ts`:
  - `createAttribute` - create new attribute
  - `updateAttribute` - update attribute name
  - `softDeleteAttribute` - soft delete attribute
  - `createAttributeOption` - add option to attribute
  - `updateAttributeOption` - update option value
  - `deleteAttributeOption` - delete option with reference check (FR-014)

### Presentation Layer - Components

- [ ] T021 [P] Create AttributeList component in `src/modules/products/presentation/components/attribute-list.tsx`
- [ ] T022 [P] Create AttributeAddDialog component in `src/modules/products/presentation/components/attribute-add-dialog.tsx`
- [ ] T023 [P] Create AttributeEditDialog component in `src/modules/products/presentation/components/attribute-edit-dialog.tsx`
- [ ] T024 [P] Create AttributeOptionList component in `src/modules/products/presentation/components/attribute-option-list.tsx`
- [ ] T025 Create AttributeOptionForm component in `src/modules/products/presentation/components/attribute-option-form.tsx`

### Route Pages

- [ ] T026 Create attributes management page in `src/app/(app)/products/attributes/page.tsx`
- [ ] T027 Create loading skeleton in `src/app/(app)/products/attributes/loading.tsx`

**Checkpoint**: User Story 1 complete - can create/edit/delete attributes and options

---

## Phase 4: User Story 2 - Configure Variants on a Product (Priority: P1)

**Goal**: Users can attach attributes to products, select which option combinations become active variants, and generate variant SKUs

**Independent Test**: Open product detail, assign Color and Size attributes, select Red-Small and Red-Large combinations, generate variants, verify variants appear with auto-generated SKUs

### Application Layer

- [ ] T028 [P] Define IVariantRepository interface in `src/modules/products/application/repositories/variant.repository.interface.ts`
- [ ] T029 Implement VariantRepository in `src/modules/products/infrastructure/repositories/variant.repository.ts` (depends on T028)
- [ ] T030 Implement VariantService in `src/modules/products/application/services/variant.service.ts` with:
  - SKU generation with collision resolution (FR-005)
  - Cartesian product for variant generation
  - Attribute assignment/removal logic
  - (depends on T011, T012, T013, T029)
- [ ] T031 Extend application types in `src/modules/products/application/types/index.ts` with variant service DTOs

### Presentation Layer - Schemas & Actions

- [ ] T032 [P] Create Zod schemas in `src/modules/products/presentation/schemas/variant.schema.ts` (variant selection, SKU override, price/stock validation)
- [ ] T033 Implement variant Server Actions in `src/modules/products/presentation/actions/variant.actions.ts`:
  - `assignAttributeToProduct` - associate attribute with product
  - `removeAttributeFromProduct` - remove attribute with confirmation (FR-016)
  - `reorderProductAttributes` - drag-drop reorder (FR-017)
  - `generateVariants` - generate variants from selected combinations

### Presentation Layer - Components

- [ ] T034 [P] Create ProductAttributeConfig component in `src/modules/products/presentation/components/product-attribute-config.tsx` (attribute selection + drag-drop reorder)
- [ ] T035 Create VariantCombinationMatrix component in `src/modules/products/presentation/components/variant-combination-matrix.tsx` (checkbox grid for selecting combinations)

### Route Pages

- [ ] T036 Create variant configuration page in `src/app/(app)/products/[productId]/variants/page.tsx`
- [ ] T037 Create loading skeleton in `src/app/(app)/products/[productId]/variants/loading.tsx`

**Checkpoint**: User Story 2 complete - can configure attributes and generate variants

---

## Phase 5: User Story 3 - Manage Individual Variant Details (Priority: P1)

**Goal**: Users can set price, stock quantity, and SKU for each variant independently

**Independent Test**: Open variant edit view, set price to 29.99, stock to 50, custom SKU, verify values persist

### Presentation Layer - Actions

- [ ] T038 Extend variant.actions.ts with:
  - `updateVariant` - update price, stock, SKU
  - `toggleVariantActive` - activate/deactivate variant (FR-010)
  - `softDeleteVariant` - soft delete variant

### Presentation Layer - Components

- [ ] T039 [P] Create VariantList component in `src/modules/products/presentation/components/variant-list.tsx` (table display)
- [ ] T040 Create VariantEditRow component in `src/modules/products/presentation/components/variant-edit-row.tsx` (inline editing)
- [ ] T041 [P] Create VariantEmptyState component in `src/modules/products/presentation/components/variant-empty-state.tsx`

**Checkpoint**: User Story 3 complete - can manage variant details individually

---

## Phase 6: User Story 4 - View Variants on Product Detail Page (Priority: P2)

**Goal**: Users can see all variants of a product with SKU, price, stock, and status in a clear list

**Independent Test**: Open product detail page, verify all variants display with correct information, active/inactive visually differentiated

### Route Pages

- [ ] T042 Create product detail page in `src/app/(app)/products/[productId]/page.tsx` (displays product info + variant list)
- [ ] T043 Create loading skeleton in `src/app/(app)/products/[productId]/loading.tsx`

### Presentation Layer - Updates

- [ ] T044 Modify product list in `src/app/(app)/products/page.tsx` to link to product detail (click row → /products/[id])
- [ ] T045 Extend form options in `src/modules/products/presentation/lib/form-options.ts` with attribute/variant form options
- [ ] T046 Extend presentation types in `src/modules/products/presentation/types/index.ts` with variant presentation types

**Checkpoint**: User Story 4 complete - can view variants on product detail page

---

## Phase 7: User Story 5 - Add New Option to Existing Variant Set (Priority: P3)

**Goal**: Users can add new attribute options to existing products and selectively generate only the new variant combinations

**Independent Test**: Open product with 4 variants, add new color option, verify only new combinations are offered for activation, existing variants unchanged

### Application Layer

- [ ] T047 Extend VariantService with `getNewVariantCombinations` method to compute diff against existing variants (depends on T030)

### Presentation Layer - Updates

- [ ] T048 Extend VariantCombinationMatrix to highlight new combinations vs existing (visual distinction for FR-011)
- [ ] T049 Update generateVariants action to support selective generation of only new combinations

**Checkpoint**: User Story 5 complete - can expand variant sets incrementally

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance, validation, and documentation

- [ ] T050 [P] Build check: `bun run build` — verify TypeScript compilation passes
- [ ] T051 [P] Lint check: `bun run lint` — verify ESLint passes with no warnings
- [ ] T052 Contract parity audit: verify all Server Actions match `contracts/server-actions.md` behavior
- [ ] T053 DB constraint validation: test CHECK constraints (negative price, negative stock) and UNIQUE constraints (duplicate SKU)
- [ ] T054 Manual smoke test per `quickstart.md` verification section
- [ ] T055 Performance validation: verify variant list loads <1s for 100 variants (SC-003)
- [ ] T056 Update documentation: add variant feature notes to README.md
- [ ] T057 Add active-organization membership guard utility usage to all variant/attribute Server Actions (`attribute.actions.ts`, `variant.actions.ts`) and return explicit `forbidden` contract responses
- [ ] T058 Add organization-membership validation in new route pages (`/products/attributes`, `/products/[productId]`, `/products/[productId]/variants`) with redirect behavior for missing active org
- [ ] T059 Create route error boundary in `src/app/(app)/products/attributes/error.tsx`
- [ ] T060 Create route error boundary in `src/app/(app)/products/[productId]/error.tsx`
- [ ] T061 Create route error boundary in `src/app/(app)/products/[productId]/variants/error.tsx`
- [ ] T062 Add keyboard drag-drop support (dnd-kit KeyboardSensor) and ARIA announcements in `src/modules/products/presentation/components/product-attribute-config.tsx`
- [ ] T063 Add accessibility verification checklist for reorder flow (keyboard-only + screen reader smoke test)
- [ ] T064 Extend DB constraint validation to include `display_order > 0` and uniqueness on (`product_id`, `display_order`)
- [ ] T065 Validate SC-001: timed task for creating attribute + options from blank state (<60s)
- [ ] T066 Validate SC-002: timed task for configuring 3x3 variants (<3m)
- [ ] T067 Validate SC-004: org-isolation negative test (cross-org access blocked for reads/writes)
- [ ] T068 Validate SC-005: immediate SKU conflict feedback during entry (client-side + server-side parity)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (User Stories) → Phase 8 (Polish)
                    ↑                    ↑
                    |                    |
              BLOCKS all US         Can run in parallel
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2. No dependencies on other stories. Can start immediately after Phase 2.
- **US2 (P1)**: Depends on Phase 2 and US1 (needs attributes to assign to products). Can start after US1.
- **US3 (P1)**: Depends on Phase 2 and US2 (needs variants to manage). Can start after US2.
- **US4 (P2)**: Depends on Phase 2 and US3 (needs variant management to display). Can start after US3.
- **US5 (P3)**: Depends on Phase 2 and US2 (needs variant generation logic). Can start after US2.

### Suggested Execution Order

**MVP Path (Sequential)**:

1. Phase 1 → Phase 2 (Foundation)
2. Phase 3 (US1 - Attributes) → STOP, validate
3. Phase 4 (US2 - Variant Config) → STOP, validate
4. Phase 5 (US3 - Variant Details) → STOP, validate
5. Phase 6 (US4 - Product Detail View) → STOP, validate
6. Phase 7 (US5 - Incremental Addition) → STOP, validate
7. Phase 8 (Polish)

**Parallel Path (Team)**:

- Developer A: Phase 1 + Phase 2 (Foundation)
- Developer B: Phase 3 (US1) - starts after Phase 2
- Developer C: Phase 4 (US2) - starts after US1
- Developer D: Phase 5 (US3) - starts after US2
- Developer E: Phase 6 (US4) - starts after US3
- Developer F: Phase 7 (US5) - starts after US2
- All: Phase 8 (Polish)

---

## Parallel Execution Examples

### Within Phase 2 (Foundational):

```bash
# All domain entities can be created in parallel:
Task: T009 - Create Attribute entity
Task: T010 - Create AttributeOption entity
Task: T011 - Create ProductAttribute entity
Task: T012 - Create ProductVariant entity
Task: T013 - Create VariantOption entity

# Migrations T003-T006 can be done in parallel (different files)
```

### Within Phase 3 (US1):

```bash
# Application layer (sequential):
Task: T015 - Define IAttributeRepository interface
Task: T016 - Implement AttributeRepository (depends on T015)
Task: T017 - Implement AttributeService (depends on T016)

# Presentation layer (parallel):
Task: T019 - Create Zod schemas
Task: T021 - Create AttributeList component
Task: T022 - Create AttributeAddDialog component
Task: T023 - Create AttributeEditDialog component
Task: T024 - Create AttributeOptionList component

# Actions and routes:
Task: T020 - Implement attribute Server Actions
Task: T026 - Create attributes page
Task: T027 - Create loading skeleton
```

### Within Phase 4 (US2):

```bash
# Application layer (sequential):
Task: T028 - Define IVariantRepository interface
Task: T029 - Implement VariantRepository (depends on T028)
Task: T030 - Implement VariantService (depends on T029)

# Presentation layer (parallel):
Task: T032 - Create Zod schemas
Task: T034 - Create ProductAttributeConfig component
Task: T035 - Create VariantCombinationMatrix component

# Actions and routes:
Task: T033 - Implement variant Server Actions
Task: T036 - Create variant configuration page
Task: T037 - Create loading skeleton
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 Only)

1. **Phase 1**: Setup dependencies
2. **Phase 2**: Database + Domain layer (CRITICAL)
3. **Phase 3**: US1 - Attributes & Options
4. **Phase 4**: US2 - Configure Variants
5. **Phase 5**: US3 - Manage Variant Details
6. **STOP**: Validate core variant functionality
7. Deploy/demo MVP

### Full Feature Delivery

1. Complete MVP (US1 + US2 + US3)
2. Phase 6: US4 - Product Detail View
3. Phase 7: US5 - Incremental Addition
4. Phase 8: Polish & QA
5. Full feature deploy

---

## Summary Statistics

- **Total Tasks**: 68
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 13 tasks
- **Phase 3 (US1)**: 13 tasks
- **Phase 4 (US2)**: 12 tasks
- **Phase 5 (US3)**: 4 tasks
- **Phase 6 (US4)**: 5 tasks
- **Phase 7 (US5)**: 3 tasks
- **Phase 8 (Polish)**: 19 tasks

### Task Distribution by User Story

- **US1 (P1)**: 13 tasks (Attributes & Options)
- **US2 (P1)**: 12 tasks (Configure Variants)
- **US3 (P1)**: 4 tasks (Manage Variant Details)
- **US4 (P2)**: 5 tasks (View Variants)
- **US5 (P3)**: 3 tasks (Add New Options)

### Parallel Opportunities

- Phase 2: 5 domain entities can be created in parallel
- Phase 3: 5 UI components can be created in parallel
- Phase 4: 3 UI components can be created in parallel
- All Zod schemas can be created in parallel with components
- Multiple migration files can be edited in parallel

### Independent Test Criteria

- **US1**: Create "Color" attribute with "Red" and "Blue" options, verify in list
- **US2**: Assign attributes to product, generate variants, verify SKUs created
- **US3**: Edit variant price/stock/SKU, verify persistence
- **US4**: View product detail, see all variants with correct data
- **US5**: Add new option to existing product, verify only new combinations generated

---

## Notes

- All database tables use UUID v7 primary keys with `uuidv7()` default
- All entities implement soft delete with `deleted_at` column
- All queries filter by `organization_id` (multi-tenancy)
- SKU uniqueness enforced at database level (composite UNIQUE on sku + organization_id)
- CHECK constraints enforce non-negative price and stock_quantity
- Foreign key on variant_option.attribute_option_id uses ON DELETE RESTRICT (FR-014)
- Tests are NOT included (not requested in feature specification)
- All tasks use repository-relative file paths as specified in plan.md
