# Data Model: Product Variants

**Feature Branch**: `002-product-variants`
**Date**: 2026-02-25
**Status**: Draft

## Entities

### Attribute

A named dimension along which products vary within an organization (e.g., "Color", "Size", "Material").

| Column       | DB Name (snake_case) | App Name (camelCase) | Type           | Nullable | Default             | Notes                             |
| ------------ | -------------------- | -------------------- | -------------- | -------- | ------------------- | --------------------------------- |
| Primary Key  | `id`                 | `id`                 | `UUID`         | No       | `uuidv7()`          | UUID v7, auto-generated           |
| Name         | `name`               | `name`               | `VARCHAR(255)` | No       | —                   | 1-255 characters, trimmed         |
| Organization | `organization_id`    | `organizationId`     | `UUID`         | No       | —                   | FK → `organization.id`            |
| Created At   | `created_at`         | `createdAt`          | `TIMESTAMPTZ`  | No       | `CURRENT_TIMESTAMP` | Record creation time              |
| Updated At   | `updated_at`         | `updatedAt`          | `TIMESTAMPTZ`  | No       | `CURRENT_TIMESTAMP` | Last modification time            |
| Deleted At   | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ`  | Yes      | `NULL`              | Soft delete marker; NULL = active |

### Attribute Option

A specific value for an attribute (e.g., "Red" for Color, "Large" for Size). Belongs to exactly one attribute.

| Column       | DB Name (snake_case) | App Name (camelCase) | Type           | Nullable | Default             | Notes                                                     |
| ------------ | -------------------- | -------------------- | -------------- | -------- | ------------------- | --------------------------------------------------------- |
| Primary Key  | `id`                 | `id`                 | `UUID`         | No       | `uuidv7()`          | UUID v7, auto-generated                                   |
| Value        | `value`              | `value`              | `VARCHAR(255)` | No       | —                   | 1-255 characters, trimmed                                 |
| Attribute    | `attribute_id`       | `attributeId`        | `UUID`         | No       | —                   | FK → `attribute.id` ON DELETE CASCADE                     |
| Organization | `organization_id`    | `organizationId`     | `UUID`         | No       | —                   | FK → `organization.id`, denormalized for query efficiency |
| Created At   | `created_at`         | `createdAt`          | `TIMESTAMPTZ`  | No       | `CURRENT_TIMESTAMP` | Record creation time                                      |
| Updated At   | `updated_at`         | `updatedAt`          | `TIMESTAMPTZ`  | No       | `CURRENT_TIMESTAMP` | Last modification time                                    |
| Deleted At   | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ`  | Yes      | `NULL`              | Soft delete marker; NULL = active                         |

### Product Attribute (Product–Attribute Association)

Join record linking a product to an attribute, with display order for SKU segment ordering and UI.

