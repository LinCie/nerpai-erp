# Quickstart: Product Module Elysia Migration

**Branch**: `006-product-elysia-migration`

## Prerequisites

- Bun runtime installed
- PostgreSQL running with existing schema (no migrations needed)
- `.env` configured with database and auth credentials

## No New Dependencies

All required packages are already installed:
- `elysia` ^1.4.27
- `@elysiajs/eden` ^1.4.8
- `@elysiajs/cors` ^1.4.1
- `@tanstack/react-query` ^5.90.21
- `better-auth` ^1.4.18

## Development Workflow

```bash
# Start dev server
bun dev

# Run tests
bun test

# Lint
bun run lint

# Type check
bun tsc --noEmit
```

## File Structure After Migration

```
src/modules/products/
├── application/          # UNCHANGED
├── domain/               # UNCHANGED
├── infrastructure/       # UNCHANGED
└── presentation/
    ├── actions/          # REMOVED (3 files)
    ├── routes/           # NEW — Elysia route plugins
    │   ├── index.ts      # Module plugin (composes all routes)
    │   ├── product.routes.ts
    │   ├── attribute.routes.ts
    │   └── variant.routes.ts
    ├── queries/          # NEW — TanStack Query hooks
    │   ├── product-keys.ts
    │   ├── attribute-keys.ts
    │   ├── variant-keys.ts
    │   ├── use-products.ts
    │   ├── use-create-product.ts
    │   ├── use-update-product.ts
    │   ├── use-delete-product.ts
    │   ├── use-restore-product.ts
    │   ├── use-attributes.ts
    │   ├── use-create-attribute.ts
    │   ├── use-update-attribute.ts
    │   ├── use-delete-attribute.ts
    │   ├── use-attribute-options.ts
    │   ├── use-variants.ts
    │   ├── use-generate-variants.ts
    │   ├── use-update-variant.ts
    │   ├── use-variant-mutations.ts
    │   └── use-check-sku.ts
    ├── schemas/          # EXTENDED — Zod schemas for client + API
    │   ├── product.schema.ts       # existing (extended with response schemas)
    │   ├── attribute.schema.ts     # existing (extended with response schemas)
    │   └── variant.schema.ts       # existing (extended with response schemas)
    ├── components/       # MODIFIED — refactored to use hooks
    ├── lib/              # UNCHANGED
    └── types/            # UNCHANGED
```

## Key Patterns

### 1. Route Handler → Thin Delegation

Route handlers validate input (via Zod + Standard Schema), extract auth context (via macro), and delegate to services:

```typescript
import { Elysia } from 'elysia';
import { z } from 'zod';
import { authPlugin } from '@/shared/infrastructure/auth/auth-plugin';
import { ProductService } from '../../application/services/product.service';
import { productRepository } from '../../infrastructure/repositories/product.repository';

const service = new ProductService(productRepository);

export const productRoutes = new Elysia({ prefix: '/products' })
  .use(authPlugin)
  .get('/', async ({ organization, query }) => {
    return service.getProducts({
      organizationId: organization.id,
      search: query.search,
    });
  }, {
    auth: true,
    query: z.object({
      search: z.string().optional(),
    }),
    response: { 200: z.array(productResponse) },
  });
```

### 2. Query Hook → treatyFn + createQueryKeys

```typescript
import { useQuery } from '@tanstack/react-query';
import { createQueryKeys } from '@/shared/presentation/queries/create-query-keys';
import { treatyFn } from '@/shared/presentation/queries/treaty-fn';
import { api } from '@/shared/infrastructure/api-client';

export const productKeys = createQueryKeys('products');

export function useProducts(filters: { search?: string }) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => treatyFn(api.products.get({ query: filters })),
  });
}
```

### 3. Mutation Hook → invalidateQueries

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { treatyFn } from '@/shared/presentation/queries/treaty-fn';
import { api } from '@/shared/infrastructure/api-client';
import { productKeys } from './product-keys';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      treatyFn(api.products.post(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

### 4. Component Migration Pattern

Before (server action):
```typescript
const [state, action] = useActionState(createProduct, undefined);
<form action={action}>...</form>
```

After (TanStack Query mutation):
```typescript
const createMutation = useCreateProduct();
const handleSubmit = (data) => {
  createMutation.mutate(data, {
    onSuccess: () => onClose(),
    onError: (err) => /* display error */,
  });
};
```

## Verification Checklist

After migration, verify:
1. `bun tsc --noEmit` — no type errors
2. `bun run lint` — no lint warnings
3. All product CRUD operations work via UI
4. All attribute CRUD operations work via UI
5. Variant generation, editing, toggling work via UI
6. Form validation errors display inline
7. No `'use server'` directives remain in the products module
8. No direct server action imports remain in product components
