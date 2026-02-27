---
trigger: always_on
---

# nerpai-erp Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui (Field, Input, Textarea, Dialog, Card, AlertDialog) (003-warehouse-management)
- PostgreSQL 18.x — 1 new table (`warehouse`) with CHECK, partial UNIQUE, and FK constraints (003-warehouse-management)

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
- 003-warehouse-management: Added TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, shadcn/ui (Field, Input, Textarea, Dialog, Card, AlertDialog)

- 002-product-variants: Added TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, Kysely v0.28.x, TanStack Form 1.x, Zod, @dnd-kit/core + @dnd-kit/sortable (new)

- 001-basic-product-crud: Added TypeScript 5.x (strict mode enabled) + Next.js 16.1.6, React 19.2.3, Kysely 0.28.11, Zod 4.3.6, TanStack Form 1.28.3, Radix UI 1.4.3, Tailwind CSS 4.x, better-auth 1.4.18, Zustand (via stores), Lucide React 0.575.0, Motion 12.34.3

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
