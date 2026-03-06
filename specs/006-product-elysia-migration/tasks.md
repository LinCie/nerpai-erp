# Tasks: Product Module Elysia Migration

**Input**: Design documents from `/specs/006-product-elysia-migration/`
**Prerequisites**: spec.md (user stories), research.md (decisions), data-model.md (API schemas), contracts/ (endpoint definitions), quickstart.md (file structure + patterns)

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This is a presentation-layer migration only — domain, application, and infrastructure layers remain unchanged.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths relative to `src/modules/products/` unless otherwise specified

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and wire the product module route plugin into the Elysia app.

- [X] T001 Create route module index plugin at src/modules/products/presentation/routes/index.ts — empty Elysia plugin with prefix `/products` that will compose sub-resource routes
- [X] T002 Register product module route plugin in Elysia app entry point at src/app/api/[[...slugs]]/route.ts via `.use(productModuleRoutes)`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend existing Zod schemas with API request/response types and create query key factories. MUST be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — hooks and routes depend on these schemas and key factories.

- [X] T003 [P] Extend product Zod schemas with API request body and response schemas (createProductBody, updateProductBody, productResponse, productListResponse) in src/modules/products/presentation/schemas/product.schema.ts per data-model.md
- [X] T004 [P] Extend attribute Zod schemas with API request body and response schemas (createAttributeBody, updateAttributeBody, createAttributeOptionBody, updateAttributeOptionBody, attributeResponse, attributeOptionResponse, attributeWithOptionsResponse) in src/modules/products/presentation/schemas/attribute.schema.ts per data-model.md
- [X] T005 [P] Extend variant Zod schemas with API request body and response schemas (assignAttributeBody, reorderAttributesBody, generateVariantsBody, updateVariantBody, toggleVariantActiveBody, checkSkuBody, variantResponse, generateVariantsResponse, removeAttributeResponse, removeAttributeConfirmationResponse, skuAvailabilityResponse, assignAttributeResponse) in src/modules/products/presentation/schemas/variant.schema.ts per data-model.md
- [X] T006 [P] Create product query key factory in src/modules/products/presentation/queries/product-keys.ts using createQueryKeys('products')
- [X] T007 [P] Create attribute query key factory in src/modules/products/presentation/queries/attribute-keys.ts using createQueryKeys('attributes')
- [X] T008 [P] Create variant query key factory in src/modules/products/presentation/queries/variant-keys.ts using createQueryKeys('variants')

**Checkpoint**: Schemas extended, query keys ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Product CRUD via API (Priority: P1) 🎯 MVP

**Goal**: All product create, update, soft-delete, and restore operations flow through typed Elysia REST endpoints consumed via Eden Treaty and TanStack Query, replacing server actions. Operators see no workflow change.

**Independent Test**: Create a product, edit its name, soft-delete it, restore it — each operation succeeds and the product list reflects changes immediately.

### Implementation for User Story 1

- [X] T009 [US1] Implement product Elysia route handlers (GET /, GET /trash, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/restore) in src/modules/products/presentation/routes/product.routes.ts per contracts/product-api.md — use authPlugin, Zod body/response schemas, delegate to ProductService
- [X] T010 [US1] Register product routes in the module route index at src/modules/products/presentation/routes/index.ts via `.use(productRoutes)`
- [X] T011 [P] [US1] Create product query hooks (useProducts for active list, useProductsTrash for trash list, useProduct for detail) in src/modules/products/presentation/queries/use-products.ts
- [X] T012 [P] [US1] Create product mutation hooks (useCreateProduct, useUpdateProduct, useDeleteProduct, useRestoreProduct) with cache invalidation in src/modules/products/presentation/queries/use-create-product.ts, use-update-product.ts, use-delete-product.ts, use-restore-product.ts
- [X] T013 [US1] Refactor product-add-dialog.tsx and product-form.tsx to use useCreateProduct mutation — replace useActionState/server action with mutate + onSuccess/onError in src/modules/products/presentation/components/
- [X] T014 [US1] Refactor product-edit-dialog.tsx and product-edit-form.tsx to use useUpdateProduct mutation — replace server action pattern with mutation hook in src/modules/products/presentation/components/
- [X] T015 [P] [US1] Refactor product-delete-dialog.tsx to use useDeleteProduct mutation in src/modules/products/presentation/components/product-delete-dialog.tsx
- [X] T016 [US1] Refactor product-list.tsx to use useProducts query hook — replace server action data fetching with useQuery in src/modules/products/presentation/components/product-list.tsx
- [X] T017 [US1] Refactor product-trash-list.tsx to use useProductsTrash query and useRestoreProduct mutation in src/modules/products/presentation/components/product-trash-list.tsx
- [X] T018 [US1] Remove product server actions file src/modules/products/presentation/actions/product.actions.ts and remove all imports referencing it

**Checkpoint**: Product CRUD fully functional via API — create, edit, soft-delete, restore all work through Elysia endpoints

