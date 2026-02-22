## ADDED Requirements

### Requirement: Orders navigation structure
The system SHALL provide hierarchical navigation for the Orders module with four sub-menu items.

#### Scenario: Orders navigation is visible
- **WHEN** user views the sidebar navigation
- **THEN** an "Orders" item is visible with a shopping cart icon

#### Scenario: Orders sub-menu expands
- **WHEN** user clicks on Orders navigation item
- **THEN** the sub-menu expands showing: All Orders, Pending, Completed, Create New

#### Scenario: Navigate to All Orders
- **WHEN** user clicks "All Orders" sub-menu item
- **THEN** the system navigates to /orders route
- **AND** displays the Orders listing page

#### Scenario: Navigate to Pending Orders
- **WHEN** user clicks "Pending" sub-menu item
- **THEN** the system navigates to /orders/pending route
- **AND** displays the Pending Orders page

#### Scenario: Navigate to Completed Orders
- **WHEN** user clicks "Completed" sub-menu item
- **THEN** the system navigates to /orders/completed route
- **AND** displays the Completed Orders page

#### Scenario: Navigate to Create New Order
- **WHEN** user clicks "Create New" sub-menu item under Orders
- **THEN** the system navigates to /orders/new route
- **AND** displays the order creation form page

### Requirement: Orders route hierarchy
The system SHALL support the following Orders routes with placeholder pages.

#### Scenario: All Orders route exists
- **WHEN** user accesses /orders
- **THEN** a placeholder page loads with "All Orders" title

#### Scenario: Pending route exists
- **WHEN** user accesses /orders/pending
- **THEN** a placeholder page loads with "Pending Orders" title

#### Scenario: Completed route exists
- **WHEN** user accesses /orders/completed
- **THEN** a placeholder page loads with "Completed Orders" title

#### Scenario: Create New route exists
- **WHEN** user accesses /orders/new
- **THEN** a placeholder page loads with "Create New Order" title
