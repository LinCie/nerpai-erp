# Data Model: Product Module Elysia Migration

**Branch**: `006-product-elysia-migration` | **Date**: 2026-03-06

> No database schema changes. This document covers API-layer data structures only.

## Existing Database Entities (Unchanged)

### Product
| Field | DB Column | Type | Constraints |
|-------|-----------|------|-------------|
| id | `id` | UUID v7 | PK, auto-generated |
| name | `name` | varchar(255) | NOT NULL, CHECK(trim) |
| description | `description` | text | nullable |
| organizationId | `organization_id` | UUID | FK → organization.id, NOT NULL |
| createdAt | `created_at` | timestamp | NOT NULL, default now() |
| updatedAt | `updated_at` | timestamp | NOT NULL, default now() |
| deletedAt | `deleted_at` | timestamp | nullable (soft delete) |

### Attribute
| Field | DB Column | Type | Constraints |
|-------|-----------|------|-------------|
| id | `id` | UUID v7 | PK, auto-generated |
| name | `name` | varchar(255) | NOT NULL, CHECK(trim) |
| organizationId | `organization_id` | UUID | FK → organization.id, NOT NULL |
| createdAt | `created_at` | timestamp | NOT NULL |
| updatedAt | `updated_at` | timestamp | NOT NULL |
| deletedAt | `deleted_at` | timestamp | nullable (soft delete) |

### AttributeOption
| Field | DB Column | Type | Constraints |
|-------|-----------|------|-------------|
| id | `id` | UUID v7 | PK, auto-generated |
| value | `value` | varchar(255) | NOT NULL |
| attributeId | `attribute_id` | UUID | FK → attribute.id, NOT NULL |
| organizationId | `organization_id` | UUID | FK → organization.id, NOT NULL |
| createdAt | `created_at` | timestamp | NOT NULL |

### ProductAttribute
| Field | DB Column | Type | Constraints |
|-------|-----------|------|-------------|
| id | `id` | UUID v7 | PK, auto-generated |
| productId | `product_id` | UUID | FK → product.id, NOT NULL |
| attributeId | `attribute_id` | UUID | FK → attribute.id, NOT NULL |
| displayOrder | `display_order` | integer | NOT NULL, default 0 |
| organizationId | `organization_id` | UUID | FK → organization.id, NOT NULL |
| createdAt | `created_at` | timestamp | NOT NULL |
| | | | UNIQUE(product_id, attribute_id) |

### ProductVariant
| Field | DB Column | Type | Constraints |
|-------|-----------|------|-------------|
| id | `id` | UUID v7 | PK, auto-generated |
| productId | `product_id` | UUID | FK → product.id, NOT NULL |
| sku | `sku` | varchar(255) | NOT NULL |
| price | `price` | decimal | NOT NULL, CHECK(>= 0) |
| isActive | `is_active` | boolean | NOT NULL, default true |
| organizationId | `organization_id` | UUID | FK → organization.id, NOT NULL |
| createdAt | `created_at` | timestamp | NOT NULL |
| updatedAt | `updated_at` | timestamp | NOT NULL |
| deletedAt | `deleted_at` | timestamp | nullable (soft delete) |

### VariantOption
| Field | DB Column | Type | Constraints |
|-------|-----------|------|-------------|
| id | `id` | UUID v7 | PK, auto-generated |
| variantId | `variant_id` | UUID | FK → product_variant.id, NOT NULL |
| attributeOptionId | `attribute_option_id` | UUID | FK → attribute_option.id, NOT NULL |
| organizationId | `organization_id` | UUID | FK → organization.id, NOT NULL |
| createdAt | `created_at` | timestamp | NOT NULL |

## API Data Structures (New)

### Zod Request/Response Schemas

These schemas use Zod (v4.3.6, already a project dependency) via Elysia's Standard Schema support for runtime validation and type inference. Existing Zod schemas in `presentation/schemas/` are reused where applicable.

