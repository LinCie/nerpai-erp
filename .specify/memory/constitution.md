<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 1.0.0 → 1.1.0 (Minor - added technology standard)

Modified principles: None

Added sections:
  - Technology Standards: Database layer (Kysely + PostgreSQL)
  - Development Workflow > File Organization: Added src/db/ directory

Removed sections: None

Templates requiring updates:
  ✅ plan-template.md - Constitution Check section compatible
  ✅ spec-template.md - Requirements align with principles
  ✅ tasks-template.md - Task structure supports principle-driven workflow

Follow-up TODOs: None
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

Follow React Hooks rules strictly. Components MUST be focused, testable, and performant.

- Never call hooks inside loops or conditions
- Use custom hooks to encapsulate reusable logic (prefix with `use`)
- Memoize context values and expensive calculations with `useMemo`/`useCallback`
- Keep effects focused on a single concern with proper cleanup
- Extract complex state logic to `useReducer` or custom hooks
- Use ESLint plugin for React hooks

**Rationale**: Predictable component behavior, better performance, easier testing and debugging.

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

## Technology Standards

**Framework**: Next.js 16.x with App Router
**Language**: TypeScript 5.x (strict mode)
**UI Library**: React 19.x
**Styling**: Tailwind CSS 4.x
**Database**: PostgreSQL with Kysely query builder
**Migrations**: kysely-ctl CLI
**Authentication**: next-auth 4.x
**Testing**: Jest + React Testing Library (when tests requested)
**Linting**: ESLint 9.x with next/core-web-vitals config
**Package Manager**: Bun

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

### File Organization

```
src/
├── app/           # Next.js App Router routes
├── components/    # Reusable UI components
├── db/            # Database layer (Kysely instance, types, migrations)
├── hooks/         # Custom React hooks
├── lib/           # Utility functions, shared logic
├── types/         # TypeScript type definitions
└── styles/        # Global styles, Tailwind config
```

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

**Version**: 1.1.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-19