| Column        | DB Name (snake_case) | App Name (camelCase) | Type          | Nullable | Default             | Notes                                          |
| ------------- | -------------------- | -------------------- | ------------- | -------- | ------------------- | ---------------------------------------------- |
| Primary Key   | `id`                 | `id`                 | `UUID`        | No       | `uuidv7()`          | UUID v7, auto-generated                        |
| Product       | `product_id`         | `productId`          | `UUID`        | No       | —                   | FK → `product.id` ON DELETE CASCADE            |
| Attribute     | `attribute_id`       | `attributeId`        | `UUID`        | No       | —                   | FK → `attribute.id` ON DELETE CASCADE          |
| Display Order | `display_order`      | `displayOrder`       | `INTEGER`     | No       | —                   | 1-based positive integer, per-product ordering |
| Organization  | `organization_id`    | `organizationId`     | `UUID`        | No       | —                   | FK → `organization.id`, denormalized           |
| Created At    | `created_at`         | `createdAt`          | `TIMESTAMPTZ` | No       | `CURRENT_TIMESTAMP` | Record creation time                           |
| Updated At    | `updated_at`         | `updatedAt`          | `TIMESTAMPTZ` | No       | `CURRENT_TIMESTAMP` | Last modification time                         |
| Deleted At    | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ` | Yes      | `NULL`              | Soft delete marker; NULL = active              |

### Product Variant

A single orderable unit — one exact combination of attribute options. Has its own SKU, price, stock, and status.

| Column         | DB Name (snake_case) | App Name (camelCase) | Type            | Nullable | Default             | Notes                                    |
| -------------- | -------------------- | -------------------- | --------------- | -------- | ------------------- | ---------------------------------------- |
| Primary Key    | `id`                 | `id`                 | `UUID`          | No       | `uuidv7()`          | UUID v7, auto-generated                  |
| Product        | `product_id`         | `productId`          | `UUID`          | No       | —                   | FK → `product.id` ON DELETE CASCADE      |
| SKU            | `sku`                | `sku`                | `VARCHAR(255)`  | No       | —                   | Unique per org, auto-generated or manual |
| Price          | `price`              | `price`              | `DECIMAL(12,2)` | No       | `0`                 | Non-negative monetary value              |
| Stock Quantity | `stock_quantity`     | `stockQuantity`      | `INTEGER`       | No       | `0`                 | Non-negative integer                     |
| Is Active      | `is_active`          | `isActive`           | `BOOLEAN`       | No       | `true`              | Active/inactive toggle (FR-010)          |
| Organization   | `organization_id`    | `organizationId`     | `UUID`          | No       | —                   | FK → `organization.id`, denormalized     |
| Created At     | `created_at`         | `createdAt`          | `TIMESTAMPTZ`   | No       | `CURRENT_TIMESTAMP` | Record creation time                     |
| Updated At     | `updated_at`         | `updatedAt`          | `TIMESTAMPTZ`   | No       | `CURRENT_TIMESTAMP` | Last modification time                   |
| Deleted At     | `deleted_at`         | `deletedAt`          | `TIMESTAMPTZ`   | Yes      | `NULL`              | Soft delete marker; NULL = active        |

### Variant Option (Variant Configuration)

Join between a product variant and the specific attribute options that define it. Immutable after creation.

| Column            | DB Name (snake_case)   | App Name (camelCase) | Type          | Nullable | Default             | Notes                                                  |
| ----------------- | ---------------------- | -------------------- | ------------- | -------- | ------------------- | ------------------------------------------------------ |
| Primary Key       | `id`                   | `id`                 | `UUID`        | No       | `uuidv7()`          | UUID v7, auto-generated                                |
| Variant           | `product_variant_id`   | `productVariantId`   | `UUID`        | No       | —                   | FK → `product_variant.id` ON DELETE CASCADE            |
| Attribute Option  | `attribute_option_id`  | `attributeOptionId`  | `UUID`        | No       | —                   | FK → `attribute_option.id` ON DELETE RESTRICT (FR-014) |
| Product Attribute | `product_attribute_id` | `productAttributeId` | `UUID`        | No       | —                   | FK → `product_attribute.id` ON DELETE CASCADE          |
| Organization      | `organization_id`      | `organizationId`     | `UUID`        | No       | —                   | FK → `organization.id`, denormalized                   |
| Created At        | `created_at`           | `createdAt`          | `TIMESTAMPTZ` | No       | `CURRENT_TIMESTAMP` | Record creation time                                   |
| Deleted At        | `deleted_at`           | `deletedAt`          | `TIMESTAMPTZ` | Yes      | `NULL`              | Soft delete marker; NULL = active                      |

## Relationships

```
organization (1) ──────< attribute (many)
                 ──────< product (many)

attribute (1) ──────< attribute_option (many)
    └── id (PK)           └── attribute_id (FK)

product (1) ──────< product_attribute (many) >──────── attribute (1)
    └── id (PK)     └── product_id (FK)                └── attribute_id (FK)
                    └── display_order (1-based)

product (1) ──────< product_variant (many)
    └── id (PK)           └── product_id (FK)