---

## Phase 4: User Story 2 — Attribute & Option Management via API (Priority: P2)

**Goal**: All attribute and attribute option create, update, and delete operations flow through typed Elysia REST endpoints, replacing server actions.

**Independent Test**: Create an attribute with options, edit the attribute name, add/remove options, soft-delete the attribute — each operation succeeds and the attributes list updates accordingly.

### Implementation for User Story 2

- [ ] T019 [US2] Implement attribute Elysia route handlers (GET /, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/options, PUT /:attributeId/options/:id, DELETE /:attributeId/options/:id) in src/modules/products/presentation/routes/attribute.routes.ts per contracts/attribute-api.md — use authPlugin, Zod schemas, delegate to AttributeService
- [ ] T020 [US2] Register attribute routes in the module route index at src/modules/products/presentation/routes/index.ts via `.use(attributeRoutes)`
- [ ] T021 [P] [US2] Create attribute query hooks (useAttributes for list, useAttribute for detail) in src/modules/products/presentation/queries/use-attributes.ts
- [ ] T022 [P] [US2] Create attribute mutation hooks (useCreateAttribute, useUpdateAttribute, useDeleteAttribute) with cache invalidation in src/modules/products/presentation/queries/use-create-attribute.ts, use-update-attribute.ts, use-delete-attribute.ts
- [ ] T023 [P] [US2] Create attribute option mutation hooks (useCreateAttributeOption, useUpdateAttributeOption, useDeleteAttributeOption) with cache invalidation in src/modules/products/presentation/queries/use-attribute-options.ts
- [ ] T024 [US2] Refactor attribute-add-dialog.tsx and attribute-form.tsx to use useCreateAttribute mutation in src/modules/products/presentation/components/
- [ ] T025 [US2] Refactor attribute-edit-dialog.tsx and attribute-edit-form.tsx to use useUpdateAttribute mutation in src/modules/products/presentation/components/
- [ ] T026 [US2] Refactor attribute-option-form.tsx and attribute-option-list.tsx to use attribute option mutation hooks in src/modules/products/presentation/components/
- [ ] T027 [US2] Refactor attribute-list.tsx to use useAttributes query and useDeleteAttribute mutation in src/modules/products/presentation/components/attribute-list.tsx
- [ ] T028 [US2] Remove attribute server actions file src/modules/products/presentation/actions/attribute.actions.ts and remove all imports referencing it

**Checkpoint**: Attribute and option CRUD fully functional via API — all operations work through Elysia endpoints

---

## Phase 5: User Story 3 — Variant Configuration via API (Priority: P3)

**Goal**: All variant operations — attribute assignment, combination generation, variant editing, SKU checking, active toggling, and soft-deletion — flow through typed Elysia REST endpoints, replacing server actions.

**Independent Test**: Assign attributes to a product, generate variants, edit a variant's SKU and price, toggle active status, soft-delete a variant — each operation succeeds and the variant list updates accordingly.

### Implementation for User Story 3

- [ ] T029 [US3] Implement variant Elysia route handlers (GET /:productId/variants, POST /:productId/attributes, DELETE /:productId/attributes/:attributeId, PUT /:productId/attributes/reorder, POST /:productId/variants/generate, PUT /:productId/variants/:id, PATCH /:productId/variants/:id/active, DELETE /:productId/variants/:id, GET /:productId/variants/combination-keys, POST /:productId/variants/check-sku) in src/modules/products/presentation/routes/variant.routes.ts per contracts/variant-api.md — use authPlugin, Zod schemas, delegate to VariantService
- [ ] T030 [US3] Register variant routes in the module route index at src/modules/products/presentation/routes/index.ts via `.use(variantRoutes)`
- [ ] T031 [P] [US3] Create variant query hooks (useVariants for list, useCombinationKeys for existing combinations) in src/modules/products/presentation/queries/use-variants.ts
- [ ] T032 [P] [US3] Create useGenerateVariants mutation hook with cache invalidation in src/modules/products/presentation/queries/use-generate-variants.ts
- [ ] T033 [P] [US3] Create useUpdateVariant mutation hook with cache invalidation in src/modules/products/presentation/queries/use-update-variant.ts
- [ ] T034 [P] [US3] Create useVariantMutations hooks (useToggleVariantActive, useDeleteVariant, useAssignAttribute, useRemoveAttribute, useReorderAttributes) with cache invalidation in src/modules/products/presentation/queries/use-variant-mutations.ts
- [ ] T035 [P] [US3] Create useCheckSku query hook in src/modules/products/presentation/queries/use-check-sku.ts
- [ ] T036 [US3] Refactor product-attribute-config.tsx to use useAssignAttribute, useRemoveAttribute, and useReorderAttributes hooks in src/modules/products/presentation/components/product-attribute-config.tsx
- [ ] T037 [US3] Refactor variant-combination-matrix.tsx to use useGenerateVariants, useCombinationKeys, and useCheckSku hooks in src/modules/products/presentation/components/variant-combination-matrix.tsx
- [ ] T038 [US3] Refactor variant-edit-row.tsx to use useUpdateVariant and useToggleVariantActive hooks in src/modules/products/presentation/components/variant-edit-row.tsx
- [ ] T039 [US3] Refactor variant-list.tsx to use useVariants query and useDeleteVariant hooks in src/modules/products/presentation/components/variant-list.tsx
- [ ] T040 [US3] Remove variant server actions file src/modules/products/presentation/actions/variant.actions.ts and remove all imports referencing it

