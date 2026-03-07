# Research: Product Module Elysia Migration

**Feature Branch**: `006-product-elysia-migration`
**Date**: 2026-03-06

## Context7 Library References

| Library | Context7 ID | Version | Snippets Used |
|---------|------------|---------|---------------|
| Elysia Documentation | `/elysiajs/documentation` | latest | Route handlers, plugins, guard, response schemas, error handling, macros |
| Elysia (llms-full) | `/llmstxt/elysiajs_llms-full_txt` | latest | Status function, typed error responses, macro patterns |
| Eden Treaty | `/elysiajs/eden` | latest | Treaty client, error handling, config options, typed responses |
| TanStack Query | `/tanstack/query` | v5.60.5 | useQuery, useMutation, invalidateQueries, query key patterns |

## Research Topics

### 1. Elysia Route Plugin Architecture

**Decision**: Use `new Elysia({ prefix: '/resource' })` plugin pattern — one plugin per resource, composed into a single module plugin.

**Rationale**: Elysia's official best practice recommends feature-based folder structure where each module exports an Elysia instance with a prefix. This aligns perfectly with the constitution's vertical slice architecture (VII). Using `prefix` in the constructor is preferred over `.group()` to avoid deep nesting.

**Alternatives considered**:
- `.group()` nesting — rejected because it creates deeply nested code and makes it harder to test individual route groups in isolation
- Single monolithic route file — rejected because it violates separation of concerns and makes files too large
- `eden-query` auto-generated hooks — rejected because the constitution (XIII) mandates manual TanStack Query hooks wrapping Eden Treaty, and the project already has `treatyFn` and `createQueryKeys` utilities established

**Pattern**:
```typescript
// presentation/routes/product.routes.ts
const productRoutes = new Elysia({ prefix: '/products' })
  .use(authPlugin)
  .get('/', handler, { auth: true, response: { 200: Schema } })
  .post('/', handler, { auth: true, body: Schema, response: { 200: Schema, 400: Schema } })

// presentation/routes/index.ts — module plugin
const productModuleRoutes = new Elysia({ prefix: '/products' })
  .use(productRoutes)
  .use(attributeRoutes)
  .use(variantRoutes)
```

### 2. Elysia Typed Error Responses (Zod over TypeBox)

**Decision**: Use Elysia's `status(code, payload)` function with per-status-code **Zod** response schemas instead of TypeBox.

**Rationale**: Elysia 1.4.x supports Zod natively via the Standard Schema interface — no plugin needed. Context7 documentation confirms Zod schemas work interchangeably with TypeBox in `body`, `params`, `query`, and `response` fields, including per-status-code response definitions (e.g., `response: { 200: z.object(...), 400: z.object(...) }`). Eden Treaty narrows error types on the client via `error.status` switch identically regardless of whether TypeBox or Zod is used.

Using Zod instead of TypeBox provides significant advantages:
1. **Single validation library** — the project already uses Zod 4.3.6 for client-side form validation; using it for API schemas eliminates learning/maintaining a second schema DSL
2. **Schema reuse** — existing Zod schemas in `presentation/schemas/` (e.g., `productSchema`, `attributeSchema`, `variantSchema`) can be reused or extended for route handlers
3. **Team familiarity** — contributors already know Zod's API
4. **No extra dependency** — TypeBox is bundled with Elysia's `t` but Zod is already a direct project dependency

This is a justified deviation from constitution CR-003/XII which specifies TypeBox. The deviation is documented in the Complexity Tracking section.

**Verified**: GitHub issue #1497 (Zod + status codes) was only about HTTP 204 (No Content) — Elysia strips response bodies for 204 by design. All other status codes (200, 400, 404, 409) work correctly with Zod response schemas.

**Pattern**:
```typescript
import { z } from 'zod'

.post('/products', ({ body, status, user, organization }) => {
  try {
    const product = await productService.createProduct({
      name: body.name,
      organizationId: organization.id,
    });
    return product;
  } catch (e) {
    if (e instanceof SomeDomainError) {
      return status(400, { error: e.message });
    }
    throw e;
  }
}, {
  auth: true,
  body: z.object({ name: z.string().trim().min(1).max(255) }),
  response: {
    200: ProductResponseSchema,   // Zod schema
    400: z.object({ error: z.string() }),
  },
})
```

### 3. Eden Treaty Client Integration

**Decision**: Use the existing isomorphic Eden Treaty client at `src/shared/infrastructure/api-client.ts` with the existing `treatyFn` helper for TanStack Query integration.

