## Context

The Nerpai ERP application uses Next.js 16 with App Router, better-auth for authentication, and shadcn/ui for components. Currently, users select an organization at `/organizations` but then have no dashboard interface to navigate to Products or Orders modules. This design creates a comprehensive dashboard layout with sidebar navigation that is only accessible when a user has an active organization.

The layout is inspired by the next-shadcn-dashboard-starter template but adapted for:
- better-auth instead of Clerk
- lucide-react icons instead of @tabler/icons-react
- Specific ERP needs (Products, Orders navigation)

## Goals / Non-Goals

**Goals:**
- Create a responsive dashboard layout with collapsible sidebar
- Implement hierarchical navigation for Products and Orders with sub-menus
- Enforce organization-aware access control (redirect to /organizations if no active org)
- Provide organization exit functionality
- Integrate dark/light mode toggle
- Use existing shadcn/ui components and install required ones
- Support mobile with slide-over drawer sidebar

**Non-Goals:**
- Full Products/Orders functionality (placeholder pages only)
- Search functionality (Cmd+K/kbar)
- Multi-tenant workspace switching (just exit to organization selection)
- Advanced RBAC or permission-based navigation
- Real-time collaboration features
- Analytics or reporting dashboards

## Decisions

### 1. Sidebar Collapse Strategy
**Decision:** Sidebar starts expanded by default with cookie-based persistence
**Rationale:** Users preferred expanded view in initial discussions. Cookie persistence maintains state across sessions without requiring database storage.
**Alternatives considered:**
- LocalStorage (doesn't work server-side for initial render)
- Database preference (overkill for UI state)
- Always collapsed (poor UX for new users)

### 2. Icon Library
**Decision:** Use lucide-react exclusively
**Rationale:** Already installed in the project. Mapping lucide icons to match template's tabler icons.
**Alternatives considered:**
- Install @tabler/icons-react (adds dependency, inconsistent with existing code)
- Mix both libraries (confusing, inconsistent icon style)

### 3. Organization Check Strategy
**Decision:** Server-side check in layout.tsx using authClient.getSession()
**Rationale:** Prevents flash of dashboard content before redirect. More secure than client-side check.
**Alternatives considered:**
- Client-side useEffect check (visible redirect, poor UX)
- Middleware (adds complexity, still need layout check for data fetching)

### 4. Navigation Structure
**Decision:** Flat hierarchy with collapsible sub-menus for Products and Orders
**Rationale:**
- Dashboard stands alone (no sub-items)
- Products has 4 sub-items: All Products, Categories, Inventory, Create New
- Orders has 4 sub-items: All Orders, Pending, Completed, Create New
**Alternatives considered:**
- Separate sidebar sections for each module (too many sections for 2 modules)
- Mega-menu style (complex, not mobile-friendly)

### 5. Mobile Behavior
**Decision:** Slide-over drawer on mobile, persistent sidebar on desktop
**Rationale:** Follows shadcn sidebar component patterns. Drawer provides full navigation space on mobile.
**Alternatives considered:**
- Bottom navigation bar (limited items, poor for hierarchical nav)
- Always-visible sidebar (takes too much mobile screen space)

### 6. Theme Toggle Placement
**Decision:** Place in header, not sidebar
**Rationale:** Header is persistent across all views. Sidebar is collapsible and mobile drawer may hide it.
**Alternatives considered:**
- Sidebar footer (hidden when collapsed, inaccessible on mobile)
- User dropdown menu (requires extra click)

### 7. Organization Exit UX
**Decision:** Prominent exit button in sidebar header next to organization name
**Rationale:** Important action should be visible. Header location mirrors where organization info is displayed.
**Alternatives considered:**
- User dropdown menu (too hidden)
- Separate settings page (too many clicks)
- Breadcrumb navigation (clutters header)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Sidebar component is large (~760 lines) | Only install once, use throughout app. Lazy load not needed as it's core layout. |
| Server-side auth check adds latency | Use cookie-based session for instant redirect, avoid database round-trip |
| Mobile drawer may conflict with other modals | Use z-index layering, ensure only one overlay open at a time |
| Sub-menu items could overflow on small screens | Scrollable sidebar content, collapsible groups |
| Theme flash on load | Use next-themes with suppressHydrationWarning, proper CSS variables |

## Migration Plan

**Deployment Steps:**
1. Install shadcn components (non-breaking)
2. Create layout components (non-breaking)
3. Create dashboard layout with org check (redirects users without org - expected behavior)
4. Create placeholder pages for all routes
5. Update existing /organizations page to redirect to / if org already active (optional UX improvement)

**Rollback:**
- Simply revert commits; no database migrations involved
- Users without active org will see /organizations (existing behavior)

## Open Questions

- Should we add keyboard shortcuts for navigation (e.g., Cmd+1 for Dashboard)?
- Should active organization be stored in URL params for shareable links?
- Do we need breadcrumbs for deep navigation (e.g., /products/categories)?
