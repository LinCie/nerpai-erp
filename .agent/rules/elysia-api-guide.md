---
trigger: model_decision
description: when working with API routes, Elysia, or Eden Treaty
---

You are an expert in Elysia REST API development with Eden Treaty.

Key Principles:

- Type-safe REST API with automatic type propagation to clients
- Elysia runs inside Next.js via catch-all route handler
- Eden Treaty provides end-to-end type safety without code generation
- better-auth integrates via Elysia `.mount()` with auth macro

Setup (Next.js catch-all route):

- Create `app/api/[[...slugs]]/route.ts`
- Elysia instance MUST use `{ prefix: '/api' }`
- Export `app.fetch` for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Export the app instance as a named export for Eden Treaty type inference

Route Handler Patterns:

- Define request body with `t.Object(...)` (TypeBox) for runtime validation
- Define response schemas per status code for type-safe error handling
- Use `guard` for shared validation across route groups
- Use `group` for resource prefix organization
- Use Elysia plugins to encapsulate feature module routes
- Example:
  ```
  const productRoutes = new Elysia({ prefix: '/products' })
    .get('/', () => getProducts(), {
      response: { 200: t.Array(ProductSchema) }
    })
    .post('/', ({ body }) => createProduct(body), {
      body: CreateProductSchema,
      response: { 200: ProductSchema, 400: ErrorSchema }
    })
  ```

Eden Treaty Client (src/lib/api-client.ts):

- Use isomorphic pattern: direct instance on server, URL on client
- Check `typeof process !== 'undefined'` (NOT `typeof window`)
- Configure `{ fetch: { credentials: 'include' } }` for auth cookies
- Example:
  ```
  import { treaty } from '@elysiajs/eden'
  import type { app } from '../app/api/[[...slugs]]/route'
  export const api =
    typeof process !== 'undefined'
      ? treaty(app).api
      : treaty<typeof app>('localhost:3000').api
  ```

Authentication via Elysia:

- Mount better-auth: `.mount(auth.handler)`
- Define auth macro with `resolve` to extract session from headers
- Use `{ auth: true }` on protected routes
- Configure CORS with `@elysiajs/cors`

Validation:

- Elysia TypeBox schemas handle runtime validation automatically
- Zod schemas can complement for complex business rule validation
- TanStack Form client validators are complementary, not a substitute

Error Handling:

- Use `error(statusCode, payload)` for typed error responses
- Define response schemas per status code for client type narrowing
- Example: `{ response: { 200: SuccessSchema, 400: ValidationErrorSchema } }`

Prohibited Patterns:

- NO `'use server'` directives
- NO server action files in `presentation/actions/`
- NO raw `fetch('/api/...')` calls from client components
- NO `FormData` submission patterns for mutations
- NO direct Eden Treaty calls from client components without TanStack Query
- NO `useEffect` + `setState` patterns for data fetching

Best Practices:

- Keep route handlers thin; delegate to application services
- One Elysia plugin per feature module in `presentation/routes/`
- Compose all module plugins into the main app via `.use()`
- Return discriminated unions for success/error states via response schemas

TanStack Query Integration (Constitution XIII):

- Client components MUST use `useQuery`/`useMutation` wrapping Eden Treaty
- Create query key factories in `presentation/queries/[resource]-keys.ts`
- Create custom hooks in `presentation/queries/use-[resource].ts`
- Invalidate relevant queries on mutation success
- Use typed Eden Treaty error responses in mutation `onError` handlers
- Example:
  ```
  // presentation/queries/product-keys.ts
  export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
  }

  // presentation/queries/use-products.ts
  export function useProducts(filters: ProductFilters) {
    return useQuery({
      queryKey: productKeys.list(filters),
      queryFn: async () => {
        const { data, error } = await api.products.get({ query: filters })
        if (error) throw error
        return data
      },
    })
  }
  ```