**Rationale**: The project already has an established pattern:
- `api` client configured with `{ fetch: { credentials: 'include' } }`
- Isomorphic detection via `typeof process !== 'undefined'`
- `treatyFn()` helper that unwraps `{ data, error }` and throws on error for TanStack Query compatibility

No changes needed to the client setup.

### 4. TanStack Query v5 Patterns

**Decision**: Use `useQuery`/`useMutation` from `@tanstack/react-query` v5 with the existing `createQueryKeys` factory and `treatyFn` helper.

**Rationale**: TanStack Query v5 is already installed (^5.90.21) and configured with `QueryClientProvider` at the app root. The shared utilities `createQueryKeys` and `treatyFn` provide the exact patterns needed.

**Patterns**:
```typescript
// Query key factory
const productKeys = createQueryKeys('products');
const attributeKeys = createQueryKeys('attributes');
const variantKeys = createQueryKeys('variants');

// Query hook
function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => treatyFn(api.products.get({ query: filters })),
  });
}

// Mutation hook with cache invalidation
function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) =>
      treatyFn(api.products.post(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

### 5. Form Validation Migration Strategy

**Decision**: Replace TanStack Form's `createServerValidate` server-side validation with Elysia Zod schemas (runtime validation via Standard Schema) while keeping TanStack Form for client-side form state management with the same Zod validators.

**Rationale**: The current server actions use `createServerValidate` from `@tanstack/react-form-nextjs` for server-side validation. Since server actions are being removed, this validation moves to Elysia route-level Zod body schemas. Client-side validation via TanStack Form + Zod remains unchanged for instant feedback. Using Zod on both sides means the exact same schema definitions can be shared.

**Migration path**:
- Server validation: `createServerValidate(formOpts)` → `body: z.object({ name: z.string().trim().min(1) })`
- Client validation: Unchanged — TanStack Form + Zod schemas remain (can reuse same Zod schemas)
- Error display: `ServerValidateError.formState` → mutation `onError` handler maps API error response to form field errors

### 6. Auth & Multi-Tenancy in Route Handlers

**Decision**: Use the existing `authPlugin` with `{ auth: true }` macro on every route handler. Extract `organization.id` from the resolved auth context for multi-tenancy scoping.

**Rationale**: The auth plugin already resolves `{ user, session, organization }` from request headers. The current server actions duplicate this via `getSessionAndOrg()` — route handlers can instead rely on the macro's resolved context, eliminating boilerplate.

**Pattern**:
```typescript
.get('/products', ({ user, organization }) => {
  // organization is guaranteed non-null when auth: true
  return productService.getProducts({
    organizationId: organization.id,
  });
}, { auth: true })
```

**Open question resolved**: The auth macro returns `organization` from `auth.api.getFullOrganization({ headers })`. Need to verify the shape includes `id` — confirmed by reviewing `auth-plugin.ts`, which returns the full organization object.

### 7. Component Migration Approach

**Decision**: Migrate components incrementally per resource (products → attributes → variants). Each component that currently calls a server action is refactored to use a TanStack Query mutation hook.

**Rationale**: Components currently use `useFormState`/`useActionState` with server action functions. The migration replaces:
- `useActionState(serverAction, initialState)` → `useMutation({ mutationFn })` + form `onSubmit`
- `revalidatePath()` → `queryClient.invalidateQueries()`
- `router.refresh()` → automatic via query invalidation

Server components that call services directly for SSR data (`product-list-server.tsx`, `attribute-list-server.tsx`) remain unchanged per the spec's assumption that server-side rendering continues to call services directly.

### 8. Route Prefix Strategy

**Decision**: All product module routes mount under `/api/products/*` with sub-resources at `/api/products/attributes/*` and `/api/products/variants/*`.

**Rationale**: The main Elysia app already uses `{ prefix: '/api' }`. Product module routes compose as:
- Products: `GET /api/products`, `POST /api/products`, `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`, `POST /api/products/:id/restore`
- Attributes: `GET /api/products/attributes`, `POST /api/products/attributes`, `PUT /api/products/attributes/:id`, `DELETE /api/products/attributes/:id`, `POST /api/products/attributes/:id/options`, etc.
- Variants: Nested under product: `GET /api/products/:productId/variants`, etc.

**Alternative considered**: Flat routes (`/api/attributes`, `/api/variants`) — rejected because attributes and variants are subordinate to the products domain and the module boundary is cleaner with nesting.
