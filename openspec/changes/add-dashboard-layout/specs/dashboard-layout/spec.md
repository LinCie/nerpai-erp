## ADDED Requirements

### Requirement: Dashboard layout structure
The system SHALL provide a consistent dashboard layout with sidebar navigation, header, and main content area.

#### Scenario: Layout renders with all components
- **WHEN** user navigates to any dashboard route
- **THEN** the system displays a sidebar on the left, header at the top, and main content area

#### Scenario: Sidebar is collapsible
- **WHEN** user clicks the sidebar toggle button
- **THEN** the sidebar collapses to icon-only mode
- **AND** clicking again expands the sidebar

#### Scenario: Mobile responsive layout
- **WHEN** user views on mobile device
- **THEN** the sidebar is hidden by default
- **AND** a hamburger menu button appears in the header
- **AND** clicking the button opens a slide-over drawer

### Requirement: Header components
The system SHALL display a header with breadcrumbs, theme toggle, and user navigation.

#### Scenario: Header displays correctly
- **WHEN** user views any dashboard page
- **THEN** the header shows sidebar toggle, breadcrumbs, theme toggle, and user avatar

#### Scenario: Theme toggle works
- **WHEN** user clicks the theme toggle button
- **THEN** the application switches between light and dark modes
- **AND** the preference persists across sessions

### Requirement: Navigation menu
The system SHALL display a navigation menu in the sidebar with Dashboard, Products, and Orders items.

#### Scenario: Navigation items are visible
- **WHEN** user views the sidebar
- **THEN** Dashboard, Products, and Orders navigation items are displayed

#### Scenario: Active navigation highlighting
- **WHEN** user is on a specific route
- **THEN** the corresponding navigation item is visually highlighted as active

### Requirement: Sub-menu support
The system SHALL support collapsible sub-menus for Products and Orders navigation items.

#### Scenario: Sub-menu expands on click
- **WHEN** user clicks on Products or Orders navigation item
- **THEN** the sub-menu expands showing child items
- **AND** clicking again collapses the sub-menu

#### Scenario: Sub-menu active state
- **WHEN** user navigates to a sub-menu route (e.g., /products/categories)
- **THEN** the parent navigation item (Products) shows expanded state
- **AND** the child item (Categories) is highlighted as active
