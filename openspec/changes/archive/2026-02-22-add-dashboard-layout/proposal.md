## Why

The Nerpai ERP application currently lacks a proper dashboard interface for users to navigate between different modules. After a user selects an organization, they need a consistent navigation structure to access Products and Orders management. This dashboard layout will provide the foundation for all future ERP functionality.

## What Changes

- Add dashboard layout wrapper accessible only to users with an active organization
- Create collapsible sidebar navigation with organization context
- Implement hierarchical navigation for Products module (All Products, Categories, Inventory, Create New)
- Implement hierarchical navigation for Orders module (All Orders, Pending, Completed, Create New)
- Add organization exit button to allow users to switch organizations
- Integrate dark/light mode toggle
- Install required shadcn UI components: sidebar, avatar, dropdown-menu, breadcrumb, sheet, tooltip, skeleton, badge
- Create placeholder pages for all navigation routes

## Capabilities

### New Capabilities
- `dashboard-layout`: Core dashboard layout with sidebar navigation, header, and organization-aware access control
- `product-navigation`: Hierarchical navigation structure for product management with sub-menu support
- `order-navigation`: Hierarchical navigation structure for order management with sub-menu support
- `organization-context`: Organization-aware routing and session management with exit functionality
- `theme-toggle`: Dark/light mode switching integrated into dashboard header

### Modified Capabilities
- None

## Impact

- **Code**: New layout components in `src/shared/presentation/components/layout/`, new hooks in `src/shared/presentation/hooks/`, new config in `src/shared/presentation/config/`, new route pages in `src/app/(app)/`
- **Dependencies**: Adds 8 shadcn UI components (sidebar, avatar, dropdown-menu, breadcrumb, sheet, tooltip, skeleton, badge)
- **Routes**: New routes for `/`, `/products`, `/products/categories`, `/products/inventory`, `/products/new`, `/orders`, `/orders/pending`, `/orders/completed`, `/orders/new`
- **Authentication**: Dashboard routes will check for active organization; users without one will be redirected to `/organizations`
