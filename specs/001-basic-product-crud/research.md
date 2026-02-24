# Research: Basic Product CRUD

**Feature Branch**: `001-basic-product-crud`
**Date**: 2026-02-24
**Status**: Complete

## Context7 Library References

| Library       | Context7 ID               | Version                             | Used For                                                 |
| ------------- | ------------------------- | ----------------------------------- | -------------------------------------------------------- |
| Kysely        | `/kysely-org/kysely`      | v0.28.3 (docs) / v0.28.11 (project) | Type-safe SQL query builder, migrations, CamelCasePlugin |
| Zod           | `/websites/zod_dev_v4`    | v4.x (docs) / v4.3.6 (project)      | Schema validation for Server Actions and form inputs     |
| TanStack Form | `/websites/tanstack_form` | v1.x (docs) / v1.28.3 (project)     | Headless form state management with React + Zod          |

## Research Findings

### 1. Kysely CRUD Operations & Migration Patterns

**Decision**: Use Kysely's fluent query builder API for all database operations with the existing CamelCasePlugin setup.

**Rationale**: The project already has Kysely v0.28.11 configured with CamelCasePlugin in `src/shared/infrastructure/persistence/index.ts`. Context7 documentation confirms this plugin automatically converts between TypeScript camelCase and database snake_case, which aligns with Constitution VIII.

**Key findings from Context7**:

- `insertInto().values().executeTakeFirstOrThrow()` for inserts with returning
- `selectFrom().select().where().execute()` for queries
- `updateTable().set().where().execute()` for updates
- Migrations use `up(db: Kysely<unknown>)` / `down(db: Kysely<unknown>)` pattern (confirmed via existing `better_auth_setup` migration)
- UUID v7 primary keys via `col.primaryKey().defaultTo(db.fn("uuidv7"))` (existing pattern)

**Alternatives considered**:

- Raw SQL: Rejected — loses type safety benefits
- Prisma: Rejected — project is already standardized on Kysely

### 2. Soft Delete Pattern with Kysely

**Decision**: Implement soft delete via nullable `deleted_at` timestamp column. All "list" queries filter `WHERE deleted_at IS NULL` by default. Trash queries filter `WHERE deleted_at IS NOT NULL`.

**Rationale**: Constitution IX mandates soft delete enforcement. The existing migration patterns show how to add nullable timestamp columns. Repository will expose `softDelete()` (sets `deleted_at = NOW()`) and `restore()` (sets `deleted_at = NULL`) methods.

**Key implementation details**:

- Soft delete: `updateTable('product').set({ deletedAt: sql\`CURRENT_TIMESTAMP\` }).where('id', '=', id)`
- Restore: `updateTable('product').set({ deletedAt: null }).where('id', '=', id)`
- All standard queries: `.where('deletedAt', 'is', null)`
- Trash queries: `.where('deletedAt', 'is not', null)`

**Alternatives considered**:

- Boolean `is_deleted` flag: Rejected — timestamp provides more information (when deleted) and is the project standard per Constitution IX
- Hard delete: Prohibited by Constitution IX

### 3. Zod 4 Validation Schemas

**Decision**: Use Zod 4's `z.string().min().max()` for product name validation with the new `error` parameter syntax.

**Rationale**: The project uses Zod 4.3.6. Context7 documentation for Zod 4 confirms the new `error` parameter replaces the deprecated `message` parameter from Zod 3. Server Actions will validate all inputs with Zod before any database operations.

**Key findings from Context7**:

- Zod 4 syntax: `z.string().min(1, { error: "..." }).max(255, { error: "..." })`
- The existing organization schema in the project uses Zod 3 syntax (with `message` still); new code should use Zod 4 `error` parameter

**Alternatives considered**:

- Manual validation: Rejected — Zod provides type inference and integrates with TanStack Form

### 4. TanStack Form with Next.js Server Actions

**Decision**: Use TanStack Form v1 with `@tanstack/react-form-nextjs` integration for form handling with Server Actions.

**Rationale**: The project already has `@tanstack/react-form` v1.28.3 as a dependency. Context7 documentation shows the App Router SSR integration pattern using `createServerValidate`, `mergeForm`, and `useTransform`.

**Key findings from Context7**:

- Server-side: `createServerValidate()` from `@tanstack/react-form-nextjs` validates form data in Server Actions
- Client-side: `useForm()`, `useStore()`, `useTransform()`, and `mergeForm()` for state management
- `useActionState` from React for progressive enhancement with Server Actions
- Fields require explicit `name` attribute for POST request serialization
- `form.Subscribe` component for tracking `canSubmit` and `isSubmitting` states

**Implementation approach**:

- Shared form options in a `formOpts` object
- Server Action validates with `createServerValidate()` + Zod schema
- Client component uses `useActionState` + `useForm` with `mergeForm` for server state sync

**Alternatives considered**:

- React Hook Form: Rejected — project is standardized on TanStack Form
- Uncontrolled forms with native FormData: Rejected — loses type safety and validation UX

### 5. Multi-Tenancy & Organization Scoping

**Decision**: All product queries are scoped by `organizationId` obtained from the authenticated session's `activeOrganizationId`.

**Rationale**: Constitution X mandates `organization_id` on all business entities. The existing `auth.ts` setup with better-auth's organization plugin stores `activeOrganizationId` in the session. The app layout at `src/app/(app)/layout.tsx` already redirects users without an active org.

**Key implementation details**:

- Session retrieval: `auth.api.getSession({ headers: await headers() })`
- Organization ID extraction: `session.session.activeOrganizationId`
- All repository methods accept `organizationId` as a required parameter
- Server Actions validate active organization membership before operations
- Foreign key: `organization_id UUID NOT NULL REFERENCES organization(id)`

**Alternatives considered**:

- Row-level security in PostgreSQL: Overkill for current scale; application-level scoping is sufficient
- Middleware-based org injection: Too implicit; explicit parameter passing is clearer

### 6. Product Name Search/Filtering

**Decision**: Implement case-insensitive `ILIKE` search on the `name` column.

**Rationale**: FR-007 requires search/filter capability on product names. For the initial implementation with up to 1000 products, `ILIKE` with a `%search%` pattern is sufficient. A GIN trigram index can be added later for scale.

**Key implementation details**:

- Query filter: `.where('name', 'ilike', \`%${searchTerm}%\`)`
- Applied only when search term is non-empty
- No full-text search needed for initial scope

**Alternatives considered**:

- PostgreSQL full-text search (`tsvector`/`tsquery`): Overkill for name-only search on 1000 products
- Client-side filtering: Rejected — server-side keeps data transfer minimal

### 7. URL Access to Deleted Products

**Decision**: When a user accesses a deleted product directly by URL, redirect to the active product list with a toast notification.

**Rationale**: Edge case from spec — accessing `/products/[id]` where the product is soft-deleted should not show a broken page. However, since this feature only has a list view (no individual product detail page), this concern is deferred. The list view naturally excludes deleted products.

## Unresolved Items

None — all NEEDS CLARIFICATION items have been resolved.
