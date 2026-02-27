# Server Actions Contract: Warehouse Management

**Module**: `warehouses`
**Location**: `src/modules/warehouses/presentation/actions/`
**Date**: 2026-02-26

## Overview

Warehouse CRUD mutations are exposed as Next.js Server Actions in a single action file:

- `warehouse.actions.ts` — Warehouse create, update, soft-delete, restore, and search

Each action validates the authenticated session, extracts the active organization (redirecting when missing), and validates inputs with Zod before delegating to the application service layer. All actions follow the same authentication and authorization patterns established in `product.actions.ts`.

---

## Form Actions (TanStack Form Integration)

### `createWarehouse`

Creates a new warehouse in the active organization.

**Directive**: `'use server'`

**Input**:

```typescript
// Via FormData (TanStack Form)
{
  name: string; // 1-255 chars, trimmed (required)
  code: string; // 1-50 chars, alphanumeric/hyphen/underscore (required)
  streetAddress: string; // Max 500 chars (optional, may be "")
  city: string; // Max 100 chars (optional, may be "")
  province: string; // Max 100 chars (optional, may be "")
  postalCode: string; // Max 20 chars (optional, may be "")
  country: string; // Max 100 chars (defaults to "Indonesia")
  contactName: string; // Max 255 chars (optional, may be "")
  contactPhone: string; // Max 50 chars (optional, may be "")
  contactEmail: string; // Valid email format, max 255 chars (optional, may be "")
  notes: string; // Max 1000 chars (optional, may be "")
}
```

**Output**:

```typescript
// Success (TanStack Form — return undefined)
undefined

// Validation Error (TanStack Form ServerValidateError)
{
  errorMap: { onServer: string };
  values: { name: string; code: string; /* ... */ };
  errors: string[];
}

// Duplicate Code (server validation error via errorMap)
{
  errorMap: { onServer: "Warehouse code already exists in your organization" };
  values: { name: string; code: string; /* ... */ };
  errors: ["Warehouse code already exists in your organization"];
}

// Auth → redirect to /auth/sign-in
// No Active Org → redirect to /organizations
// Forbidden (active org present but unauthorized) → typed error state
```

**Side Effects**:

- Inserts a row into the `warehouse` table
- Revalidates `/warehouses` path cache

---

### `updateWarehouse`

Updates an existing warehouse's details. **Code field is immutable** — any `code` value in FormData is ignored server-side (FR-018).

**Directive**: `'use server'`

**Input**:

```typescript
// Via FormData (TanStack Form)
{
  id: string; // UUID of the warehouse (hidden field)
  name: string; // 1-255 chars, trimmed (required)
  // code: EXCLUDED — immutable after creation (FR-018)
  streetAddress: string; // Max 500 chars (optional, may be "")
  city: string; // Max 100 chars (optional, may be "")
  province: string; // Max 100 chars (optional, may be "")
  postalCode: string; // Max 20 chars (optional, may be "")
  country: string; // Max 100 chars (required)
  contactName: string; // Max 255 chars (optional, may be "")
  contactPhone: string; // Max 50 chars (optional, may be "")
  contactEmail: string; // Valid email format, max 255 chars (optional, may be "")
  notes: string; // Max 1000 chars (optional, may be "")
}
```

**Output**:

```typescript
// Success
undefined

// Validation Error
{
  errorMap: { onServer: string };
  values: { name: string; /* ... */ };
  errors: string[];
}

// Not Found
{
  errorMap: { onServer: "Warehouse not found" };
  values: { name: string; /* ... */ };
  errors: ["Warehouse not found"];
}

// Forbidden (active org present but unauthorized)
{
  errorMap: { onServer: "Forbidden" };
  values: { name: string; /* ... */ };
  errors: ["Forbidden"];
}

// No Active Org → redirect to /organizations
```

**Side Effects**:

- Updates warehouse row fields and `updated_at`
- Revalidates `/warehouses` path cache

---

## Non-Form Actions

### `softDeleteWarehouse`

Soft-deletes a warehouse.

**Directive**: `'use server'`

**Input**:

```typescript
// Via FormData (hidden field)
{
  id: string;
} // UUID of the warehouse
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
  error: "Warehouse not found";
}

// Validation Error
{
  success: false;
  error: "Invalid warehouse id";
}

// Forbidden (active org present but unauthorized)
{
  success: false;
  error: "Forbidden";
}
```

**Side Effects**:

- Sets `deleted_at` on the warehouse row
- Revalidates `/warehouses` path cache

---

### `restoreWarehouse`

Restores a soft-deleted warehouse.

**Directive**: `'use server'`

**Input**:

```typescript
// Via FormData (hidden field)
{
  id: string;
} // UUID of the warehouse
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
  error: "Warehouse not found";
}

// Validation Error
{
  success: false;
  error: "Invalid warehouse id";
}

// Forbidden (active org present but unauthorized)
{
  success: false;
  error: "Forbidden";
}
```

**Side Effects**:

- Sets `deleted_at` to `NULL` on the warehouse row
- Revalidates `/warehouses` path cache

---

## Common Patterns

### Authentication & Authorization

Every Server Action follows this pattern (same as existing `product.actions.ts`):

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/auth/sign-in");

const organizationId = session.session.activeOrganizationId;
if (!organizationId) redirect("/organizations");
```

### Input Validation

Form actions use TanStack Form's `createServerValidate()` for Zod validation:

```typescript
const validateCreateWarehouseForm = createServerValidate({
  ...createWarehouseFormOptions,
  onServerValidate: () => undefined,
});
```

Non-form actions validate via direct Zod schema parsing.

### Empty String → null Conversion

Optional text fields that arrive as empty strings (`""`) from FormData MUST be converted to `null` before persistence:

```typescript
const streetAddress = validatedData.streetAddress?.trim() || null;
```

### Code Uniqueness Check (Create Only)

Before creating a warehouse, check for existing code within the organization (including soft-deleted — FR-012):

```typescript
const existing = await warehouseRepository.findByCode(
  validatedData.code,
  organizationId,
);
if (existing) {
  return buildServerFormErrorState(
    formData,
    "Warehouse code already exists in your organization",
  );
}
```

### Cache Revalidation

```typescript
revalidatePath("/warehouses");
```

## Error Handling

- **Validation errors**: Returned via TanStack Form `ServerValidateError` (form actions) or `{ success: false, error }` (non-form actions)
- **Auth failures**: Redirect to `/auth/sign-in`
- **Missing org**: Redirect to `/organizations`
- **Forbidden access**: Returned as explicit typed error response
- **Database errors**: Caught and logged at error level, re-thrown as generic error
- **Not found**: Returned as error state — prevents info leakage
- **Duplicate code**: Returned as server form validation error via `errorMap`
- **DB unique violation (race condition)**: Caught via PostgreSQL error code `23505`, converted to user-friendly duplicate code message