**Checkpoint**: All variant operations fully functional via API — the complete product module is migrated

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and audits across all user stories.

- [ ] T041 [P] Audit all product module files for remaining `'use server'` directives — zero should remain per SC-001
- [ ] T042 [P] Audit all product components for remaining direct server action imports or useActionState usage — zero should remain per SC-002
- [ ] T043 [P] Audit TanStack Query usage — verify all client data fetching uses useQuery/useMutation with query key factories, no useEffect+setState fetch patterns per CR-005
- [ ] T044 Verify form validation errors from API responses display inline on form fields matching pre-migration behavior per SC-005
- [ ] T045 Delete src/modules/products/presentation/actions/ directory after confirming all three action files are removed per FR-010
- [ ] T046 Run quickstart.md verification checklist: `bun tsc --noEmit`, `bun run lint`, full UI walkthrough of product/attribute/variant CRUD operations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — creates schemas and key factories needed by all stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — products are the core entity
- **User Story 2 (Phase 4)**: Depends on Phase 2 — attributes are independent of product API migration
- **User Story 3 (Phase 5)**: Depends on Phase 2 — variants depend on products and attributes existing in the DB but not on their API migrations being complete
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 — independent of US1 (attributes are a standalone resource)
- **User Story 3 (P3)**: Can start after Phase 2 — variant routes reference products by `:productId` path param but do not import product route types; variant components may use attribute data but only via their own hooks

### Within Each User Story (Sequential Order)

1. Route handlers (must come first — Eden Treaty type inference depends on routes being registered in the Elysia app)
2. Register routes in module index (wire up for type propagation)
3. Query/mutation hooks (depend on routes for Eden Treaty types) — [P] with each other
4. Component refactors (depend on hooks being available) — [P] with each other
5. Server action removal (only after all components are migrated off the action)

---

## Parallel Opportunities

### Across Stories (after Phase 2)

```
US1 (Products)  ──────────────────────►
US2 (Attributes) ─────────────────────►
US3 (Variants)   ─────────────────────►
```

All three stories can proceed in parallel since they touch different route files, different hook files, and different component files.

### Within Phase 2 (Foundational)

```
T003 (product schemas)    ─►
T004 (attribute schemas)  ─►  All 6 tasks in parallel
T005 (variant schemas)    ─►
T006 (product keys)       ─►
T007 (attribute keys)     ─►
T008 (variant keys)       ─►
```

### Within Each Story (e.g., US1)

```
T009 (routes) → T010 (register) → T011+T012 (hooks, parallel) → T013+T014+T015+T016+T017 (components, parallel) → T018 (remove actions)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T008)
3. Complete Phase 3: User Story 1 (T009–T018)
4. **STOP and VALIDATE**: Create, edit, soft-delete, and restore a product via the UI
5. Product CRUD is fully migrated — this is the minimum viable delivery

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add User Story 1 → Test product CRUD → Deploy/Demo (MVP!)
3. Add User Story 2 → Test attribute management → Deploy/Demo
4. Add User Story 3 → Test variant configuration → Deploy/Demo
5. Polish → Final audit and cleanup

### Key Patterns (from research.md + quickstart.md)

- **Routes**: `new Elysia({ prefix })` plugin per resource, composed in routes/index.ts, Zod schemas via Standard Schema (not TypeBox)
- **Auth**: `{ auth: true }` macro resolves `{ user, session, organization }` — extract `organization.id` for multi-tenancy
- **Hooks**: `createQueryKeys` + `treatyFn` + `useQuery`/`useMutation` from shared utilities
- **Components**: `useActionState(serverAction)` → `useMutation({ mutationFn })` + form `onSubmit`; `revalidatePath()` → `queryClient.invalidateQueries()`
- **SSR**: Server components (`*-server.tsx`) that call services directly remain unchanged

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same batch
- [Story] label maps task to specific user story for traceability
- No database schema changes — this is a presentation-layer migration only
- Domain, application, and infrastructure layers remain completely untouched
- Server components that call services directly for SSR continue to do so (per spec assumptions)
- Zod is used for API schemas instead of TypeBox (justified deviation documented in research.md)
- The existing `api` client at `src/shared/infrastructure/api-client.ts` is used as-is
- Commit after each task or logical group for easy rollback
