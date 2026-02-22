## 1. Install Dependencies and Shadcn Components

- [x] 1.1 Install shadcn sidebar component: `bunx shadcn@latest add sidebar`
- [x] 1.2 Install shadcn avatar component: `bunx shadcn@latest add avatar`
- [x] 1.3 Install shadcn dropdown-menu component: `bunx shadcn@latest add dropdown-menu`
- [x] 1.4 Install shadcn breadcrumb component: `bunx shadcn@latest add breadcrumb`
- [x] 1.5 Install shadcn sheet component: `bunx shadcn@latest add sheet`
- [x] 1.6 Install shadcn tooltip component: `bunx shadcn@latest add tooltip`
- [x] 1.7 Install shadcn skeleton component: `bunx shadcn@latest add skeleton`
- [x] 1.8 Install shadcn badge component: `bunx shadcn@latest add badge`

## 2. Create Shared Hooks

- [x] 2.1 Create use-mobile.tsx hook for mobile detection in `src/shared/presentation/hooks/`
- [x] 2.2 Create use-breadcrumbs.tsx hook for breadcrumb generation in `src/shared/presentation/hooks/`

## 3. Create Configuration Files

- [x] 3.1 Create nav-config.ts with navigation items configuration in `src/shared/presentation/config/`
- [x] 3.2 Create icons.tsx with lucide-react icon mappings in `src/shared/presentation/components/`

## 4. Create Layout Components

- [x] 4.1 Create app-sidebar.tsx component in `src/shared/presentation/components/layout/`
- [x] 4.2 Create header.tsx component in `src/shared/presentation/components/layout/`
- [x] 4.3 Create nav-main.tsx component for navigation menu in `src/shared/presentation/components/layout/`
- [x] 4.4 Create nav-user.tsx component for user dropdown in sidebar footer
- [x] 4.5 Create org-switcher.tsx component with organization exit button
- [x] 4.6 Create mode-toggle.tsx component for dark/light mode switching
- [x] 4.7 Create breadcrumbs.tsx component for breadcrumb navigation

## 5. Create Dashboard Layout

- [x] 5.1 Create (app)/layout.tsx with organization check and SidebarProvider
- [x] 5.2 Implement server-side organization validation
- [x] 5.3 Add redirect logic to /organizations if no active org

## 6. Create Dashboard Pages

- [x] 6.1 Create (app)/page.tsx with Dashboard overview and welcome card
- [x] 6.2 Create (app)/products/page.tsx placeholder
- [x] 6.3 Create (app)/products/categories/page.tsx placeholder
- [x] 6.4 Create (app)/products/inventory/page.tsx placeholder
- [x] 6.5 Create (app)/products/new/page.tsx placeholder
- [x] 6.6 Create (app)/orders/page.tsx placeholder
- [x] 6.7 Create (app)/orders/pending/page.tsx placeholder
- [x] 6.8 Create (app)/orders/completed/page.tsx placeholder
- [x] 6.9 Create (app)/orders/new/page.tsx placeholder

## 7. Integration and Testing

- [x] 7.1 Verify all shadcn components are properly styled
- [x] 7.2 Test sidebar collapse/expand functionality
- [x] 7.3 Test mobile responsive behavior with slide-over drawer
- [x] 7.4 Test organization access control (redirect when no active org)
- [x] 7.5 Test organization exit functionality
- [x] 7.6 Test theme toggle (light/dark mode switching)
- [x] 7.7 Test all navigation routes and sub-menu items
- [x] 7.8 Verify breadcrumbs update correctly on navigation
- [x] 7.9 Test active state highlighting for navigation items

## 8. Cleanup and Polish

- [x] 8.1 Remove any console.log statements
- [x] 8.2 Ensure proper TypeScript types throughout
- [x] 8.3 Verify no build errors or warnings
- [x] 8.4 Add loading states where appropriate
- [x] 8.5 Final visual review of all pages
