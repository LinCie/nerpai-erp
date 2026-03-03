# Feature Specification: Order Management

**Feature Branch**: `005-order-management`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Order module. With 7 status. Unpaid, paid, process, sent, completed, return, cancel. All manual. Paid is gated, must provide proof of payment of image before (Defer implementation but acknowledge). Must be in order from unpaid to completed"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create a New Order (Priority: P1)

As a staff member, I want to create a new order so that I can begin tracking a customer's purchase through the fulfillment pipeline.

**Why this priority**: Orders are the core entity of the module — nothing else can happen without the ability to create an order. A newly created order always starts in the "Unpaid" status.

**Independent Test**: Can be fully tested by navigating to the order creation form, filling in the required details (customer name, order items, quantities, total amount), submitting the form, and confirming the new order appears in the order list with an "Unpaid" status.

**Acceptance Scenarios**:

1. **Given** I am on the orders page, **When** I click "Create Order," enter a customer name, use the searchable product picker to select products/variants (which auto-populates name, SKU, and unit price), set quantities, **Then** the order is saved with status "Unpaid" and appears in the order list
2. **Given** I am creating an order, **When** I submit without required fields (e.g., no customer name or no items), **Then** I see validation errors and the order is not created
3. **Given** I am creating an order, **When** I add multiple line items with quantities and prices, **Then** the system calculates and displays the correct total amount

---

### User Story 2 - View Orders List (Priority: P1)

As a staff member, I want to see a list of all orders with their current status so that I can monitor the overall order pipeline and take action on orders that need attention.

**Why this priority**: Visibility into the order pipeline is essential for daily operations. Staff need to see which orders are at which stage to prioritize their work.

**Independent Test**: Can be fully tested by navigating to the orders page and verifying that all orders are displayed with their current status, customer name, total, and creation date.

**Acceptance Scenarios**:

1. **Given** orders exist in the system, **When** I navigate to the orders page, **Then** I see a table listing all orders with their status, customer name, total amount, and date
2. **Given** I have many orders, **When** I filter by status, **Then** only orders matching the selected status are shown
3. **Given** I have many orders, **When** I search by customer name, **Then** the list is filtered to matching results

---

### User Story 3 - Advance Order Through the Fulfillment Pipeline (Priority: P1)

As a staff member, I want to manually advance an order through each status stage (Unpaid → Paid → Process → Sent → Completed) so that the order accurately reflects its current state in the fulfillment workflow.

**Why this priority**: The sequential status progression is the defining behavior of the order module. Without it, orders have no meaningful lifecycle.

**Independent Test**: Can be fully tested by creating an order and manually advancing it through each status: Unpaid → Paid → Process → Sent → Completed, verifying at each step that the status is correctly updated and reflected in the order detail view.

**Acceptance Scenarios**:

