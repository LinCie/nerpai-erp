# Tasks: Simple Inventory Module

**Input**: Design documents from `/specs/004-simple-inventory/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/server-actions.md ✅, quickstart.md ✅

**Tests**: Not requested — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the module directory structure and database schema

- [X] T001 Create inventory module directory structure per plan.md: `src/modules/inventory/{domain/{entities,types},application/{repositories,services,types},infrastructure/repositories,presentation/{actions,components,schemas,lib,types}}`
- [X] T002 Create database migration for `stock_movement` table using `bun db:migrate:create create_stock_movement_table`, then write the migration SQL from data-model.md (table, CHECK constraints, FK constraints, indexes) into the generated migration file
- [X] T003 Run migration (`bun db:migrate`) and regenerate database types (`bun db:codegen`), then verify with `bun run lint`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain layer, shared types, repository, and validation schemas that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Create StockMovement entity interface in `src/modules/inventory/domain/entities/stock-movement.ts` — define the `StockMovement` interface with all columns from data-model.md (id, productId, productVariantId, warehouseId, movementType, delta, referenceId, notes, createdBy, organizationId, createdAt, deletedAt)
- [ ] T005 [P] Create domain types in `src/modules/inventory/domain/types/index.ts` — define `MovementType` union type (`"receive" | "dispatch" | "adjustment"`), `StockLevel` interface, and `StockLevelWithDetails` interface (with product/warehouse display fields)
- [ ] T006 [P] Create application-layer DTOs in `src/modules/inventory/application/types/index.ts` — define `ReceiveStockParams`, `DispatchStockParams`, `AdjustStockParams`, `TransferStockParams`, `GetStockLevelsParams`, `GetMovementHistoryParams`, and `GetCurrentStockParams` per data-model.md
- [ ] T007 [P] Create presentation-layer types in `src/modules/inventory/presentation/types/index.ts` — define `StockMovementWithDetails` interface (movement record with joined product name, variant SKU, warehouse name/code, user name) per contracts/server-actions.md
- [ ] T008 Define `IStockMovementRepository` interface in `src/modules/inventory/application/repositories/stock-movement.repository.interface.ts` — methods: `create(movement)`, `createTransferPair(dispatch, receive)` (transactional), `getStockLevels(params)`, `getMovementHistory(params)`, `getCurrentStock(params)`. Do NOT expose `softDelete()` or `restore()` (justified deviation per plan.md Complexity Tracking)
- [ ] T009 Implement `StockMovementRepository` (Kysely) in `src/modules/inventory/infrastructure/repositories/stock-movement.repository.ts` — implement all `IStockMovementRepository` methods using Kysely query builder. Use `db.fn.sum()`/`db.fn.coalesce()` for stock aggregation (R3), `db.transaction().execute()` for transfer atomicity (R2), and join with product/variant/warehouse/user tables for display fields. All queries scoped by `organization_id` and `deleted_at IS NULL`
- [ ] T010 Create Zod validation schemas for all operations in `src/modules/inventory/presentation/schemas/inventory.schema.ts` — define schemas for: `receiveStockSchema` (productId required UUID, productVariantId optional UUID, warehouseId required UUID, quantity integer > 0, notes optional max 1000 chars), `dispatchStockSchema` (same + confirmNegative optional), `adjustStockSchema` (newQuantity integer >= 0), `transferStockSchema` (sourceWarehouseId, destinationWarehouseId must differ, quantity > 0, confirmNegative optional)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — View Global Stock Levels (Priority: P1) 🎯 MVP

**Goal**: Display current stock levels of all products/variants across all warehouse locations, with movement history audit trail

**Independent Test**: Navigate to `/inventory` → verify products/variants listed with aggregated stock quantities per warehouse. Products with no stock show 0.

### Implementation for User Story 1

- [ ] T011 [US1] Implement InventoryService read methods in `src/modules/inventory/application/services/inventory.service.ts` — implement `getStockLevels(params)` returning `StockLevelWithDetails[]` with total count, `getMovementHistory(params)` returning `StockMovementWithDetails[]` with total count, and `getCurrentStock(params)` returning a number. Service delegates to repository. Inject `IStockMovementRepository` dependency
- [ ] T012 [US1] Implement read server actions in `src/modules/inventory/presentation/actions/inventory.actions.ts` — create `getStockLevels` and `getMovementHistory` as read actions callable from Server Components (use `getSessionAndOrg()` for auth/org context), and `getCurrentStock` helper. Match signatures from contracts/server-actions.md
- [ ] T013 [P] [US1] Create inventory-dashboard component in `src/modules/inventory/presentation/components/inventory-dashboard.tsx` — display stock levels in a semantic table with columns: Product, Variant (SKU), Warehouse, Current Stock. Support search/filter. Show stock quantity of 0 for products with no movements. Include action button slots for future receive/dispatch/adjust dialogs
- [ ] T014 [P] [US1] Create movement-history component in `src/modules/inventory/presentation/components/movement-history.tsx` — display chronological audit trail of stock movements in a table with columns: Date, Type (receive/dispatch/adjustment), Product, Variant, Warehouse, Delta (+/-), Notes, User. Support filtering by movement type, product, warehouse. Per FR-006
- [ ] T015 [US1] Create inventory page at `src/app/(app)/inventory/page.tsx` — Server Component that calls `getStockLevels` and `getMovementHistory` actions, renders inventory-dashboard and movement-history components. Include page metadata (title: "Inventory")
- [ ] T016 [US1] Add inventory link to application sidebar/navigation — add "Inventory" nav item pointing to `/inventory` in the existing app navigation component (follow existing pattern from products/warehouses modules)

**Checkpoint**: Users can view stock levels and movement history. MVP is functional and testable.

---

## Phase 4: User Story 2 — Receive Stock (Priority: P2)

**Goal**: Allow users to record incoming stock for a product/variant at a specific warehouse

**Independent Test**: Open receive dialog → select product, warehouse, enter quantity → submit → verify stock increases by exact amount and movement log records the transaction

### Implementation for User Story 2

- [ ] T017 [US2] Add `receiveStock` method to InventoryService in `src/modules/inventory/application/services/inventory.service.ts` — validate params (quantity > 0), call repository `create()` with `movementType: "receive"`, `delta: +quantity`. Validate product/warehouse existence. Return created movement
- [ ] T018 [US2] Add `receiveStock` server action in `src/modules/inventory/presentation/actions/inventory.actions.ts` — form action with signature `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`. Use `createServerValidate` with Zod schema. Handle recoverable errors per contracts/server-actions.md (product/warehouse/variant not found). Revalidate `/inventory` on success
- [ ] T019 [P] [US2] Create TanStack Form options for receive form in `src/modules/inventory/presentation/lib/form-options.ts` — define `receiveStockFormOpts` using `formOptions()` with `defaultValues` for productId, productVariantId, warehouseId, quantity, notes. Follow existing pattern from products/warehouses modules
- [ ] T020 [US2] Create stock-receive-dialog component in `src/modules/inventory/presentation/components/stock-receive-dialog.tsx` — Dialog with form fields: product selector (from existing products), optional variant selector (filtered by selected product), warehouse selector (from existing warehouses), quantity (integer > 0), notes (optional textarea). Use TanStack Form with `receiveStockFormOpts` and `receiveStock` server action
- [ ] T021 [US2] Integrate receive dialog trigger into inventory dashboard — add "Receive Stock" button to `inventory-dashboard.tsx` that opens the stock-receive-dialog

**Checkpoint**: Users can view stock AND receive stock. Both stories work independently.

---

## Phase 5: User Story 3 — Dispatch Stock (Priority: P2)

**Goal**: Allow users to record outgoing stock from a warehouse, with warning when dispatch would cause negative stock

**Independent Test**: Open dispatch dialog → select product, warehouse, enter quantity → submit → verify stock decreases. When dispatching more than available: negative stock warning appears → confirm → stock goes negative

### Implementation for User Story 3

- [ ] T022 [US3] Add `dispatchStock` method to InventoryService in `src/modules/inventory/application/services/inventory.service.ts` — validate params (quantity > 0), check current stock via `getCurrentStock`. If resulting stock < 0 and `confirmNegative` is not true, return structured warning `NEGATIVE_STOCK_WARNING:{current}:{resulting}`. Otherwise call repository `create()` with `movementType: "dispatch"`, `delta: -quantity`. Per FR-004
- [ ] T023 [US3] Add `dispatchStock` server action in `src/modules/inventory/presentation/actions/inventory.actions.ts` — form action with negative stock warning flow per contracts/server-actions.md. If resulting stock < 0 and `confirmNegative !== "true"`, return `buildServerFormErrorState(formData, "NEGATIVE_STOCK_WARNING:{current}:{resulting}")`. On re-submit with `confirmNegative=true`, proceed. Revalidate `/inventory` on success
- [ ] T024 [P] [US3] Create negative-stock-warning component in `src/modules/inventory/presentation/components/negative-stock-warning.tsx` — AlertDialog that displays current stock, resulting stock after dispatch, and asks user to confirm. On confirm, re-submits the form with `confirmNegative=true`. Per FR-004
- [ ] T025 [US3] Add dispatch form options to `src/modules/inventory/presentation/lib/form-options.ts` — define `dispatchStockFormOpts` with `defaultValues` for productId, productVariantId, warehouseId, quantity, notes, confirmNegative
- [ ] T026 [US3] Create stock-dispatch-dialog component in `src/modules/inventory/presentation/components/stock-dispatch-dialog.tsx` — Dialog with form fields matching receive dialog, plus negative stock confirmation flow. Parse `NEGATIVE_STOCK_WARNING` error format from server action response to trigger negative-stock-warning component
- [ ] T027 [US3] Integrate dispatch dialog trigger into inventory dashboard — add "Dispatch Stock" button to `inventory-dashboard.tsx` that opens the stock-dispatch-dialog

**Checkpoint**: Users can view stock, receive stock, AND dispatch stock with negative stock warnings. All stories work independently.

---

## Phase 6: User Story 4 — Manual Stock Adjustment (Priority: P3)

**Goal**: Allow users to set stock to an absolute value for physical count corrections

**Independent Test**: Navigate to product at warehouse showing 20 units → adjust to 18 → verify stock is exactly 18 and movement log shows -2 adjustment

### Implementation for User Story 4

- [ ] T028 [US4] Add `adjustStock` method to InventoryService in `src/modules/inventory/application/services/inventory.service.ts` — get current stock via `getCurrentStock`, calculate delta = `newQuantity - currentStock`. If delta === 0, return "no change needed" error. Otherwise call repository `create()` with `movementType: "adjustment"`, `delta: calculated`. Per FR-005, SC-003
- [ ] T029 [US4] Add `adjustStock` server action in `src/modules/inventory/presentation/actions/inventory.actions.ts` — form action per contracts/server-actions.md. Handle "no change needed" as recoverable error. Revalidate `/inventory` on success
- [ ] T030 [US4] Add adjust form options to `src/modules/inventory/presentation/lib/form-options.ts` — define `adjustStockFormOpts` with `defaultValues` for productId, productVariantId, warehouseId, newQuantity (>= 0), notes
- [ ] T031 [US4] Create stock-adjust-dialog component in `src/modules/inventory/presentation/components/stock-adjust-dialog.tsx` — Dialog with product/variant/warehouse selectors and newQuantity field (integer >= 0). Display current stock for reference. Notes field recommended for adjustment reason. Achievable in < 5 clicks per SC-003
- [ ] T032 [US4] Integrate adjust dialog trigger into inventory dashboard — add "Adjust Stock" button to `inventory-dashboard.tsx` that opens the stock-adjust-dialog

**Checkpoint**: All 4 user stories are independently functional and testable.

---

## Phase 7: Edge Case — Transfer Stock Between Warehouses

**Goal**: Allow users to atomically move stock from one warehouse to another via a single action

**Independent Test**: Transfer 10 units from Warehouse A to Warehouse B → verify stock decreases by 10 at A and increases by 10 at B, with paired movements linked by reference_id

### Implementation for Transfer

- [ ] T033 Add `transferStock` method to InventoryService in `src/modules/inventory/application/services/inventory.service.ts` — validate source ≠ destination warehouse, check current stock at source (negative stock warning if applicable), generate `referenceId` (UUID v7), call repository `createTransferPair()` with dispatch movement (source, delta: -quantity) and receive movement (destination, delta: +quantity) within a single transaction. Per R2 (Kysely transactions)
- [ ] T034 Add `transferStock` server action in `src/modules/inventory/presentation/actions/inventory.actions.ts` — form action per contracts/server-actions.md with same-warehouse validation and negative stock warning flow. Revalidate `/inventory` on success
- [ ] T035 Add transfer form options to `src/modules/inventory/presentation/lib/form-options.ts` — define `transferStockFormOpts` with `defaultValues` for productId, productVariantId, sourceWarehouseId, destinationWarehouseId, quantity, notes, confirmNegative
- [ ] T036 Create stock-transfer-dialog component in `src/modules/inventory/presentation/components/stock-transfer-dialog.tsx` — Dialog with product/variant selector, source warehouse selector, destination warehouse selector (validated different from source), quantity, notes. Includes negative stock confirmation flow for source warehouse
- [ ] T037 Integrate transfer dialog trigger into inventory dashboard — add "Transfer Stock" button to `inventory-dashboard.tsx` that opens the stock-transfer-dialog

**Checkpoint**: All user stories + transfer edge case are complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verification, cleanup, and cross-cutting improvements

- [ ] T038 [P] Contract parity audit — verify all server actions match documented success + recoverable error behaviors in `contracts/server-actions.md` (CR-001, CR-002)
- [ ] T039 [P] Database integrity audit — verify all CHECK constraints, FK cascades, and indexes match `data-model.md` (DIR-001, DIR-002)
- [ ] T040 Code cleanup, lint check, and type verification — run `bun run lint`, verify strict TypeScript compliance, ensure no `any` types
- [ ] T041 Run quickstart.md validation — execute the end-to-end verification flow: navigate to `/inventory` → receive stock → verify dashboard → dispatch stock → test negative stock warning → adjust stock → verify final quantities

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — delivers MVP
- **US2 (Phase 4)**: Depends on Phase 2 + Phase 3 (needs dashboard for integration)
- **US3 (Phase 5)**: Depends on Phase 2 + Phase 3 (needs dashboard for integration)
- **US4 (Phase 6)**: Depends on Phase 2 + Phase 3 (needs dashboard for integration)
- **Transfer (Phase 7)**: Depends on Phase 2 + Phase 3 (needs dashboard for integration)
- **Polish (Phase 8)**: Depends on all previous phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories — **MVP**
- **User Story 2 (P2)**: Depends on US1 (dashboard must exist for dialog integration) — independently testable
- **User Story 3 (P2)**: Depends on US1 (dashboard must exist) — independently testable. Can run in parallel with US2
- **User Story 4 (P3)**: Depends on US1 (dashboard must exist) — independently testable. Can run in parallel with US2/US3
- **Transfer (Edge Case)**: Depends on US1 (dashboard must exist) — Can run in parallel with US2/US3/US4

### Within Each User Story

- Service method before server action (action calls service)
- Server action before component (component uses action)
- Form options can be created in parallel with service/action (different file)
- Dialog component before dashboard integration (component must exist before importing)

### Parallel Opportunities

- **Phase 2**: T004, T005, T006, T007 can all run in parallel (different files, no dependencies)
- **Phase 3**: T013, T014 can run in parallel (different component files)
- **Phase 4–7**: Once US1 dashboard exists, US2, US3, US4, and Transfer can be worked on in parallel by different developers (each touches different component files; shared files like service/actions are extended incrementally)
- **Phase 8**: T038, T039 can run in parallel (different audit scopes)

---

## Parallel Example: User Story 1

```bash
# After Phase 2 is complete, launch domain-consuming tasks:

