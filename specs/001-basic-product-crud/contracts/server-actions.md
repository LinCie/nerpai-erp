# Server Actions Contract: Products

**Module**: `products`
**Location**: `src/modules/products/presentation/actions/product.actions.ts`
**Date**: 2026-02-24

## Overview

All product mutations are exposed as Next.js Server Actions. These are the external interface contracts for the products module. Each action validates the authenticated session, extracts the active organization, and validates inputs with Zod before delegating to the application service.

## Actions

### `createProduct`

Creates a new product in the active organization.

**Directive**: `'use server'`

**Input**:

```typescript
// Via FormData (TanStack Form server validation)
{
  name: string; // 1-255 characters, trimmed
}
```

**Output**:

```typescript
// Success
{
  success: true;
  product: {
    id: string;
    name: string;
  }
}

// Validation Error (Zod)
{
  success: false;
  error: string;
}

// Auth Error
// Throws redirect to /auth/sign-in

// No Active Org
// Throws redirect to /organizations
```

**Side Effects**:

- Inserts a row into the `product` table
- Revalidates `/products` path cache

---

### `updateProduct`

Updates an existing active product's name.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string; // UUID of the product to update
  name: string; // 1-255 characters, trimmed
}
```

**Output**:

```typescript
// Success
{
  success: true;
  product: {
    id: string;
    name: string;
  }
}

// Validation Error
{
  success: false;
  error: string;
}

// Not Found (product doesn't exist or belongs to different org)
{
  success: false;
  error: "Product not found";
}
```

**Side Effects**:

- Updates the `name` and `updated_at` columns
- Revalidates `/products` path cache

---

### `softDeleteProduct`

Soft-deletes a product by setting its `deleted_at` timestamp.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string; // UUID of the product to soft-delete
}
```

**Output**:

```typescript
// Success
{
  success: true;
}

// Not Found
{
  success: false;
  error: "Product not found";
}
```

**Side Effects**:

- Sets `deleted_at = CURRENT_TIMESTAMP` on the product row
- Revalidates `/products` and `/products/trash` path caches

---

### `restoreProduct`

Restores a soft-deleted product by clearing its `deleted_at` timestamp.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string; // UUID of the product to restore
}
```

**Output**:

```typescript
// Success
{
  success: true;
}

// Not Found
{
  success: false;
  error: "Product not found";
}
```

**Side Effects**:

- Sets `deleted_at = NULL` on the product row
- Revalidates `/products` and `/products/trash` path caches

---

## Common Patterns

### Authentication & Authorization

Every Server Action follows this pattern before executing business logic:

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/auth/sign-in");

const organizationId = session.session.activeOrganizationId;
if (!organizationId) redirect("/organizations");
```

### Input Validation

All inputs are validated with Zod schemas before processing:

```typescript
const parsed = productSchema.safeParse({ name });
if (!parsed.success) {
  return { success: false, error: parsed.error.issues[0].message };
}
```

### Cache Revalidation

After mutations, affected paths are revalidated:

```typescript
import { revalidatePath } from "next/cache";
revalidatePath("/products");
```

## Error Handling

- **Validation errors**: Returned as `{ success: false, error: string }`
- **Auth failures**: Redirect to sign-in page
- **Missing org**: Redirect to organization selection
- **Database errors**: Caught and logged at error level, returned as generic error message
- **Not found**: Returned as `{ success: false, error: "Product not found" }` (prevents information leakage about other org's products)
