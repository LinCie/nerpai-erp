# Feature Specification: Simple Inventory Module

**Feature Branch**: `004-simple-inventory`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "Simple inventory module for stock utilizing existing product, product variants, and warehouse location module"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Global Stock Levels (Priority: P1)

As an inventory manager, I want to view the current stock levels of all products and their variants across all warehouse locations, so I know exactly what inventory we have on hand.

**Why this priority**: Core function of an inventory module; cannot manage stock without visibility into current quantities across locations.

**Independent Test**: Can be fully tested by viewing the inventory listing interface and verifying it accurately lists products, their variants, and current aggregated or location-specific stock quantities using the existing modules.

**Acceptance Scenarios**:

1. **Given** there is existing stock for products and variants in multiple warehouses, **When** I navigate to the inventory dashboard, **Then** I should see a list of products/variants with their current quantity broken down by warehouse.
2. **Given** a product has no stock in any warehouse, **When** I view the inventory dashboard, **Then** the product should display a stock quantity of 0.

---

### User Story 2 - Receive Stock (Priority: P2)

As a warehouse worker, I want to record receiving new stock for a specific product/variant at my warehouse location, so that the system reflects incoming deliveries.

**Why this priority**: Essential for increasing inventory levels as new shipments arrive.

**Independent Test**: Can be fully tested by submitting a stock addition form with a positive quantity and verifying the stock level increases for the correct item at the designated warehouse location.

**Acceptance Scenarios**:

1. **Given** I receive a shipment of 50 units of Product A at Warehouse X, **When** I log a "Receive Stock" action for 50 units, **Then** the current stock for Product A at Warehouse X increases by exactly 50 units.
2. **Given** I am receiving stock, **When** I complete the action, **Then** a secure, immutable log of this specific transaction (time, user, quantity, location) is created.

---

### User Story 3 - Dispatch Stock (Priority: P2)

As a warehouse worker, I want to record the dispatch of stock for a specific product/variant from my warehouse location, so that outbound orders or consumption are tracked.

**Why this priority**: Essential for decreasing inventory levels when items are shipped or used.

**Independent Test**: Can be fully tested by submitting a stock dispatch form and verifying the stock level decreases accordingly.

**Acceptance Scenarios**:

1. **Given** I need to ship 10 units of Product B from Warehouse Y, **When** I log a "Dispatch Stock" action for 10 units, **Then** the current stock for Product B at Warehouse Y decreases by exactly 10 units.
2. **Given** I attempt to dispatch stock, **When** the quantity requested exceeds the available stock, **Then** the system behaves according to rules regarding negative stock.

---

### User Story 4 - Manual Stock Adjustment (Priority: P3)

As an inventory manager, I want to manually override the stock quantity for a product/variant at a specific location, so that I can correct discrepancies found during a physical stock count.

**Why this priority**: Necessary for correcting database discrepancies and auditing, though less frequent than standard receiving/dispatching workflows.

**Independent Test**: Can be fully tested by setting an absolute value for stock and verifying the new quantity is exactly that value regardless of the previous stock amount, with an "Adjustment" logged.

**Acceptance Scenarios**:

1. **Given** the system says we have 20 units of Product C at Warehouse Z, but I count 18, **When** I perform a "Manual Adjustment" to set the stock to 18, **Then** the current stock becomes 18, and a log is created showing a -2 adjustment.

---

### Edge Cases

- ✅ **RESOLVED**: Dispatch exceeding available stock → Allow negative stock with warning (FR-004)
- ✅ **RESOLVED**: Stock transfer between warehouses → Direct Transfer action (atomic dispatch + receive)
- ✅ **RESOLVED**: Deletion of referenced entities with active stock → Cascade delete stock records and history

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a unified view of stock levels, integrating with the existing `product`, `product_variant`, and `warehouse` modules.
- **FR-002**: System MUST allow users to log incoming stock (Receive) for a specific product/variant at a specific warehouse.
- **FR-003**: System MUST allow users to log outgoing stock (Dispatch) for a specific product/variant from a specific warehouse.
- **FR-004**: System MUST allow users to dispatch stock even if it results in a negative balance, but MUST display a clear warning to the user before confirming the transaction.
- **FR-005**: System MUST allow authenticated users to perform an absolute stock adjustment (Account/Override) for discrepancies. All inventory actions use flat permissions: any authenticated user can perform any operation.
- **FR-006**: System MUST maintain an immutable, chronological audit trail (Stock Movement History) of every single change to stock levels, including the transaction type, delta amount, timestamp, related entities, and user responsible.
- **FR-007**: System MUST track stock down to the level of product variants (if the product has variants); if no variants, it tracks the base product.

### Contract & Integrity Requirements _(mandatory when applicable)_

- **CR-001**: Server Actions/APIs MUST define explicit success and recoverable error behaviors in contracts.
- **CR-002**: Implementation MUST match documented contract shapes for all exposed mutation/read operations.
- **DIR-001**: Critical domain invariants MUST be enforced at the database layer (e.g., foreign keys to products/warehouses).
- **DIR-002**: Stock movements and current stock aggregates must remain mathematically consistent; the current stock should always equal the sum of its movements.

### Key Entities

- **Inventory Level (or Stock)**: Represents the current aggregated quantity of a specific product (or variant) at a specific warehouse.
- **Stock Movement (or Inventory Transaction)**: An immutable record of a change in stock. Contains the delta (positive or negative), the operation type enum (`receive`, `dispatch`, `adjustment`), timestamp, and references to the product, variant, and warehouse. Stock transfers are recorded as two separate movements: a `dispatch` from the source warehouse and a `receive` at the destination warehouse.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view the current stock of any product across all warehouses in under 2 seconds.
- **SC-002**: Stock movements (add/subtract) are completed with 100% mathematical accuracy, matching the total of all logged movements.
- **SC-003**: Authorized users can successfully perform a standard manual stock adjustment in under 5 clicks starting from the main inventory listing.
- **SC-004**: System reliably associates inventory values with the existing Product, Variant, and Warehouse tables without data orphaned during typical CRUD operations in those parent modules.

## Assumptions

- Stock is strictly tracked per location (warehouse). There is no "floating" stock.
- Moving stock from Warehouse A to Warehouse B can be treated structurally as a dispatch from A and a receipt at B.
- A product variant is the lowest granularity of an item. If a product has no variants, the stock is tied to the base product.

## Clarifications

### Session 2026-03-02

- **Q**: What happens when a user attempts to dispatch more stock than is currently physically available at a location? → **A**: Allow negative stock automatically with a clear warning before confirming the transaction (per FR-004).
- **Q**: What happens if a referenced product, variant, or warehouse is deleted while it still has active stock associated with it? → **A**: Cascade delete: Remove all associated stock records and movement history when parent is deleted.
- **Q**: How does the system handle moving stock between two warehouses directly? → **A**: Direct Transfer: Single "Transfer Stock" action that atomically dispatches from source and receives at destination.
- **Q**: What permission/authorization model applies to inventory actions? → **A**: Flat permissions: All authenticated users can perform all inventory actions (receive, dispatch, adjust, view).
- **Q**: What are the specific Stock Movement types to be tracked? → **A**: Three core types: `receive`, `dispatch`, `adjustment` (transfer treated as dispatch+receive pair without special typing).