# Sequential chain (each depends on previous):
Task T011: "Implement InventoryService read methods"
Task T012: "Implement read server actions"

# Then parallel component creation:
Task T013: "Create inventory-dashboard component"  # parallel
Task T014: "Create movement-history component"     # parallel

# Then page assembly:
Task T015: "Create inventory page"
Task T016: "Add inventory link to navigation"
```

---

## Parallel Example: User Stories 2–4 (after US1)

```bash
# US2, US3, US4 can run in parallel (different components, extend shared files):

# Developer A (US2):
Task T017 → T018 → T019(P) + T020 → T021

# Developer B (US3):
Task T022 → T023 → T024(P) + T025 + T026 → T027

# Developer C (US4):
Task T028 → T029 → T030 + T031 → T032
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T010) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T011–T016)
4. **STOP and VALIDATE**: Navigate to `/inventory`, verify stock levels display correctly
5. Deploy/demo if ready — users can view stock levels and movement history

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → View stock levels → Deploy/Demo (**MVP!**)
3. Add User Story 2 → Receive stock → Deploy/Demo
4. Add User Story 3 → Dispatch stock with warnings → Deploy/Demo
5. Add User Story 4 → Manual adjustments → Deploy/Demo
6. Add Transfer edge case → Complete feature → Deploy/Demo
7. Each story adds value without breaking previous stories

### Recommended Single-Developer Order

T001 → T002 → T003 → T004–T007 (parallel) → T008 → T009 → T010 → T011 → T012 → T013–T014 (parallel) → T015 → T016 → **[MVP CHECKPOINT]** → T017 → T018 → T019–T020 (parallel) → T021 → T022 → T023 → T024–T026 (parallel) → T027 → T028 → T029 → T030–T031 (parallel) → T032 → T033 → T034 → T035–T036 (parallel) → T037 → T038–T039 (parallel) → T040 → T041

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after US1 (dashboard) exists
- Stock movements are immutable — no update/delete tasks needed (FR-006)
- Negative stock is allowed with warning, not blocked (FR-004)
- Transfer = atomic dispatch + receive via Kysely transaction (R2)
- All queries scoped by `organization_id` for multi-tenancy (X)
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
