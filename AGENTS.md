# ERP System Frontend - Agent Guidelines

## External File Loading

CRITICAL: When you encounter a file reference (e.g., @.agent/rules/xxx.md), use your Read tool to load it on a need-to-know basis. They are relevant to the SPECIFIC task at hand.

Instructions:

- Do NOT preemptively load all references - use lazy loading based on actual need
- When loaded, treat content as mandatory instructions that override defaults
- Follow references recursively when needed

### TypeScript

- Strict mode and type safety: @.agent/rules/typescript-strict-mode-guide.md
- Generics patterns: @.agent/rules/typescript-generics-guide.md

### React

- Hooks patterns and rules: @.agent/rules/react-hooks-guide.md
- Advanced component patterns: @.agent/rules/advanced-react-guide.md
- Performance optimization: @.agent/rules/react-performance-guide.md

### Next.js

- App Router architecture: @.agent/rules/nextjs-app-router-guide.md
- Server Actions: @.agent/rules/nextjs-server-action-guide.md
- Internationalization (next-intl): @.agent/rules/nextjs-internationalization-guide.md
- Performance: @.agent/rules/nextjs-performance-guide.md

### Frontend Fundamentals

- Modern CSS with Tailwind: @.agent/rules/modern-css-guide.md
- Web performance: @.agent/rules/web-performance-guide.md
- Browser APIs: @.agent/rules/browser-api-guide.md
- Semantic HTML: @.agent/rules/semantic-html-guide.md
- ES6+ JavaScript: @.agent/rules/es6-javascript-guide.md

### Development Workflow

- API design: @.agent/rules/api-design-guide.md
- Writing tests: @.agent/rules/test-writing-guide.md
- Code review: @.agent/rules/code-review-guide.md
- Refactoring: @.agent/rules/refactoring-guide.md
- Security audits: @.agent/rules/security-audit-guide.md
- Bug hunting: @.agent/rules/bug-hunting-guide.md

# nerpai-erp Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies

- TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, @dnd-kit/core + @dnd-kit/sortable (new) (002-product-variants)
- PostgreSQL 18.x — 5 new tables (attribute, attribute_option, product_attribute, product_variant, variant_option) with CHECK, UNIQUE, and FK constraints (002-product-variants)

- TypeScript 5.x (strict mode enabled) + Next.js 16.1.6, React 19.2.3, Kysely 0.28.11, Zod 4.3.6, TanStack Form 1.28.3, Radix UI 1.4.3, Tailwind CSS 4.x, better-auth 1.4.18, Zustand (via stores), Lucide React 0.575.0, Motion 12.34.3 (001-basic-product-crud)

## Project Structure

```text
src/
tests/
```

## Commands

bun test && bun run lint

## Code Style

TypeScript 5.x (strict mode enabled): Follow standard conventions

## Recent Changes

- 005-order-management: Added TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui (Combobox, Badge, Table, Dialog, AlertDialog, Card, Button, Input, Pagination, Separator, Skeleton)
- 004-simple-inventory: Added TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui
- 003-warehouse-management: Added TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui (Field, Input, Textarea, Dialog, Card, AlertDialog)