1. **Given** an order is in "Unpaid" status, **When** I click to advance it to "Paid" and confirm in the confirmation dialog, **Then** the order status changes to "Paid" and the transition is logged with timestamp and user
2. **Given** an order is in "Paid" status, **When** I advance it to "Process," **Then** the order status changes to "Process"
3. **Given** an order is in "Process" status, **When** I advance it to "Sent," **Then** the order status changes to "Sent"
4. **Given** an order is in "Sent" status, **When** I advance it to "Completed," **Then** the order status changes to "Completed"
5. **Given** an order is in "Completed" status, **When** I view the order, **Then** there is no further forward advancement option — the order is finalized
6. **Given** an order is in "Unpaid" status, **When** I attempt to skip directly to "Process," **Then** the system prevents the transition and shows an error indicating the required order of statuses
7. **Given** an order is in "Unpaid" status and I am editing it, **When** I re-select a product in the product picker for an existing line item (e.g., because the product's price has changed since the order was created), **Then** the snapshotted product name, SKU, and unit price are refreshed from the current catalog data

---

### User Story 4 - Cancel an Order (Priority: P2)

As a staff member, I want to cancel an order so that orders that will not be fulfilled can be marked accordingly and excluded from the active pipeline.

**Why this priority**: Cancellation is a critical escape path from the main pipeline. Without it, abandoned or erroneous orders would clutter the active workflow.

**Independent Test**: Can be fully tested by selecting an eligible order and clicking "Cancel," confirming the action, and verifying the order status changes to "Cancelled" and it no longer appears as actionable in the main pipeline.

**Acceptance Scenarios**:

1. **Given** an order is in "Unpaid" status, **When** I click "Cancel" and confirm in the confirmation dialog, **Then** the order status changes to "Cancelled" and the transition is logged
2. **Given** an order is in "Paid" status, **When** I cancel it, **Then** the order status changes to "Cancelled" and the transition is logged
3. **Given** an order is in "Process" status, **When** I cancel it, **Then** the order status changes to "Cancelled" and the transition is logged
4. **Given** an order is in "Sent" or "Completed" status, **When** I attempt to cancel it, **Then** the system prevents the cancellation (orders already shipped or fulfilled cannot be cancelled — a return should be used instead)

---

### User Story 5 - Return an Order (Priority: P2)

As a staff member, I want to mark an order as returned so that the system tracks orders where the customer has returned the goods after shipment or completion.

**Why this priority**: Returns are an important post-fulfillment workflow. They need to be tracked separately from cancellations because goods were already shipped and may need to be re-stocked.

**Independent Test**: Can be fully tested by selecting an order in "Sent" or "Completed" status, initiating a return, and verifying the order status changes to "Return."

**Acceptance Scenarios**:

1. **Given** an order is in "Sent" status, **When** I mark it as returned, **Then** the order status changes to "Return" and the transition is logged
2. **Given** an order is in "Completed" status, **When** I mark it as returned, **Then** the order status changes to "Return" and the transition is logged
3. **Given** an order is in "Unpaid," "Paid," or "Process" status, **When** I attempt to return it, **Then** the system prevents the return (goods haven't been shipped yet)

---

### User Story 6 - View Order Detail & Status History (Priority: P2)

As a staff member, I want to view the full details of an order including its complete status history so that I can understand the order's journey and identify when and by whom each transition occurred.

**Why this priority**: Audit trail and visibility into order history are essential for accountability, customer service, and dispute resolution.

**Independent Test**: Can be fully tested by opening an order's detail page and verifying that all order information (customer, items, total, current status) and a chronological status history (with timestamps and user names) are displayed.

**Acceptance Scenarios**:

1. **Given** an order exists, **When** I click on it in the order list, **Then** I see the full order detail including customer name, line items, quantities, prices, total amount, and a visual stepper/progress bar showing the order's current position in the pipeline (Unpaid → Paid → Process → Sent → Completed) with completed steps visually distinct from upcoming ones. If the order is in a terminal state (Cancelled or Return), a separate status badge is shown instead of the stepper.
2. **Given** an order has undergone multiple status transitions, **When** I view its detail page, **Then** I see a chronological history showing each status change with timestamp and the name of the user who performed it

---

### User Story 7 - Proof of Payment Gate for "Paid" Status (Priority: P3 — Deferred Implementation)

As a staff member, I want the system to require proof of payment (an uploaded image) before an order can be advanced from "Unpaid" to "Paid" so that we have documentation that payment was actually received.

**Why this priority**: This is an important business control, but the image upload mechanism is deferred to a later phase. The specification acknowledges this requirement so that the data model and workflow can accommodate it in the future. For the initial implementation, the transition to "Paid" is allowed without proof of payment, with a placeholder in the UI indicating that proof of payment will be required in a future update.

**Independent Test**: (Deferred) When implemented, can be tested by attempting to advance an order to "Paid" without uploading an image — the system should block the transition and display a message requesting the payment proof image.

**Acceptance Scenarios**:

1. _(Deferred)_ **Given** an order is in "Unpaid" status, **When** I attempt to advance to "Paid" without uploading a payment proof image, **Then** the system blocks the transition and displays a message requesting the image
2. _(Deferred)_ **Given** an order is in "Unpaid" status, **When** I upload a valid payment proof image and advance to "Paid," **Then** the order status changes to "Paid" and the uploaded image is stored and viewable from the order detail
3. _(Current phase)_ **Given** an order is in "Unpaid" status, **When** I advance to "Paid," **Then** the transition is allowed (no image required), but the UI displays a notice that proof of payment will be required in a future update

---

### Edge Cases

- What happens if a staff member tries to advance an order that has already been cancelled? → The system prevents any status changes on cancelled orders; "Cancelled" is a terminal state.
- What happens if a staff member tries to advance an order that has been returned? → The system prevents any status changes on returned orders; "Return" is a terminal state.
- What happens when there is a very large number of orders in the list? → Pagination ensures performance remains acceptable.
- How does the system handle concurrent status changes by two users on the same order? → First-write-wins with optimistic locking; if the status has changed since the page was loaded, the second user is notified to refresh and retry.
- What happens if an order has zero line items? → The system requires at least one line item to create an order.
- What happens if a staff member tries to edit an order that is no longer in "Unpaid" status? → The system prevents edits; only "Unpaid" orders can be modified. Staff must cancel and recreate the order if corrections are needed after advancing.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow staff to create a new order with customer name and line items, using a searchable product/variant picker that auto-populates product name, SKU, and unit price upon selection. Staff sets only the quantity; the total amount is calculated automatically. New orders always start with "Unpaid" status. Each line item MUST snapshot the product name, SKU, and unit price at creation time so that the order record is self-contained and immune to future product edits or deletions.
- **FR-002**: System MUST enforce a strict sequential status progression for the main fulfillment pipeline: Unpaid → Paid → Process → Sent → Completed. Skipping statuses is not allowed.
- **FR-003**: System MUST allow staff to manually trigger each status transition. All transitions are user-initiated (no automatic transitions).
- **FR-004**: System MUST allow staff to cancel an order from "Unpaid," "Paid," or "Process" statuses only. Cancellation is not permitted once an order reaches "Sent" or "Completed."
- **FR-005**: System MUST allow staff to mark an order as returned from "Sent" or "Completed" statuses only. Return is not permitted for orders that have not yet been shipped.
- **FR-006**: Both "Cancelled" and "Return" are terminal states — no further status transitions are allowed once an order reaches either state.
- **FR-007**: System MUST display a list of all orders with filtering by status and search by customer name.
- **FR-008**: System MUST display a detail view for each order showing customer information, line items, total, current status, and a chronological status history (with timestamps and user attribution).
- **FR-009**: System MUST log every status transition with: previous status, new status, timestamp, and the user who performed the transition.
- **FR-010**: System MUST enforce organization isolation — orders are scoped to the user's organization and users cannot view or modify orders from other organizations.
- **FR-011**: _(Deferred — acknowledged for future implementation)_ System MUST require a proof-of-payment image upload before transitioning an order from "Unpaid" to "Paid." The data model should accommodate a payment proof image reference. For the initial release, the transition is allowed without the image, but the UI should indicate this requirement is pending.
- **FR-012**: Each order MUST have at least one line item. Orders with zero items cannot be created.
- **FR-013**: System MUST support pagination for the orders list to handle large volumes.
- **FR-014**: System MUST allow staff to edit an order (modify customer name, add/remove/update line items and quantities) ONLY while the order is in "Unpaid" status. Once the order is advanced to "Paid" or any subsequent status, the order is locked and cannot be edited. Snapshotted product data is refreshed from the catalog when a line item is re-selected during editing.
- **FR-015**: System MUST display a confirmation dialog before applying any status transition. The dialog MUST clearly state the target status (e.g., "Are you sure you want to advance this order to Paid?"). The transition is only applied after the user confirms.
- **FR-016**: The order detail page MUST display a visual stepper/progress bar showing the full main pipeline (Unpaid → Paid → Process → Sent → Completed) with the current status highlighted and completed steps visually distinct. For orders in terminal states (Cancelled, Return), a status badge is displayed instead of the stepper.

### Contract & Integrity Requirements _(mandatory when applicable)_

- **CR-001**: Server Actions/APIs MUST define explicit success and recoverable error behaviors (validation errors, forbidden transitions, not found) in contracts.
- **CR-002**: Implementation MUST match documented contract shapes for all exposed mutation/read operations.
- **DIR-001**: The valid status transitions MUST be enforced at the application layer with a clearly defined state machine. Database CHECK constraints MUST ensure the status column only contains valid status values.
- **DIR-002**: Organization isolation MUST be enforced at the database query layer (all queries filtered by `organization_id`).
- **DIR-003**: Status history records MUST be immutable — once created, they cannot be modified or deleted.

### Key Entities

- **Order**: Represents a customer order being tracked through the fulfillment pipeline
  - Core attributes: customer name, total amount, current status, organization reference
  - System attributes: id, organization_id, created_at, updated_at
  - Statuses: `unpaid`, `paid`, `process`, `sent`, `completed`, `return`, `cancelled`

- **Order Item (Line Item)**: Represents an individual product/variant entry within an order
  - Snapshotted attributes: product name, SKU, unit price (copied from the product/variant at order creation time; immutable once set)
  - Core attributes: product/variant reference (FK, nullable — retained for traceability but not relied upon for display), quantity, subtotal (quantity × unit price)
  - Relationship: belongs to an Order (many-to-one)

- **Order Status History**: An immutable audit log of every status transition for an order
  - Core attributes: previous status, new status, timestamp, user who performed the transition
  - Relationship: belongs to an Order (many-to-one)

- **Payment Proof** _(Deferred)_: An image file uploaded as evidence of payment
  - Core attributes: file reference/path, upload timestamp, uploader reference
  - Relationship: belongs to an Order (one-to-one or one-to-many)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The order creation server action completes in under 2 seconds. The end-to-end UX goal is that a staff member can create a new order (fill form + submit) in under 60 seconds
- **SC-002**: The orders list server query returns results (server response time) within 2 seconds for up to 5,000 orders
- **SC-003**: Staff can filter the order list by any single status in under 1 second
- **SC-004**: Staff can advance an order to the next status in under 3 clicks from the order detail view
- **SC-005**: 100% of status transitions are logged with correct user, timestamp, and status values
- **SC-006**: 100% of orders are correctly isolated by organization (no cross-organization data leakage)
- **SC-007**: The system correctly prevents 100% of invalid status transitions (e.g., skipping steps, transitioning from terminal states)

## Assumptions

- All authenticated organization members have permission to create, view, and manage orders (no role-based access control for this phase)
- Order items reference existing products/variants from the product module but do not automatically deduct inventory (inventory integration is out of scope for this phase)
- Customer information is a simple text field (customer name) — a separate customer/contact module is not in scope
- Currency and pricing are simple numeric values with no multi-currency support
- The proof-of-payment image upload feature is explicitly deferred; the current implementation allows the Unpaid → Paid transition without an image, but the data model reserves space for it
- Order totals are calculated from line item subtotals (quantity × unit price) and do not include tax, discounts, or shipping calculations at this stage
- Soft delete is NOT used for orders — cancellation is the mechanism for removing orders from the active pipeline. Orders are never physically deleted.

## Status Transition Diagram

```
                    ┌─────────────────────────────────────────┐
                    │          MAIN PIPELINE (sequential)     │
                    │                                         │
                    │  Unpaid → Paid → Process → Sent → Completed
                    │                                         │
                    └─────────────────────────────────────────┘
                              │                    │        │
                              │ (from Unpaid,      │ (from  │
                              │  Paid, Process)    │ Sent,  │
                              ▼                    │ Completed)
                          Cancelled                ▼
                          (terminal)            Return
                                               (terminal)
```

**Transition Rules Summary:**

| From Status | Allowed Transitions |
| ----------- | ------------------- |
| Unpaid      | Paid, Cancelled     |
| Paid        | Process, Cancelled  |
| Process     | Sent, Cancelled     |
| Sent        | Completed, Return   |
| Completed   | Return              |
| Return      | _(none — terminal)_ |
| Cancelled   | _(none — terminal)_ |

## Clarifications

### Session 2026-03-03

- Q: Should order line items snapshot product data (name, SKU, price) at creation time, or reference current product data via FK? → A: Snapshot. Copy product name, SKU, and unit price into the order item at creation time. The order item becomes self-contained and immune to future product edits/deletions. FK retained for traceability only.
- Q: How should product selection work when creating order line items? → A: Searchable product picker. Staff search/select from existing products & variants via a combobox; product name, SKU, and unit price auto-populate. Staff can adjust quantity only (no manual price override).
- Q: Can an order be edited after creation, or is it immutable once saved? → A: Editable while "Unpaid" only. Staff can edit customer name and modify line items (add/remove/change quantity) while the order is in "Unpaid" status. Once advanced to "Paid" or beyond, the order is locked.
- Q: Should status transitions require a confirmation step or apply immediately? → A: Confirm all transitions. Every status transition shows a confirmation dialog before applying, for both forward pipeline advances and destructive actions (Cancel, Return).
- Q: Should the order detail page show status as a visual stepper or a simple badge? → A: Visual stepper/progress bar showing the full pipeline with current status highlighted. Completed steps visually distinct from upcoming. Terminal states (Cancelled, Return) shown as a separate badge instead.

## Future Extensions (Out of Scope)

The following are explicitly NOT part of this implementation but should be considered in the design:

- Proof-of-payment image upload and gating (acknowledged, deferred)
- Inventory deduction upon order dispatch/completion
- Customer/contact module integration
- Tax, discount, and shipping calculations
- Payment method tracking
- Order numbering/reference codes (beyond system-generated IDs)
- Bulk order operations
- Order printing / invoice generation
- Notifications (email/SMS) on status changes
- Role-based permissions for order management
- Multi-currency support
