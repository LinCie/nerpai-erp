# Tasks: Order Management Module

**Input**: Design documents from `/specs/005-order-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/server-actions.md ✅, quickstart.md ✅

**Tests**: Not requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migrations, module directory structure, and shared type generation

- [X] T001 Create the orders module directory structure: `mkdir -p src/modules/orders/{domain/{entities,types},application/{repositories,services,types},infrastructure/repositories,presentation/{actions,components,schemas,lib,types}}`
- [X] T002 Create database migration for pg_trgm extension via `bun db:migrate:create enable_pg_trgm_extension` — copy SQL from data-model.md Migration 1 (idempotent `CREATE EXTENSION IF NOT EXISTS pg_trgm`)
- [X] T003 Create database migration for order tables via `bun db:migrate:create create_order_tables` — copy SQL from data-model.md Migration 2 (creates `order`, `order_item`, `order_status_history` tables with all CHECK constraints, FK constraints, and indexes)
- [X] T004 Run database migrations via `bun db:migrate` and regenerate database types via `bun db:codegen` to update `src/shared/infrastructure/persistence/types.ts` with Order, OrderItem, and OrderStatusHistory table types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain types, entity interfaces, repository interfaces, and application DTOs that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Define `OrderStatus` type, `PIPELINE_STATUSES`, `TERMINAL_STATUSES`, `ORDER_STATUS_TRANSITIONS` map, `canTransition()`, `isTerminalStatus()`, and `ORDER_STATUS_LABELS` in `src/modules/orders/domain/types/index.ts` — per data-model.md Domain Types section and research.md R1
- [X] T006 [P] Define `Order` entity interface in `src/modules/orders/domain/entities/order.ts` — per data-model.md Order Entity TypeScript section
- [X] T007 [P] Define `OrderItem` entity interface in `src/modules/orders/domain/entities/order-item.ts` — per data-model.md Order Item Entity TypeScript section
- [X] T008 [P] Define `OrderStatusHistory` entity interface in `src/modules/orders/domain/entities/order-status-history.ts` — per data-model.md Order Status History Entity TypeScript section
- [X] T009 [P] Define application-layer DTOs (`CreateOrderParams`, `CreateOrderItemParams`, `UpdateOrderParams`, `TransitionOrderStatusParams`, `GetOrdersParams`, `GetOrderDetailParams`, `OrderListItem`, `OrderDetail`, `OrderStatusHistoryEntry`, `ProductPickerItem`) in `src/modules/orders/application/types/index.ts` — per data-model.md Application Layer DTOs section
- [X] T010 [P] Define `IOrderRepository` interface in `src/modules/orders/application/repositories/order.repository.interface.ts` — methods: `create`, `updateCustomerAndItems`, `updateStatusWithLock`, `findById`, `findList`, `countList`
- [X] T011 [P] Define `IOrderItemRepository` interface in `src/modules/orders/application/repositories/order-item.repository.interface.ts` — methods: `createMany`, `deleteByOrderId`, `findByOrderId`
- [X] T012 [P] Define `IOrderStatusHistoryRepository` interface in `src/modules/orders/application/repositories/order-status-history.repository.interface.ts` — methods: `create`, `findByOrderId`
- [X] T013 Define Zod validation schemas (`createOrderSchema`, `updateOrderSchema`, `orderItemSchema`, `transitionOrderStatusSchema`) in `src/modules/orders/presentation/schemas/order.schema.ts` — per data-model.md Validation Rules and contracts/server-actions.md input field specs. Note: `transitionOrderStatusSchema` validates the direct server action input (orderId, newStatus, version) — it is NOT a FormData schema since `transitionOrderStatus` is called via button click, not form submission
- [X] T014 Define presentation-layer types in `src/modules/orders/presentation/types/index.ts` — form state types for order form dialog, product picker result types

**Checkpoint**: Foundation ready — all domain types, entity interfaces, repository interfaces, DTOs, and schemas are defined. User story implementation can now begin.

---

## Phase 3: User Story 1 — Create a New Order (Priority: P1) 🎯 MVP

**Goal**: Staff can create a new order with customer name and line items via a searchable product picker. The order starts with "Unpaid" status and an initial status history entry.

**Independent Test**: Navigate to orders page → click "Create Order" → fill customer name → search/select products via picker → set quantities → submit → verify order appears in list with "Unpaid" status.

### Implementation for User Story 1

- [X] T015 [US1] Implement `OrderRepository` (Kysely) in `src/modules/orders/infrastructure/repositories/order.repository.ts` — `create` method: INSERT order within transaction, return created order. Include `organization_id` scoping on all queries. Per research.md R2 (optimistic locking) and R7 (Kysely transactions)
- [X] T016 [US1] Implement `OrderItemRepository` (Kysely) in `src/modules/orders/infrastructure/repositories/order-item.repository.ts` — `createMany` method: batch INSERT order items with snapshotted product data. `deleteByOrderId` and `findByOrderId` methods. Per research.md R3 (snapshotted data)
- [X] T017 [US1] Implement `OrderStatusHistoryRepository` (Kysely) in `src/modules/orders/infrastructure/repositories/order-status-history.repository.ts` — `create` method: INSERT history entry (initial creation: previousStatus=NULL, newStatus="unpaid"). `findByOrderId` ordered by created_at ASC
- [X] T018 [US1] Implement `OrderService.createOrder()` in `src/modules/orders/application/services/order.service.ts` — business logic: validate input, calculate total_amount from items (quantity × unitPrice), within DB transaction: insert order → insert order_items → insert initial status history entry. Per research.md R7 (Kysely transactions)
- [X] T019 [US1] Implement `searchProducts` read action in `src/modules/orders/presentation/actions/order.actions.ts` — search across product and product_variant tables, return `ProductPickerItem[]`. Per contracts/server-actions.md `searchProducts` contract
- [X] T020 [US1] Implement `createOrder` server action in `src/modules/orders/presentation/actions/order.actions.ts` — TanStack Form `createServerValidate` with `createOrderSchema`, call `OrderService.createOrder()`, revalidate `/orders`. Per contracts/server-actions.md `createOrder` contract
- [X] T021 [US1] Create `ProductPicker` component in `src/modules/orders/presentation/components/product-picker.tsx` — shadcn Combobox (Popover + Command) with debounced server-side search, auto-populate productName/sku/unitPrice on selection. Per research.md R4
- [X] T022 [US1] Create `OrderLineItems` component in `src/modules/orders/presentation/components/order-line-items.tsx` — TanStack Form array fields for dynamic line items (add/remove), product picker per row, quantity input, auto-calculated subtotal display. Per research.md R6
- [X] T023 [US1] Define TanStack Form options in `src/modules/orders/presentation/lib/form-options.ts` — `createOrderFormOptions` and `updateOrderFormOptions` with default values and validators
- [X] T024 [US1] Create `OrderFormDialog` component in `src/modules/orders/presentation/components/order-form-dialog.tsx` — shadcn Dialog with TanStack Form, customer name input, OrderLineItems component, total amount display, submit handler. Per plan.md component structure

**Checkpoint**: User Story 1 complete — staff can create orders with product picker, line items, and auto-calculated totals. Orders start as "Unpaid".

---

## Phase 4: User Story 2 — View Orders List (Priority: P1)

**Goal**: Staff can see a paginated table of all orders with status filtering and customer name search.

**Independent Test**: Navigate to `/orders` → verify table shows all orders with status, customer name, total, date → filter by status → search by customer name → verify pagination.

### Implementation for User Story 2

- [X] T025 [US2] Add `findList` and `countList` methods to `OrderRepository` in `src/modules/orders/infrastructure/repositories/order.repository.ts` — query with optional status filter, customer name ILIKE search (pg_trgm), LEFT JOIN user for createdByName, LEFT JOIN order_item for itemCount aggregation, LIMIT/OFFSET pagination. Per data-model.md Query Optimization Notes
- [X] T026 [US2] Implement `OrderService.getOrders()` in `src/modules/orders/application/services/order.service.ts` — call repository.findList and repository.countList, return `{ data: OrderListItem[], total: number }`
- [X] T027 [US2] Implement `getOrders` read action in `src/modules/orders/presentation/actions/order.actions.ts` — per contracts/server-actions.md `getOrders` contract, call OrderService.getOrders with session organizationId
- [X] T028 [US2] Create `OrderStatusBadge` component in `src/modules/orders/presentation/components/order-status-badge.tsx` — shadcn Badge with color variants per status (e.g., blue for unpaid, green for paid/completed, yellow for process, red for cancelled, orange for return)
- [X] T029 [US2] Create `OrderList` component in `src/modules/orders/presentation/components/order-list.tsx` — shadcn Table with columns (customer name, status badge, total, item count, created date, actions), status filter dropdown, customer name search input, shadcn Pagination. Per plan.md component structure
- [X] T030 [US2] Create orders list page in `src/app/(app)/orders/page.tsx` — Server Component that calls `getOrders` read action, renders `OrderList` with data, includes "Create Order" button that opens `OrderFormDialog`

**Checkpoint**: User Stories 1 AND 2 complete — staff can create orders and view them in a filterable, searchable, paginated list.

---

## Phase 5: User Story 3 — Advance Order Through Fulfillment Pipeline (Priority: P1)

**Goal**: Staff can manually advance an order through each status stage (Unpaid → Paid → Process → Sent → Completed) with confirmation dialogs and audit logging.

**Independent Test**: Create an order → advance from Unpaid → Paid → Process → Sent → Completed, confirming at each step → verify status updates correctly → verify attempting to skip a status is prevented.

### Implementation for User Story 3

- [X] T031 [US3] Add `updateStatusWithLock` method to `OrderRepository` in `src/modules/orders/infrastructure/repositories/order.repository.ts` — UPDATE order SET status, version+1, updated_at WHERE id AND version (optimistic locking), within transaction: also INSERT order_status_history. Per research.md R2
- [X] T032 [US3] Implement `OrderService.transitionOrderStatus()` in `src/modules/orders/application/services/order.service.ts` — validate transition via `canTransition()`, check terminal status via `isTerminalStatus()`, call repository.updateStatusWithLock, handle concurrency error
- [X] T033 [US3] Implement `transitionOrderStatus` server action in `src/modules/orders/presentation/actions/order.actions.ts` — per contracts/server-actions.md `transitionOrderStatus` contract, validate input, call service, revalidate paths
- [X] T034 [US3] Create `OrderStatusActions` component in `src/modules/orders/presentation/components/order-status-actions.tsx` — renders "Advance to {next status}" button based on current status and transition map, shadcn AlertDialog for confirmation ("Are you sure you want to advance this order to {status}?"), calls `transitionOrderStatus` on confirm. Per FR-015

**Checkpoint**: User Stories 1, 2, AND 3 complete — staff can create orders, view them, and advance through the full pipeline.

---

## Phase 6: User Story 4 — Cancel an Order (Priority: P2)

**Goal**: Staff can cancel an order from Unpaid, Paid, or Process statuses. Cancelled is a terminal state.

**Independent Test**: Create an order → cancel from Unpaid status → verify status changes to "Cancelled" → verify no further actions available → create another order, advance to Paid, cancel → verify. Try cancelling from Sent/Completed → verify blocked.

### Implementation for User Story 4

- [X] T035 [US4] Add "Cancel" button to `OrderStatusActions` component in `src/modules/orders/presentation/components/order-status-actions.tsx` — show "Cancel" button when `canTransition(currentStatus, 'cancelled')` is true, shadcn AlertDialog for confirmation with destructive styling, calls `transitionOrderStatus` with newStatus="cancelled"

**Checkpoint**: US-4 complete — cancellation works from eligible statuses, blocked from Sent/Completed.

---

## Phase 7: User Story 5 — Return an Order (Priority: P2)

**Goal**: Staff can mark an order as returned from Sent or Completed statuses. Return is a terminal state.

**Independent Test**: Create an order, advance to Sent → mark as returned → verify status changes to "Return" → verify no further actions. Try returning from Unpaid/Paid/Process → verify blocked.

### Implementation for User Story 5

- [X] T036 [US5] Add "Return" button to `OrderStatusActions` component in `src/modules/orders/presentation/components/order-status-actions.tsx` — show "Return" button when `canTransition(currentStatus, 'return')` is true, shadcn AlertDialog for confirmation with warning styling, calls `transitionOrderStatus` with newStatus="return"

**Checkpoint**: US-5 complete — returns work from Sent/Completed, blocked from earlier statuses.

---

## Phase 8: User Story 6 — View Order Detail & Status History (Priority: P2)

**Goal**: Staff can view full order details (customer, items, total, status) with a visual stepper showing pipeline position and a chronological status history log.

**Independent Test**: Open an order's detail page → verify customer info, line items, total, status stepper, and complete status history with timestamps and user names.

### Implementation for User Story 6

- [ ] T037 [US6] Add `findById` method to `OrderRepository` in `src/modules/orders/infrastructure/repositories/order.repository.ts` — query order with JOIN user for createdByName, scoped by organization_id
- [ ] T038 [US6] Implement `OrderService.getOrderDetail()` in `src/modules/orders/application/services/order.service.ts` — fetch order, items, and status history; assemble `OrderDetail` DTO. Per data-model.md Query Optimization Notes
- [ ] T039 [US6] Implement `getOrderDetail` read action in `src/modules/orders/presentation/actions/order.actions.ts` — per contracts/server-actions.md `getOrderDetail` contract
- [ ] T040 [P] [US6] Create `OrderStatusStepper` component in `src/modules/orders/presentation/components/order-status-stepper.tsx` — custom stepper with horizontal flex layout, circle indicators for each pipeline step (Unpaid → Paid → Process → Sent → Completed), connecting lines, color coding (completed=green, current=blue, upcoming=gray). For terminal states (Cancelled/Return), render `OrderStatusBadge` instead. Per research.md R5 and FR-016
- [ ] T041 [P] [US6] Create `OrderStatusHistory` component in `src/modules/orders/presentation/components/order-status-history.tsx` — chronological list of status transitions showing previous→new status, timestamp, and user name. Per FR-008/FR-009
- [ ] T042 [US6] Create `OrderDetail` component in `src/modules/orders/presentation/components/order-detail.tsx` — Card layout: customer name, OrderStatusStepper (or badge), line items table (product name, SKU, unit price, quantity, subtotal), total amount, OrderStatusActions, OrderStatusHistory. Per plan.md component structure
- [ ] T043 [US6] Create order detail page in `src/app/(app)/orders/[id]/page.tsx` — Server Component that calls `getOrderDetail`, renders `OrderDetail`. Show 404 if order not found

**Checkpoint**: US-6 complete — full order detail view with visual stepper and audit trail.

---

## Phase 9: User Story 3 (Continued) — Edit Unpaid Orders (Priority: P1)

**Goal**: Staff can edit an order (customer name, line items) while it is in "Unpaid" status. Locked once advanced.

**Independent Test**: Create an order → edit customer name and line items → save → verify changes. Advance to Paid → verify edit is blocked.

### Implementation for User Story 3 (Edit)

- [ ] T044 [US3] Add `updateCustomerAndItems` method to `OrderRepository` in `src/modules/orders/infrastructure/repositories/order.repository.ts` — within transaction: check status="unpaid" and version match, UPDATE order (customer_name, total_amount, version+1), DELETE existing order_items, INSERT new order_items. Per FR-014 and research.md R2
- [ ] T045 [US3] Implement `OrderService.updateOrder()` in `src/modules/orders/application/services/order.service.ts` — validate status is "unpaid", calculate new total, call repository.updateCustomerAndItems
- [ ] T046 [US3] Implement `updateOrder` server action in `src/modules/orders/presentation/actions/order.actions.ts` — per contracts/server-actions.md `updateOrder` contract
- [ ] T047 [US3] Update `OrderFormDialog` component in `src/modules/orders/presentation/components/order-form-dialog.tsx` — support edit mode: pre-populate form with existing order data, use `updateOrderFormOptions`, call `updateOrder` action. Show edit button only when order status is "unpaid". Per FR-014

**Checkpoint**: US-3 (edit) complete — orders can be edited while unpaid, locked after advancement.

---

## Phase 10: User Story 7 — Proof of Payment Gate (Priority: P3 — Deferred)

**Goal**: Acknowledge the deferred proof-of-payment requirement with a UI placeholder.

**Independent Test**: Advance an order from Unpaid → Paid → verify the transition succeeds without image upload → verify a notice is displayed indicating proof of payment will be required in a future update.

### Implementation for User Story 7

- [ ] T048 [US7] Add a deferred payment proof notice to the advance-to-Paid confirmation dialog in `src/modules/orders/presentation/components/order-status-actions.tsx` — when transitioning to "paid", include a notice: "Note: Proof of payment will be required in a future update." The transition is allowed without an image. Per spec US-7 acceptance scenario 3

**Checkpoint**: US-7 complete — deferred feature is acknowledged in the UI.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, validation, and cleanup

- [ ] T049 [P] Wire up navigation link to `/orders` in the application sidebar/nav in the appropriate layout file (e.g., `src/app/(app)/layout.tsx` or shared nav component)
- [ ] T050 [P] Add loading states (shadcn Skeleton) to `OrderList` and `OrderDetail` components for Suspense boundaries
- [ ] T051 Code review: verify all server actions match contracts/server-actions.md signatures and error behaviors exactly (CR-001, CR-002)
- [ ] T052 Contract parity audit — verify spec/contracts vs implementation behavior for all 6 server actions (createOrder, updateOrder, transitionOrderStatus, getOrders, getOrderDetail, searchProducts)
- [ ] T053 Verify all queries filter by `organization_id` from session (DIR-002, multi-tenancy audit)
- [ ] T054 Verify status transitions enforce state machine rules — test all valid and invalid transitions against `ORDER_STATUS_TRANSITIONS` map (DIR-001)
- [ ] T055 Verify optimistic locking works correctly — test concurrent modification detection and error message
- [ ] T056 Run `bun run lint` to ensure no lint errors across all new files
- [ ] T057 Run quickstart.md validation — follow all 10 verification steps from quickstart.md to confirm end-to-end flow. During validation, also verify success criteria SC-001 through SC-004: order creation completes in \<2s (SC-001), orders list loads in \<2s (SC-002), status filter responds in \<1s (SC-003), and status advancement is achievable in \<3 clicks (SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (database types must be generated) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — creates core infrastructure (repositories, service, actions)
- **User Story 2 (Phase 4)**: Depends on Phase 2 for types, benefits from Phase 3 repositories being started
- **User Story 3 (Phase 5)**: Depends on Phase 2 for types, Phase 3 for repository and service base
- **User Story 4 (Phase 6)**: Depends on Phase 5 (OrderStatusActions component exists)
- **User Story 5 (Phase 7)**: Depends on Phase 5 (OrderStatusActions component exists)
- **User Story 6 (Phase 8)**: Depends on Phase 2 for types, Phase 3 for repositories, Phase 5 for OrderStatusActions
- **User Story 3 Edit (Phase 9)**: Depends on Phase 3 (OrderFormDialog exists), Phase 5 (status transition exists)
- **User Story 7 (Phase 10)**: Depends on Phase 5 (advance dialog exists)
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US-1 (Phase 3)**: Independent after Phase 2 — creates the core repositories and service
- **US-2 (Phase 4)**: Largely independent after Phase 2 — adds read methods to repositories created in US-1
- **US-3 (Phase 5)**: Adds transition logic to the service and repository created in US-1
- **US-4 (Phase 6)**: Extends OrderStatusActions from US-3 — minimal addition
- **US-5 (Phase 7)**: Extends OrderStatusActions from US-3 — minimal addition
- **US-6 (Phase 8)**: Independent detail view — uses repositories from US-1/US-3
- **US-3 Edit (Phase 9)**: Extends OrderFormDialog from US-1 with edit mode
- **US-7 (Phase 10)**: Minimal — adds notice text to existing dialog

### Within Each User Story

- Repository implementations before service methods
- Service methods before server actions
- Server actions before UI components
- Schemas and types available from Phase 2
- Components can be developed in parallel when they don't share the same file

### Parallel Opportunities

**Phase 2** (all [P] tasks):

```
T005, T006, T007, T008, T009, T010, T011, T012 — all different files, no dependencies
```

**Phase 3** (after repositories):

```
T021 (ProductPicker), T022 (OrderLineItems), T023 (form-options) — parallel component development
```

**Phase 4** (within US-2):

```
T028 (OrderStatusBadge) — independent component, can be built in parallel with T025-T027
```

**Phase 8** (within US-6):

```
T040 (OrderStatusStepper), T041 (OrderStatusHistory) — independent components, parallel
```

**Cross-story parallelism**: After Phase 2, US-1 and US-2 can start in parallel (different files). US-4 and US-5 are independent of each other. US-6 stepper/history components are independent.

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup (migrations, directory structure)
2. Complete Phase 2: Foundational (domain types, interfaces, schemas)
3. Complete Phase 3: US-1 — Create Order (repositories, service, actions, form)
4. Complete Phase 4: US-2 — View Orders List (list page with filters)
5. Complete Phase 5: US-3 — Advance Pipeline (status transitions)
6. **STOP and VALIDATE**: Test the core flow end-to-end
7. Deploy/demo if ready — this is a functional MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US-1 (Create) + US-2 (List) → Functional order management (MVP!)
3. Add US-3 (Advance) → Full pipeline transitions
4. Add US-4 (Cancel) + US-5 (Return) → Terminal state branches
5. Add US-6 (Detail + History) → Full audit visibility
6. Add US-3 Edit → Edit unpaid orders
7. Add US-7 (Payment notice) → Deferred acknowledgment
8. Polish → Final validation and cleanup

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US-1 (Create Order) → US-3 (Advance) → US-4/US-5 (Cancel/Return)
   - Developer B: US-2 (List Page) → US-6 (Detail Page) → US-7 (Payment Notice)
3. Stories integrate via shared repositories and server actions

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All server actions follow the contracts in `contracts/server-actions.md`
- All entity types follow the data-model.md TypeScript sections
- All `order` table queries must include `organization_id` filtering and `deleted_at IS NULL` checks. Child tables (`order_item`, `order_status_history`) inherit organization scope through their parent order FK and do not have their own `organization_id` column.
- Optimistic locking via `version` column on all mutations (R2)
- Product data is snapshotted on order items — never rely on FK for display (R3)
- **Soft Delete deviation**: `softDelete()` and `restore()` methods are intentionally omitted for all 3 repositories per the documented deviation in plan.md Complexity Tracking. Orders use status-based lifecycle (Cancelled/Return); status history records are immutable. The `deleted_at` columns exist for Constitution IX schema compliance only.
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