product_variant (1) ──────< variant_option (many) >──── attribute_option (1)
    └── id (PK)             └── product_variant_id (FK)  └── attribute_option_id (FK)
                            └── product_attribute_id (FK) ─── product_attribute (1)
```

- **Organization → Attributes**: One org has many attributes (reusable across products)
- **Attribute → Attribute Options**: One attribute has many options; cascade delete from attribute
- **Product → Product Attributes**: Many-to-many through join table with `display_order`
- **Product → Product Variants**: One product has many variants; cascade delete from product
- **Product Variant → Variant Options**: One variant has many configuration entries (one per attribute)
- **Variant Option → Attribute Option**: Immutable reference; DELETE RESTRICT prevents orphaning (FR-014)

## Constraints

### CHECK Constraints

| Constraint Name                            | Table               | Expression                    | Spec Reference |
| ------------------------------------------ | ------------------- | ----------------------------- | -------------- |
| `product_variant_price_non_negative`       | `product_variant`   | `CHECK (price >= 0)`          | DIR-004        |
| `product_variant_stock_non_negative`       | `product_variant`   | `CHECK (stock_quantity >= 0)` | DIR-003        |
| `product_attribute_display_order_positive` | `product_attribute` | `CHECK (display_order > 0)`   | DIR-005        |

### UNIQUE Constraints

| Constraint Name                          | Table               | Columns                                      | Scope                                  | Spec Reference |
| ---------------------------------------- | ------------------- | -------------------------------------------- | -------------------------------------- | -------------- |
| `product_variant_sku_org_unique`         | `product_variant`   | `(sku, organization_id)`                     | Org-wide SKU uniqueness                | DIR-001        |
| `product_attribute_product_attr_unique`  | `product_attribute` | `(product_id, attribute_id)`                 | Prevent duplicate attribute assignment | Implicit       |
| `product_attribute_display_order_unique` | `product_attribute` | `(product_id, display_order)`                | Unique order per product               | DIR-005        |
| `variant_option_variant_attr_unique`     | `variant_option`    | `(product_variant_id, product_attribute_id)` | One option per attribute per variant   | Implicit       |

### Foreign Key Delete Rules

| From Table          | To Table            | On Delete | Rationale                                          |
| ------------------- | ------------------- | --------- | -------------------------------------------------- |
| `attribute_option`  | `attribute`         | CASCADE   | Deleting attribute removes its options             |
| `product_attribute` | `product`           | CASCADE   | Deleting product removes its attribute assignments |
| `product_attribute` | `attribute`         | CASCADE   | Deleting attribute removes product assignments     |
| `product_variant`   | `product`           | CASCADE   | Deleting product removes its variants              |
| `variant_option`    | `product_variant`   | CASCADE   | Deleting variant removes its configuration         |
| `variant_option`    | `attribute_option`  | RESTRICT  | FR-014: Block deletion of referenced options       |
| `variant_option`    | `product_attribute` | CASCADE   | Removing attribute from product cascades           |

## Indexes

| Index Name                            | Table               | Column(s)                       | Type          | Purpose                   |
| ------------------------------------- | ------------------- | ------------------------------- | ------------- | ------------------------- |
| `attribute_pkey`                      | `attribute`         | `id`                            | PK (B-tree)   | Primary key               |
| `attribute_organization_id_idx`       | `attribute`         | `organization_id`               | B-tree        | List attributes by org    |
| `attribute_org_deleted_at_idx`        | `attribute`         | `(organization_id, deleted_at)` | B-tree        | Active attributes for org |
| `attribute_option_pkey`               | `attribute_option`  | `id`                            | PK (B-tree)   | Primary key               |
| `attribute_option_attribute_id_idx`   | `attribute_option`  | `attribute_id`                  | B-tree        | Options for an attribute  |
| `attribute_option_org_deleted_at_idx` | `attribute_option`  | `(organization_id, deleted_at)` | B-tree        | Active options for org    |
| `product_attribute_pkey`              | `product_attribute` | `id`                            | PK (B-tree)   | Primary key               |
| `product_attribute_product_id_idx`    | `product_attribute` | `product_id`                    | B-tree        | Attributes for a product  |
| `product_variant_pkey`                | `product_variant`   | `id`                            | PK (B-tree)   | Primary key               |
| `product_variant_product_id_idx`      | `product_variant`   | `product_id`                    | B-tree        | Variants for a product    |
| `product_variant_org_deleted_at_idx`  | `product_variant`   | `(organization_id, deleted_at)` | B-tree        | Active variants for org   |
| `product_variant_sku_org_idx`         | `product_variant`   | `(sku, organization_id)`        | Unique B-tree | SKU collision checks      |
| `variant_option_pkey`                 | `variant_option`    | `id`                            | PK (B-tree)   | Primary key               |
| `variant_option_variant_id_idx`       | `variant_option`    | `product_variant_id`            | B-tree        | Options for a variant     |

## Validation Rules

| Entity            | Field            | Rule                                  | Error Message                                                                  |
| ----------------- | ---------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Attribute         | `name`           | Required, 1-255 chars, trimmed        | "Attribute name is required" / "Attribute name must be 255 characters or less" |
| Attribute Option  | `value`          | Required, 1-255 chars, trimmed        | "Option value is required" / "Option value must be 255 characters or less"     |
| Product Variant   | `sku`            | Required, 1-255 chars, unique per org | "SKU is required" / "SKU must be unique"                                       |
| Product Variant   | `price`          | Non-negative decimal                  | "Price must be a non-negative value"                                           |
| Product Variant   | `stock_quantity` | Non-negative integer                  | "Stock quantity must be a non-negative integer"                                |
| Product Attribute | `display_order`  | Positive integer, unique per product  | "Display order must be a positive integer"                                     |

## Domain Types

### Attribute Entity (TypeScript)

```typescript
// src/modules/products/domain/entities/attribute.ts

