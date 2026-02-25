# NERPAI ERP Frontend

Next.js 16 + TypeScript 5 ERP frontend using App Router, Kysely, and better-auth.

## Prerequisites

- Bun
- PostgreSQL 18.x
- `DATABASE_URL` configured in `.env`

## Development

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

## Quality Checks

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

## Database Workflow

```bash
bun db:migrate:create <migration_name>
bun db:migrate
bun db:codegen
```

Notes:
- Run migrations only via `bun db:migrate`.
- Keep database schema in snake_case; app code remains camelCase through Kysely plugins.
- Add required PostgreSQL extensions through idempotent migrations (`CREATE EXTENSION IF NOT EXISTS ...`).

## Features

### Product Variants (002-product-variants)

- **Attributes**: Define reusable variant dimensions (Color, Size, Material)
- **Options**: Add values to attributes (Red, Blue, Small, Large)
- **Variant Generation**: Create product variants from attribute combinations
- **SKU Management**: Auto-generate SKUs with collision resolution
- **Multi-tenancy**: All data scoped to organization

**Key Routes**:
- `/products/attributes` - Manage attributes and options
- `/products/[id]` - Product detail with variant list
- `/products/[id]/variants` - Configure variants for a product

**Key Components**:
- Drag-and-drop attribute reorder (keyboard accessible via dnd-kit)
- Variant combination matrix for selection
- Inline variant editing (SKU, price, stock)

## References

- Constitution: `.specify/memory/constitution.md`
- Agent guidance: `AGENTS.md`
- Feature specs: `specs/`
