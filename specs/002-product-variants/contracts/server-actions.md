# Server Actions Contract: Product Variants

**Module**: `products` (extended)
**Location**: `src/modules/products/presentation/actions/`
**Date**: 2026-02-25

## Overview

Product variant mutations are exposed as Next.js Server Actions across two action files:

- `attribute.actions.ts` — Attribute and option CRUD
- `variant.actions.ts` — Variant configuration, generation, and management

Each action validates the authenticated session, extracts the active organization, and validates inputs with Zod before delegating to the application service layer. All actions follow the same authentication and authorization patterns established in `product.actions.ts`.

---

## Attribute Actions (`attribute.actions.ts`)

### `createAttribute`

Creates a new attribute in the active organization.

**Directive**: `'use server'`

**Input**:

```typescript
// Via FormData (TanStack Form)
{
  name: string; // 1-255 characters, trimmed
}
```

**Output**:

```typescript
// Success (TanStack Form — return undefined)
undefined

// Validation Error (TanStack Form ServerValidateError)
{
  errorMap: { onServer: string };
  values: { name: string };
  errors: string[];
}

// Auth → redirect to /auth/sign-in
// No Active Org → redirect to /organizations
```

**Side Effects**:

- Inserts a row into the `attribute` table
- Revalidates `/products` path cache (attributes are shown in product context)

---

### `updateAttribute`

Updates an existing attribute's name.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string; // UUID of the attribute
  name: string; // 1-255 characters, trimmed
}
```

**Output**:

```typescript
// Success
undefined

// Validation Error
{ errorMap: { onServer: string }; values: { name: string }; errors: string[]; }

// Not Found
{ errorMap: { onServer: "Attribute not found" }; values: { name: string }; errors: ["Attribute not found"]; }
```

**Side Effects**:

- Updates `name` and `updated_at` on the `attribute` row
- Revalidates `/products` path cache

---

### `softDeleteAttribute`

Soft-deletes an attribute. Does NOT cascade to variants — variants using this attribute's options remain unchanged until the attribute is removed from a specific product (FR-016).

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string;
} // UUID of the attribute
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
  error: "Attribute not found";
}
```

**Side Effects**:

- Sets `deleted_at` on the `attribute` row
- Revalidates `/products` path cache

---

### `createAttributeOption`

Adds a new option value to an existing attribute.

**Directive**: `'use server'`

**Input**:

```typescript
{
  attributeId: string; // UUID of the parent attribute
  value: string; // 1-255 characters, trimmed
}
```

**Output**:

```typescript
// Success
undefined

// Validation Error
{ errorMap: { onServer: string }; values: { value: string }; errors: string[]; }

// Attribute Not Found
{ errorMap: { onServer: "Attribute not found" }; values: { value: string }; errors: ["Attribute not found"]; }
```

**Side Effects**:

- Inserts a row into `attribute_option`
- Revalidates `/products` path cache

---

### `updateAttributeOption`

Updates an existing option's value.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string; // UUID of the option
  value: string; // 1-255 characters, trimmed
}
```

**Output**:

```typescript
// Success
undefined

// Validation Error / Not Found
{ errorMap: { onServer: string }; values: { value: string }; errors: string[]; }
```

**Side Effects**:

- Updates `value` and `updated_at` on the option row
- Revalidates `/products` path cache

---

### `deleteAttributeOption`

Attempts to hard-delete an attribute option. Blocked if referenced by variants (FR-014).

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string;
} // UUID of the option
```

**Output**:

```typescript
// Success
{
  success: true;
}

// Referenced by variants (FR-014)
{
  success: false;
  error: "This option is used by N variants. Remove those variants first.";
}

// Not Found
{
  success: false;
  error: "Attribute option not found";
}
```

**Side Effects**:

- Soft-deletes the `attribute_option` row (if not referenced)
- Revalidates `/products` path cache

---

## Variant Actions (`variant.actions.ts`)

### `assignAttributeToProduct`

Associates an attribute with a product. Sets `display_order` to the next available position.

**Directive**: `'use server'`

**Input**:

```typescript
{
  productId: string; // UUID of the product
  attributeId: string; // UUID of the attribute to assign
}
```

**Output**:

```typescript
// Success
{
  success: true;
  productAttribute: {
    id: string;
    displayOrder: number;
  }
}

// Already Assigned
{
  success: false;
  error: "This attribute is already assigned to the product.";
}

// Product or Attribute Not Found
{
  success: false;
  error: "Product not found" | "Attribute not found";
}
```

**Side Effects**:

- Inserts a row into `product_attribute` with computed `display_order`
- Revalidates `/products/[productId]` path cache

---

### `removeAttributeFromProduct`

