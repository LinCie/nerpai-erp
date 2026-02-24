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

## References

- Constitution: `.specify/memory/constitution.md`
- Agent guidance: `AGENTS.md`
- Feature specs: `specs/`