#### Shared Error Schemas

```typescript
import { z } from 'zod'

const errorResponse = z.object({ error: z.string() })
const successResponse = z.object({ success: z.literal(true) })
```

#### Product Schemas

```typescript
// Request bodies (reuse existing productSchema from presentation/schemas/)
const createProductBody = z.object({
  name: z.string().trim().min(1).max(255),
})

const updateProductBody = z.object({
  name: z.string().trim().min(1).max(255),
})

// Response schemas
const productResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const productListResponse = z.array(productResponse)
```

#### Attribute Schemas

```typescript
// Request bodies (reuse existing attributeSchema/attributeOptionSchema)
const createAttributeBody = z.object({
  name: z.string().trim().min(1).max(255),
})

const updateAttributeBody = z.object({
  name: z.string().trim().min(1).max(255),
})

const createAttributeOptionBody = z.object({
  value: z.string().trim().min(1).max(255),
})

const updateAttributeOptionBody = z.object({
  value: z.string().trim().min(1).max(255),
})

// Response schemas
const attributeOptionResponse = z.object({
  id: z.string().uuid(),
  value: z.string(),
  attributeId: z.string().uuid(),
})

const attributeResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const attributeWithOptionsResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  options: z.array(attributeOptionResponse),
})
```

#### Variant Schemas

```typescript
// Request bodies (reuse/extend existing variant schemas)
const assignAttributeBody = z.object({
  attributeId: z.string().uuid(),
})

const removeAttributeQuery = z.object({
  confirmed: z.coerce.boolean().optional().default(false),
})

const reorderAttributesBody = z.object({
  orderedAttributeIds: z.array(z.string().uuid()).min(1),
})

const generateVariantsBody = z.object({
  selections: z.record(z.string(), z.array(z.string().uuid())),
  onlyNew: z.boolean().optional().default(false),
})

const updateVariantBody = z.object({
  sku: z.string().trim().min(1).max(255).optional(),
  price: z.number().min(0).optional(),
})

const toggleVariantActiveBody = z.object({
  isActive: z.boolean(),
})

const checkSkuBody = z.object({
  sku: z.string().min(1),
  excludeVariantId: z.string().uuid().optional(),
})

// Response schemas
const variantResponse = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  price: z.number(),
  isActive: z.boolean(),
})

const generateVariantsResponse = z.object({
  created: z.number(),
  variants: z.array(z.object({
    id: z.string().uuid(),
    sku: z.string(),
  })),
  skipped: z.number().optional(),
})

const removeAttributeResponse = z.object({
  deactivatedCount: z.number(),
})

const removeAttributeConfirmationResponse = z.object({
  needsConfirmation: z.literal(true),
  affectedCount: z.number(),
  message: z.string(),
})

const skuAvailabilityResponse = z.object({
  available: z.boolean(),
})

const assignAttributeResponse = z.object({
  id: z.string().uuid(),
  displayOrder: z.number(),
})
```

## Query Key Structures

```typescript
// Products
productKeys.all         → ['products']
productKeys.lists()     → ['products', 'list']
productKeys.list(f)     → ['products', 'list', { search?: string }]
productKeys.details()   → ['products', 'detail']
productKeys.detail(id)  → ['products', 'detail', '<uuid>']

// Attributes
attributeKeys.all         → ['attributes']
attributeKeys.lists()     → ['attributes', 'list']
attributeKeys.list(f)     → ['attributes', 'list', { search?: string }]
attributeKeys.details()   → ['attributes', 'detail']
attributeKeys.detail(id)  → ['attributes', 'detail', '<uuid>']

// Variants
variantKeys.all         → ['variants']
variantKeys.lists()     → ['variants', 'list']
variantKeys.list(f)     → ['variants', 'list', { productId: '<uuid>' }]
variantKeys.details()   → ['variants', 'detail']
variantKeys.detail(id)  → ['variants', 'detail', '<uuid>']
```