Removes an attribute from a product. Requires confirmation if variants exist (FR-016).

**Directive**: `'use server'`

**Input**:

```typescript
{
  productId: string; // UUID of the product
  attributeId: string; // UUID of the attribute to remove
  confirmed: boolean; // User has confirmed the deactivation warning
}
```

**Output**:

```typescript
// Success (no variants affected or confirmed)
{
  success: true;
  deactivatedCount: number;
}

// Needs Confirmation (variants exist, confirmed=false)
{
  success: false;
  needsConfirmation: true;
  affectedCount: number;
  message: "Removing this attribute will deactivate all N variants that use it. Continue?";
}

// Not Found
{
  success: false;
  error: "Product attribute association not found";
}
```

**Side Effects**:

- If confirmed: soft-deletes `product_attribute` row, sets `is_active = false` on affected variants
- Revalidates `/products/[productId]` path cache

---

### `reorderProductAttributes`

Updates attribute display order on a product via drag-and-drop (FR-017).

**Directive**: `'use server'`

**Input**:

```typescript
{
  productId: string;
  orderedAttributeIds: string[]; // Attribute IDs in desired display order
}
```

**Output**:

```typescript
// Success
{
  success: true;
}

// Validation Error (mismatch between provided IDs and actual assigned attributes)
{
  success: false;
  error: "Attribute list does not match assigned attributes.";
}
```

**Side Effects**:

- Updates `display_order` on matching `product_attribute` rows (within a transaction)
- Revalidates `/products/[productId]` path cache

---

### `generateVariants`

Generates product variants from selected attribute option combinations (FR-004, FR-005).

**Directive**: `'use server'`

**Input**:

```typescript
{
  productId: string;
  // Map of attributeId → selected optionIds
  selections: Record<string, string[]>;
}
```

**Output**:

```typescript
// Success
{
  success: true;
  created: number;
  variants: Array<{ id: string; sku: string }>;
}

// Validation Error (no options selected, etc.)
{
  success: false;
  error: string;
}

// Product Not Found
{
  success: false;
  error: "Product not found";
}
```

**Side Effects**:

- Computes cartesian product of selected options
- Generates deterministic SKUs (FR-005) with collision resolution
- Inserts rows into `product_variant` and `variant_option` tables (within a transaction)
- Revalidates `/products/[productId]` path cache

---

### `updateVariant`

Updates a single variant's price, stock quantity, or SKU.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string;           // UUID of the variant
  sku?: string;         // 1-255 chars (FR-006)
  price?: number;       // Non-negative decimal (FR-008)
  stockQuantity?: number; // Non-negative integer (FR-009)
}
```

**Output**:

```typescript
// Success
{
  success: true;
  variant: {
    id: string;
    sku: string;
    price: number;
    stockQuantity: number;
  }
}

// Validation Error
{
  success: false;
  error: string;
}

// SKU Conflict (FR-007)
{
  success: false;
  error: "SKU already exists in your organization.";
}

// Not Found
{
  success: false;
  error: "Variant not found";
}
```

**Side Effects**:

- Updates specified fields and `updated_at` on the `product_variant` row
- Revalidates `/products/[productId]` path cache

---

### `toggleVariantActive`

Activates or deactivates a variant (FR-010).

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string; // UUID of the variant
  isActive: boolean; // Desired active state
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
  error: "Variant not found";
}
```

**Side Effects**:

- Updates `is_active` and `updated_at` on the variant row
- Revalidates `/products/[productId]` path cache

---

### `softDeleteVariant`

Soft-deletes a product variant.

**Directive**: `'use server'`

**Input**:

```typescript
{
  id: string;
} // UUID of the variant
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
  error: "Variant not found";
}
```

**Side Effects**:

- Sets `deleted_at` on the `product_variant` row
- Revalidates `/products/[productId]` path cache

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

All inputs are validated with Zod schemas before processing:

```typescript
const parsed = attributeSchema.safeParse({ name });
if (!parsed.success) {
  return { success: false, error: parsed.error.issues[0].message };
}
```

### Cache Revalidation

After mutations, affected paths are revalidated:

```typescript
revalidatePath("/products");
revalidatePath(`/products/${productId}`);
```

## Error Handling

- **Validation errors**: Returned as `{ success: false, error: string }` or TanStack Form error state
- **Auth failures**: Redirect to sign-in page
- **Missing org**: Redirect to organization selection
- **Database errors**: Caught and logged at error level, returned as generic error message
- **Not found**: Returned as `{ success: false, error: "... not found" }` — prevents info leakage
- **Referential integrity** (e.g., FR-014): Returned as `{ success: false, error: "This option is used by N variants..." }`
- **SKU conflict**: Returned as `{ success: false, error: "SKU already exists in your organization." }`
