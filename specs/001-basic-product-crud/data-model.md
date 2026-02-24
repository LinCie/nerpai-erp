# Data Model: Basic Product CRUD

**Feature Branch**: `001-basic-product-crud`
**Date**: 2026-02-24
**Status**: Complete

## Entities

### Product

The core entity for this feature. Represents a product in an organization's catalog.

| Column       | DB Name (snake_case) | App Name (camelCase) | Type           | Nullable | Default             | Notes                             |
| ------------ | -------------------- | -------------------- | -------------- | -------- | ------------------- | --------------------------------- |
| Primary Key  | `id`                 | `id`                 | `UUID`         | No       | `uuidv7()`          | UUID v7, auto-generated           |
| Name         | `name`               | `name`               | `VARCHAR(255)` | No       | —                   | 1-255 characters, free text       |
| Organization | `organization_id`    | `organizationId`     | `UUID`         | No       | —                   | FK → `organization.id`            |
| Created At   | `created_at`         | `createdAt`          | `TIMESTAMPTZ`  | No       | `CURRENT_TIMESTAMP` | Record creation time              |
| Updated At   | `updated_at`         | `updatedAt`          | `TIMESTAMPTZ`  | No       | `CURRENT_TIMESTAMP` | Last modification time            |
| Deleted At   | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ`  | Yes      | `NULL`              | Soft delete marker; NULL = active |

### Relationships

```
organization (1) ──────< product (many)
   └── id (PK)              └── organization_id (FK)
```

- **Organization → Products**: One organization has many products
- **Cascade behavior**: `ON DELETE CASCADE` — if an organization is deleted, its products are also deleted
- Products are always accessed through the lens of an organization (multi-tenancy)

### Indexes

| Index Name                               | Column(s)                     | Type                 | Purpose                                                                                         |
| ---------------------------------------- | ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `product_pkey`                           | `id`                          | Primary Key (B-tree) | Unique row identity                                                                             |
| `product_organization_id_idx`            | `organization_id`             | B-tree               | Fast lookup by organization (required for all queries due to multi-tenancy)                     |
| `product_organization_id_deleted_at_idx` | `organization_id, deleted_at` | B-tree               | Optimized compound index for the most common query pattern: "list active products for this org" |

### Validation Rules

| Field             | Rule                                          | Error Message                                                 |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `name`            | Required (min length 1)                       | "Product name is required"                                    |
| `name`            | Max length 255 characters                     | "Product name must be 255 characters or less"                 |
| `name`            | Trimmed (leading/trailing whitespace removed) | — (automatic)                                                 |
| `organization_id` | Required, valid UUID                          | "Organization is required" (system-enforced, not user-facing) |

### Duplicate Handling

- Duplicate product names **are allowed** within the same organization (per spec clarification)
- No unique constraint on `name` + `organization_id`

## Domain Types

### Product Entity (TypeScript)

```typescript
// src/modules/products/domain/entities/product.ts

/** Product entity as stored in the database (via Kysely codegen + CamelCasePlugin) */
export interface Product {
  id: string; // UUID v7
  name: string; // 1-255 chars
  organizationId: string; // UUID FK
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // null = active, Date = soft-deleted
}
```

### Application Layer DTOs

```typescript
// src/modules/products/application/types/index.ts

/** Params for listing products */
export interface GetProductsParams {
  organizationId: string;
  search?: string; // Optional name search filter
  includeDeleted?: boolean; // If true, returns ONLY deleted products (for Trash view)
}

/** Params for creating a product */
export interface CreateProductParams {
  name: string;
  organizationId: string;
}

/** Params for updating a product */
export interface UpdateProductParams {
  id: string;
  name: string;
  organizationId: string;
}

/** Params for soft-deleting a product */
export interface SoftDeleteProductParams {
  id: string;
  organizationId: string;
}

/** Params for restoring a product */
export interface RestoreProductParams {
  id: string;
  organizationId: string;
}
```

## State Transitions

```
┌─────────┐    create    ┌────────┐
│ (none)  │────────────→│ Active │
└─────────┘              └────────┘
                            │  ▲
                soft-delete │  │ restore
                            ▼  │
                         ┌─────────┐
                         │ Deleted │
                         └─────────┘
```

- **Active** (`deleted_at IS NULL`): Product is visible in the main product list, can be edited or soft-deleted
- **Deleted** (`deleted_at IS NOT NULL`): Product is visible only in the Trash view, can be restored

## Migration SQL (Reference)

```sql
-- Generated by: bun db:migrate:create create_product_table

CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX product_organization_id_idx ON product (organization_id);
CREATE INDEX product_organization_id_deleted_at_idx ON product (organization_id, deleted_at);
```

## Future Extension Points

The product table is designed to be extended without breaking changes:

- **Product variants**: Add a `variant` table with FK to `product.id`
- **Categories**: Add `category_id` FK column or many-to-many junction table
- **Pricing**: Add `price` decimal column or separate `price` table for price history
- **Images**: Add `image_url` column or `product_image` junction table
- **SKU/Barcode**: Add `sku` varchar column with unique constraint per org
- **Description**: Add `description` text column (nullable)

All extensions can be added via new migration files without modifying the initial schema.
