<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 1.3.0 → 1.4.0 (Minor - added Vertical Slice Architecture principle)

Modified principles:
  - None renamed, but order adjusted: VII added as new principle

Modified sections:
  - File Organization: Complete rewrite to reflect vertical slice structure

Added sections:
  - VII. Vertical Slice Architecture with Clean Architecture

Removed sections: None

Templates requiring updates:
  ✅ plan-template.md - Updated Constitution Check to include item VII
  ✅ tasks-template.md - Updated path conventions and task examples for module structure
  ⚠ spec-template.md - No changes needed (entity section already flexible)

Follow-up TODOs:
  - TODO(FILE_ORGANIZATION_MIGRATION): Existing code in src/app/, src/components/, etc.
    needs migration to src/modules/ structure. This is a gradual migration;
    new features MUST use the module structure immediately.
================================================================================
-->

# NERPAI ERP Constitution

## Core Principles

### I. Type Safety First

TypeScript strict mode MUST be enabled at all times. The `any` type is prohibited; use `unknown` with proper type guards instead.

- Enable `strict: true` in tsconfig.json (non-negotiable)
- Handle `null` and `undefined` explicitly with strictNullChecks
- Use discriminated unions for state management
- Prefer interfaces for public APIs, types for unions/intersections
- Throw Error objects, never strings; consider Result/Option types for functional error handling

**Rationale**: Type safety catches bugs at compile time, improves IDE support, and serves as living documentation.

### II. React Component Discipline

Follow React Hooks rules strictly. Components MUST be focused, testable, and performant. React Compiler handles automatic memoization.

- Never call hooks inside loops or conditions
- Use custom hooks to encapsulate reusable logic (prefix with `use`)
- Minimize manual memoization (`useMemo`, `useCallback`, `useReducer`) - rely on React Compiler
- Keep effects focused on a single concern with proper cleanup
- Use ESLint plugin for React hooks

**Rationale**: Predictable component behavior, better performance, easier testing and debugging. React Compiler eliminates the need for manual memoization in most cases.

### III. Next.js App Router Standards

Leverage Next.js 16 App Router capabilities for optimal performance and UX.

- Server Components are the default; use `'use client'` directive only when necessary
- Server Actions handle mutations; validate inputs with Zod or similar
- Use streaming and Suspense for progressive loading
- Implement proper loading.tsx and error.tsx boundaries
- Route handlers follow RESTful conventions
- Internationalization via next-intl for multi-language support

**Rationale**: Server Components reduce client bundle size; proper error boundaries improve UX; standards ensure consistency.

### IV. Accessibility & Performance

All user-facing features MUST meet accessibility standards and performance budgets.

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- ARIA attributes only when semantic HTML is insufficient
- Tailwind CSS for styling; avoid arbitrary values when design tokens exist
- Target Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Images use next/image with proper sizing and lazy loading
- Keyboard navigation MUST work for all interactive elements

**Rationale**: Accessibility is a legal requirement and moral obligation; performance directly impacts user satisfaction and conversion.

### V. Code Quality & Security

Code MUST be reviewed, tested where specified, and follow security best practices.

- All code changes require review before merge
- Secrets and credentials NEVER committed to repository
- Sanitize and validate all user inputs
- Use parameterized queries; never concatenate SQL
- Authentication via next-auth; authorize on every protected route
- Log security-relevant events without exposing sensitive data

**Rationale**: Security breaches are costly; code review catches issues automation misses; consistent practices reduce cognitive load.

### VI. Documentation-First Research

All research MUST utilize Context7 when available as the authoritative source for library documentation. Previous knowledge of libraries is invalidated when Context7 documentation is accessible.

- MUST resolve library IDs via Context7 before querying documentation
- MUST use specific versions from Context7 (e.g., `/org/project/version`) when available
- MUST prioritize Context7 code snippets and examples over external sources
- MUST invalidate all prior library knowledge when Context7 data is retrieved
- SHOULD document which Context7 library IDs were referenced in research artifacts

**Rationale**: Context7 provides version-specific, authoritative documentation directly from official sources. This eliminates knowledge drift, ensures accurate version compatibility, and prevents decisions based on outdated or incorrect information.

### VII. Vertical Slice Architecture with Clean Architecture

Code MUST be organized by feature modules using vertical slices, with each module implementing Clean Architecture layers. This ensures high cohesion, low coupling, and clear separation of concerns.

**Module Structure**:
All feature code lives in `src/modules/[module-name]/` with four distinct layers:

- **Domain Layer**: Entities (database tables) and domain types
  - Location: `domain/entities/`, `domain/types/`
  - Contains: Entity definitions, value objects, domain events

