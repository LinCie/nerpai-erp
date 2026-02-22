## ADDED Requirements

### Requirement: Products navigation structure
The system SHALL provide hierarchical navigation for the Products module with four sub-menu items.

#### Scenario: Products navigation is visible
- **WHEN** user views the sidebar navigation
- **THEN** a "Products" item is visible with a product/package icon

#### Scenario: Products sub-menu expands
- **WHEN** user clicks on Products navigation item
- **THEN** the sub-menu expands showing: All Products, Categories, Inventory, Create New

#### Scenario: Navigate to All Products
- **WHEN** user clicks "All Products" sub-menu item
- **THEN** the system navigates to /products route
- **AND** displays the Products listing page

#### Scenario: Navigate to Categories
- **WHEN** user clicks "Categories" sub-menu item
- **THEN** the system navigates to /products/categories route
- **AND** displays the Categories page

#### Scenario: Navigate to Inventory
- **WHEN** user clicks "Inventory" sub-menu item
- **THEN** the system navigates to /products/inventory route
- **AND** displays the Inventory page

#### Scenario: Navigate to Create New Product
- **WHEN** user clicks "Create New" sub-menu item under Products
- **THEN** the system navigates to /products/new route
- **AND** displays the product creation form page

### Requirement: Products route hierarchy
The system SHALL support the following Products routes with placeholder pages.

#### Scenario: All Products route exists
- **WHEN** user accesses /products
- **THEN** a placeholder page loads with "All Products" title

#### Scenario: Categories route exists
- **WHEN** user accesses /products/categories
- **THEN** a placeholder page loads with "Categories" title

#### Scenario: Inventory route exists
- **WHEN** user accesses /products/inventory
- **THEN** a placeholder page loads with "Inventory" title

#### Scenario: Create New route exists
- **WHEN** user accesses /products/new
- **THEN** a placeholder page loads with "Create New Product" title