/** Attribute entity — named variant dimension scoped to an organization */
export interface Attribute {
  id: string; // UUID v7
  name: string; // 1-255 chars
  organizationId: string; // UUID FK
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Attribute Option Entity (TypeScript)

```typescript
// src/modules/products/domain/entities/attribute-option.ts

/** Attribute Option entity — specific value for an attribute */
export interface AttributeOption {
  id: string; // UUID v7
  value: string; // 1-255 chars
  attributeId: string; // UUID FK → attribute.id
  organizationId: string; // UUID FK (denormalized)
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Product Attribute Entity (TypeScript)

```typescript
// src/modules/products/domain/entities/product-attribute.ts

/** Product Attribute — join record linking product to attribute with display order */
export interface ProductAttribute {
  id: string; // UUID v7
  productId: string; // UUID FK → product.id
  attributeId: string; // UUID FK → attribute.id
  displayOrder: number; // Positive integer, 1-based
  organizationId: string; // UUID FK (denormalized)
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Product Variant Entity (TypeScript)

```typescript
// src/modules/products/domain/entities/product-variant.ts

/** Product Variant — single orderable unit with its own SKU, price, stock */
export interface ProductVariant {
  id: string; // UUID v7
  productId: string; // UUID FK → product.id
  sku: string; // Unique per org
  price: number; // Non-negative decimal
  stockQuantity: number; // Non-negative integer
  isActive: boolean; // Active/inactive status
  organizationId: string; // UUID FK (denormalized)
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Variant Option Entity (TypeScript)

```typescript
// src/modules/products/domain/entities/variant-option.ts

/** Variant Option — immutable join linking variant to its defining attribute options */
export interface VariantOption {
  id: string; // UUID v7
  productVariantId: string; // UUID FK → product_variant.id
  attributeOptionId: string; // UUID FK → attribute_option.id
  productAttributeId: string; // UUID FK → product_attribute.id
  organizationId: string; // UUID FK (denormalized)
  createdAt: Date;
  deletedAt: Date | null;
}
```

## State Transitions

### Product Variant Lifecycle

```
┌─────────┐   generate    ┌────────┐
│ (none)  │──────────────→│ Active │
└─────────┘               └────────┘
                              │  ▲
              deactivate (FR-010) │  │ activate (FR-010)
                              ▼  │
                           ┌──────────┐
                           │ Inactive │
                           └──────────┘
                              │  ▲
              soft-delete     │  │ restore
                              ▼  │
                           ┌─────────┐
                           │ Deleted │
                           └─────────┘
```

- **Active** (`is_active = true AND deleted_at IS NULL`): Variant visible, orderable, editable
- **Inactive** (`is_active = false AND deleted_at IS NULL`): Variant visible but greyed out, not orderable
- **Deleted** (`deleted_at IS NOT NULL`): Variant hidden from all views, restorable

### Attribute Removal from Product (FR-016)

```
User requests attribute removal
         │
         ▼
┌─────────────────────────┐
│ Count affected variants │
│ (variants using this    │
│  attribute's options)   │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Show confirmation:      │
│ "Removing this attribute│
│  will deactivate N      │
│  variants. Continue?"   │
└─────────────────────────┘
     │                │
   Cancel           Confirm
     │                │
     ▼                ▼
  No change     Set is_active = false
                on affected variants
                + soft-delete product_attribute
```

## Migration SQL (Reference)

```sql
-- Migration: create_attribute_table

CREATE TABLE attribute (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX attribute_organization_id_idx ON attribute (organization_id);
CREATE INDEX attribute_org_deleted_at_idx ON attribute (organization_id, deleted_at);

-- Migration: create_attribute_option_table

CREATE TABLE attribute_option (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  value VARCHAR(255) NOT NULL,
  attribute_id UUID NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX attribute_option_attribute_id_idx ON attribute_option (attribute_id);
CREATE INDEX attribute_option_org_deleted_at_idx ON attribute_option (organization_id, deleted_at);

-- Migration: create_product_attribute_table

CREATE TABLE product_attribute (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX product_attribute_product_id_idx ON product_attribute (product_id);
ALTER TABLE product_attribute ADD CONSTRAINT product_attribute_product_attr_unique UNIQUE (product_id, attribute_id);
ALTER TABLE product_attribute ADD CONSTRAINT product_attribute_display_order_unique UNIQUE (product_id, display_order);
ALTER TABLE product_attribute ADD CONSTRAINT product_attribute_display_order_positive CHECK (display_order > 0);

-- Migration: create_product_variant_table

CREATE TABLE product_variant (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  sku VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX product_variant_product_id_idx ON product_variant (product_id);
CREATE INDEX product_variant_org_deleted_at_idx ON product_variant (organization_id, deleted_at);
ALTER TABLE product_variant ADD CONSTRAINT product_variant_sku_org_unique UNIQUE (sku, organization_id);
ALTER TABLE product_variant ADD CONSTRAINT product_variant_price_non_negative CHECK (price >= 0);
ALTER TABLE product_variant ADD CONSTRAINT product_variant_stock_non_negative CHECK (stock_quantity >= 0);

-- Migration: create_variant_option_table

CREATE TABLE variant_option (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
  attribute_option_id UUID NOT NULL REFERENCES attribute_option(id) ON DELETE RESTRICT,
  product_attribute_id UUID NOT NULL REFERENCES product_attribute(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX variant_option_variant_id_idx ON variant_option (product_variant_id);
ALTER TABLE variant_option ADD CONSTRAINT variant_option_variant_attr_unique UNIQUE (product_variant_id, product_attribute_id);
```

## Future Extension Points

- **Per-variant images**: Add `variant_image` table with FK to `product_variant.id`
- **Bulk price editing**: Service layer method operating on multiple variant IDs
- **Price history**: Add `variant_price_history` table with FK to `product_variant.id`
- **Inventory movements**: Add `stock_movement` table with FK to `product_variant.id`
- **Barcode support**: Add `barcode` column to `product_variant`
- **CSV import/export**: Service layer method that maps CSV rows to variant creation params
- **Order integration**: `order_line.product_variant_id` FK (referenced in spec's Future Extensions)