- **Application Layer**: Business logic and repository interfaces
  - Location: `application/services/`, `application/repositories/`, `application/types/`
  - Contains: Services implementing business rules, repository interfaces (not implementations), DTOs for service/repository contracts

- **Infrastructure Layer**: Repository implementations and external integrations
  - Location: `infrastructure/repositories/`, `infrastructure/external/`
  - Contains: Concrete repository implementations using Kysely, external API clients, database mappers

- **Presentation Layer**: Outward-facing interfaces
  - Location: `presentation/actions/`, `presentation/api/`, `presentation/components/`, `presentation/stores/`, `presentation/types/`, `presentation/schemas/`
  - Contains: Server Actions, API route handlers, React components, state management (Zustand), Zod schemas, presentation types

**Cross-Cutting Concerns**:
- Shared utilities: `src/lib/`
- Cross-module types: `src/types/`
- Global styles: `src/styles/`

**Rationale**: Vertical slices group related code by feature rather than technical layer, improving discoverability and reducing merge conflicts. Clean Architecture enforces dependency direction (Domain ← Application ← Infrastructure ← Presentation), making business logic independent of frameworks and infrastructure. This structure scales with team size and enables parallel development on different features.

## Technology Standards

**Framework**: Next.js 16.x with App Router
**Language**: TypeScript 5.x (strict mode)
**UI Library**: React 19.x with React Compiler
**Styling**: Tailwind CSS 4.x
**Database**: PostgreSQL with Kysely v0.28.x query builder
**Migrations**: kysely-ctl v0.20.x CLI
**Authentication**: next-auth 4.x
**Testing**: Jest v30.x + React Testing Library (when tests requested)
**Linting**: ESLint 9.x with next/core-web-vitals config
**Package Manager**: Bun (exclusive - npm, yarn, pnpm, and deno are prohibited)

**Versioning**: Semantic Versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes to public APIs or architecture
- MINOR: New features, backwards-compatible
- PATCH: Bug fixes, minor improvements

## Development Workflow

### Branch Strategy

- `main`: Production-ready code, protected
- Feature branches: `###-feature-name` pattern
- All changes via pull request

### Quality Gates

1. TypeScript compilation passes with no errors
2. ESLint passes with no warnings
3. Code review approved
4. No secrets in commit history
5. Library research uses Context7 documentation (where available)
6. New features use vertical slice module structure (VII)

### File Organization

```
src/
├── modules/              # Feature modules (vertical slices)
│   ├── products/         # Example: Products module
│   │   ├── domain/       # Entities and domain types
│   │   │   ├── entities/
│   │   │   └── types/
│   │   ├── application/  # Services, repository interfaces, DTOs
│   │   │   ├── services/
│   │   │   ├── repositories/  # Interfaces only (e.g., IProductRepository)
│   │   │   └── types/    # getManyProps, getManyReturn, etc.
│   │   ├── infrastructure/  # Repository implementations
│   │   │   └── repositories/  # Concrete implementations (e.g., ProductRepository)
│   │   └── presentation/ # Actions, APIs, components, stores, schemas
│   │       ├── actions/  # Server Actions
│   │       ├── api/      # API route handlers
│   │       ├── components/  # React components
│   │       ├── stores/   # Zustand stores
│   │       ├── types/    # Presentation-layer types
│   │       └── schemas/  # Zod validation schemas
│   ├── auth/             # Example: Authentication module
│   ├── orders/           # Example: Orders module
│   └── ...               # Other feature modules
├── lib/                  # Shared utilities and helpers
├── types/                # Cross-module TypeScript definitions
└── styles/               # Global styles, Tailwind config
```

**Key Rules**:
- Each module is self-contained; minimize cross-module imports
- Domain layer has ZERO external dependencies (no React, no Kysely)
- Application layer depends only on Domain layer
- Infrastructure layer implements Application layer interfaces
- Presentation layer can depend on Application and Infrastructure layers
- Import direction: Domain ← Application ← Infrastructure ← Presentation

## Governance

This constitution supersedes all other development practices within this project.

**Amendment Process**:
1. Propose change via pull request to constitution.md
2. Document rationale and impact on existing code
3. Increment version per semantic versioning rules
4. Update `LAST_AMENDED_DATE` on ratification
5. Propagate changes to dependent templates and documentation

**Compliance Review**:
- All PRs MUST verify compliance with constitution principles
- Deviations require explicit justification documented in Complexity Tracking
- Use AGENTS.md for runtime development guidance and rule references

**Guidance Files**:
- AGENTS.md: Primary development guidance with rule references
- `.agent/rules/*.md`: Detailed guides for specific domains

**Version**: 1.4.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-19
