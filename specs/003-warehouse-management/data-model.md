# Data Model: Warehouse Management

**Feature Branch**: `003-warehouse-management`  
**Date**: 2026-02-26  
**Status**: Draft  

## Entities

### Warehouse

The core entity representing a physical storage location within an organization. Designed for multi-tenancy with strict organization isolation and soft-delete support.

| Column | DB Name (snake_case) | App Name (camelCase) | Type | Nullable | Default | Notes |
|--------|---------------------|---------------------|------|----------|---------|-------|
| Primary Key | `id` | `id` | `UUID` | No | `uuidv7()` | UUID v7, auto-generated |
| Name | `name` | `name` | `VARCHAR(255)` | No | — | 1-255 characters, trimmed |
| Code | `code` | `code` | `VARCHAR(50)` | No | — | 1-50 chars, unique per org |
| Street Address | `street_address` | `streetAddress` | `VARCHAR(500)` | Yes | `NULL` | Full street address |
| City | `city` | `city` | `VARCHAR(100)` | Yes | `NULL` | City/municipality |
| Province/State | `province` | `province` | `VARCHAR(100)` | Yes | `NULL` | Province or state |
| Postal Code | `postal_code` | `postalCode` | `VARCHAR(20)` | Yes | `NULL` | Postal/ZIP code |
| Country | `country` | `country` | `VARCHAR(100)` | No | `'Indonesia'` | Country name |
| Contact Name | `contact_name` | `contactName` | `VARCHAR(255)` | Yes | `NULL` | Primary contact person |
| Contact Phone | `contact_phone` | `contactPhone` | `VARCHAR(50)` | Yes | `NULL` | Contact phone number |
| Contact Email | `contact_email` | `contactEmail` | `VARCHAR(255)` | Yes | `NULL` | Contact email address |
| Notes | `notes` | `notes` | `TEXT` | Yes | `NULL` | Up to 1000 chars metadata |
| Organization | `organization_id` | `organizationId` | `UUID` | No | — | FK → `organization.id` |
| Created At | `created_at` | `createdAt` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Record creation time |
| Updated At | `updated_at` | `updatedAt` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Last modification time |
| Deleted At | `deleted_at` | `deletedAt` | `TIMESTAMPTZ` | Yes | `NULL` | Soft delete marker; NULL = active |

## Relationships

```
organization (1) ──────< warehouse (many)
   └── id (PK)              └── organization_id (FK)
```

- **Organization → Warehouses**: One organization has many warehouses (multi-location support)
- **Cascade behavior**: `ON DELETE CASCADE` — if an organization is deleted, its warehouses are also deleted
- All warehouse queries MUST filter by `organization_id` for multi-tenancy isolation
- **Future Inventory Integration**: `warehouse (1) ──────< inventory (many)` — planned for next feature

## Constraints

### CHECK Constraints

| Constraint Name | Table | Expression | Spec Reference |
|----------------|-------|------------|----------------|
| `warehouse_name_not_empty` | `warehouse` | `CHECK (LENGTH(TRIM(name)) > 0)` | DIR-003 |
| `warehouse_code_not_empty` | `warehouse` | `CHECK (LENGTH(TRIM(code)) > 0)` | FR-015 |

### UNIQUE Constraints

| Constraint Name | Table | Columns | Scope | Spec Reference |
|----------------|-------|---------|-------|----------------|
| `warehouse_code_org_unique` | `warehouse` | `(code, organization_id)` WHERE `deleted_at IS NULL` | Org-wide active code uniqueness | DIR-001 |

**Note**: The unique constraint includes `WHERE deleted_at IS NULL` to allow restoring a soft-deleted warehouse or creating a new warehouse with the same code as a deleted one (FR-012 business rule).

### Foreign Key Delete Rules

| From Table | To Table | On Delete | Rationale |
|------------|----------|-----------|-----------|
| `warehouse` | `organization` | CASCADE | Organization deletion removes all its warehouses |

## Indexes

| Index Name | Table | Column(s) | Type | Purpose |
|------------|-------|-----------|------|---------|
| `warehouse_pkey` | `warehouse` | `id` | PK (B-tree) | Primary key |
| `warehouse_organization_id_idx` | `warehouse` | `organization_id` | B-tree | List warehouses by org |
| `warehouse_org_deleted_at_idx` | `warehouse` | `(organization_id, deleted_at)` | B-tree | Active warehouses for org |
| `warehouse_code_org_idx` | `warehouse` | `(code, organization_id)` | Unique B-tree | Code uniqueness enforcement |
| `warehouse_name_search_idx` | `warehouse` | `name` | B-tree | Name search/sort |
| `warehouse_city_idx` | `warehouse` | `city` | B-tree | City-based filtering |
| `warehouse_province_idx` | `warehouse` | `province` | B-tree | Province-based filtering |

### Query Optimization Notes

1. **Multi-tenancy Filter**: All queries should use `(organization_id, deleted_at)` compound index:
   ```sql
   WHERE organization_id = ? AND deleted_at IS NULL
   ```

2. **Search Optimization**: For text search across name, code, city, province:
   - Use ILIKE with leading wildcard: `WHERE name ILIKE '%search%'`
   - Consider adding `pg_trgm` extension with GIN index for fuzzy search if needed
   - Alternative: Create functional index on lowercase fields for case-insensitive exact match

3. **Code Lookup**: Warehouse code lookups are case-insensitive; store normalized (uppercase) in DB or use ILIKE:
   ```sql
   WHERE UPPER(code) = UPPER(?) AND organization_id = ?
   ```

4. **Composite Query Pattern**: For list + filter + search:
   ```sql
   SELECT * FROM warehouse
   WHERE organization_id = ?
     AND deleted_at IS NULL
     AND (name ILIKE ? OR code ILIKE ? OR city ILIKE ?)
   ORDER BY created_at DESC
   LIMIT ? OFFSET ?
   ```
   Recommended index: `CREATE INDEX warehouse_org_active_search ON warehouse (organization_id, deleted_at, created_at)`

## Validation Rules

| Entity | Field | Rule | Error Message |
|--------|-------|------|---------------|
| Warehouse | `name` | Required, 1-255 chars, trimmed | "Warehouse name is required" / "Name must be 255 characters or less" |
| Warehouse | `code` | Required, 1-50 chars, alphanumeric/hyphen/underscore only, trimmed, unique per org | "Warehouse code is required" / "Code must be 50 characters or less" / "Code can only contain letters, numbers, hyphens, and underscores" / "Warehouse code already exists" |
| Warehouse | `streetAddress` | Optional, max 500 chars | "Street address must be 500 characters or less" |
| Warehouse | `city` | Optional, max 100 chars | "City must be 100 characters or less" |
| Warehouse | `province` | Optional, max 100 chars | "Province must be 100 characters or less" |
| Warehouse | `postalCode` | Optional, max 20 chars | "Postal code must be 20 characters or less" |
| Warehouse | `country` | Required, max 100 chars, defaults to "Indonesia" | "Country is required" |
| Warehouse | `contactName` | Optional, max 255 chars | "Contact name must be 255 characters or less" |
| Warehouse | `contactPhone` | Optional, max 50 chars | "Contact phone must be 50 characters or less" |
| Warehouse | `contactEmail` | Optional, valid email format, max 255 chars | "Invalid email format" / "Email must be 255 characters or less" |
| Warehouse | `notes` | Optional, max 1000 chars | "Notes must be 1000 characters or less" |

## Domain Types

### Warehouse Entity (TypeScript)

```typescript
// src/modules/warehouses/domain/entities/warehouse.ts

/** Warehouse entity — physical storage location scoped to an organization */
export interface Warehouse {
  id: string; // UUID v7
  name: string; // 1-255 chars, trimmed
  code: string; // 1-50 chars, unique per org
  streetAddress: string | null; // Max 500 chars
  city: string | null; // Max 100 chars
  province: string | null; // Max 100 chars
  postalCode: string | null; // Max 20 chars
  country: string; // Max 100 chars, default "Indonesia"
  contactName: string | null; // Max 255 chars
  contactPhone: string | null; // Max 50 chars
  contactEmail: string | null; // Valid email format
  notes: string | null; // Max 1000 chars
  organizationId: string; // UUID FK
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // null = active
}
```

### Application Layer DTOs

```typescript
// src/modules/warehouses/application/types/index.ts

/** Params for listing warehouses */
export interface GetWarehousesParams {
  organizationId: string;
  search?: string; // Optional search across name, code, city, province
  city?: string; // Filter by city
  province?: string; // Filter by province
  includeDeleted?: boolean; // If true, returns ONLY deleted warehouses (for Trash view)
  limit?: number;
  offset?: number;
}

/** Params for getting a single warehouse */
export interface GetWarehouseParams {
  id: string;
  organizationId: string;
  includeDeleted?: boolean;
}

/** Params for creating a warehouse */
export interface CreateWarehouseParams {
  name: string;
  code: string;
  streetAddress?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string; // Default: "Indonesia"
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  organizationId: string;
}

/** Params for updating a warehouse */
export interface UpdateWarehouseParams {
  id: string;
  name: string;
  code: string; // Can validate but typically immutable
  streetAddress?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  organizationId: string;
}

/** Params for soft-deleting a warehouse */
export interface SoftDeleteWarehouseParams {
  id: string;
  organizationId: string;
}

/** Params for restoring a warehouse */
export interface RestoreWarehouseParams {
  id: string;
  organizationId: string;
}
```

## State Transitions

```
┌─────────┐    create    ┌────────┐
│ (none)  │─────────────→│ Active │
└─────────┘              └────────┘
                            │  ▲
                soft-delete │  │ restore
                            ▼  │
                         ┌─────────┐
                         │ Deleted │
                         └─────────┘
```

- **Active** (`deleted_at IS NULL`): Warehouse visible in lists, can be edited or soft-deleted
- **Deleted** (`deleted_at IS NOT NULL`): Warehouse hidden from main lists, visible in Trash, can be restored

## Migration SQL

### Migration: Create Warehouse Table

```sql
-- Migration: create_warehouse_table
-- Created: 2026-02-26
-- Description: Create warehouse table for multi-tenant storage location management

-- Up Migration
CREATE TABLE warehouse (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  street_address VARCHAR(500),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL DEFAULT 'Indonesia',
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Indexes for multi-tenancy and common queries
CREATE INDEX warehouse_organization_id_idx ON warehouse (organization_id);
CREATE INDEX warehouse_org_deleted_at_idx ON warehouse (organization_id, deleted_at);
CREATE INDEX warehouse_name_search_idx ON warehouse (name);
CREATE INDEX warehouse_city_idx ON warehouse (city);
CREATE INDEX warehouse_province_idx ON warehouse (province);

-- Unique constraint: code must be unique within an organization for active warehouses
CREATE UNIQUE INDEX warehouse_code_org_unique 
  ON warehouse (code, organization_id) 
  WHERE deleted_at IS NULL;

-- CHECK constraints for data integrity
ALTER TABLE warehouse ADD CONSTRAINT warehouse_name_not_empty 
  CHECK (LENGTH(TRIM(name)) > 0);
  
ALTER TABLE warehouse ADD CONSTRAINT warehouse_code_not_empty 
  CHECK (LENGTH(TRIM(code)) > 0);

-- Down Migration
-- DROP TABLE IF EXISTS warehouse;
```

### Migration: Add Updated At Trigger (Optional)

```sql
-- Migration: add_warehouse_updated_at_trigger
-- Description: Automatically update updated_at timestamp on row modification

-- Up Migration
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_warehouse_updated_at
  BEFORE UPDATE ON warehouse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Down Migration
-- DROP TRIGGER IF EXISTS update_warehouse_updated_at ON warehouse;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Sample Seed Data (Indonesian Locations)

```sql
-- Sample seed data for Indonesian warehouses
-- Run this after the warehouse table is created

-- Assuming organization_id exists (replace with actual UUID from your org)
-- For demo purposes, using placeholder organization UUID

INSERT INTO warehouse (
  name,
  code,
  street_address,
  city,
  province,
  postal_code,
  country,
  contact_name,
  contact_phone,
  contact_email,
  notes,
  organization_id
) VALUES
-- Kediri Warehouse
(
  'Gudang Utama Kediri',
  'WH-KDR-001',
  'Jl. Veteran No. 15, Kel. Pare, Kec. Pare',
  'Kediri',
  'Jawa Timur',
  '64213',
  'Indonesia',
  'Budi Santoso',
  '+62 812-3456-7890',
  'budi.santoso@example.com',
  'Gudang utama untuk distribusi wilayah Kediri dan sekitarnya. Kapasitas 500 pallet.',
  '00000000-0000-0000-0000-000000000001'::UUID
),
-- Surabaya Warehouse
(
  'Gudang Surabaya Timur',
  'WH-SBY-001',
  'Jl. Raya Wonokromo No. 123, Kec. Wonokromo',
  'Surabaya',
  'Jawa Timur',
  '60243',
  'Indonesia',
  'Siti Rahayu',
  '+62 811-2345-6789',
  'siti.rahayu@example.com',
  'Gudang untuk area Surabaya Timur dan sekitarnya. Lokasi strategis dekat pelabuhan.',
  '00000000-0000-0000-0000-000000000001'::UUID
),
(
  'Gudang Surabaya Barat',
  'WH-SBY-002',
  'Jl. Darmo Permai Utara No. 45, Kec. Tandes',
  'Surabaya',
  'Jawa Timur',
  '60187',
  'Indonesia',
  'Ahmad Wijaya',
  '+62 813-4567-8901',
  'ahmad.wijaya@example.com',
  'Gudang sekunder Surabaya untuk overflow inventory.',
  '00000000-0000-0000-0000-000000000001'::UUID
),
-- Jakarta Warehouse
(
  'Gudang Pusat Jakarta',
  'WH-JKT-001',
  'Jl. Daan Mogot No. 88, Kec. Cengkareng',
  'Jakarta Barat',
  'DKI Jakarta',
  '11710',
  'Indonesia',
  'Dewi Kusuma',
  '+62 814-5678-9012',
  'dewi.kusuma@example.com',
  'Gudang pusat untuk distribusi Jabodetabek. Kapasitas 1000 pallet, 20 dock.',
  '00000000-0000-0000-0000-000000000001'::UUID
),
(
  'Gudang Jakarta Timur',
  'WH-JKT-002',
  'Jl. Bekasi Timur Raya No. 200, Kec. Cakung',
  'Jakarta Timur',
  'DKI Jakarta',
  '13910',
  'Indonesia',
  'Eko Prasetyo',
  '+62 815-6789-0123',
  'eko.prasetyo@example.com',
  'Gudang untuk area Jakarta Timur dan Bekasi.',
  '00000000-0000-0000-0000-000000000001'::UUID
),
(
  'Gudang Tangerang',
  'WH-TNG-001',
  'Jl. Gatot Subroto No. 77, Kec. Cikokol',
  'Tangerang',
  'Banten',
  '15117',
  'Indonesia',
  'Rini Susanti',
  '+62 816-7890-1234',
  'rini.susanti@example.com',
  'Gudang untuk area Tangerang dan sekitarnya. Dekat bandara Soekarno-Hatta.',
  '00000000-0000-0000-0000-000000000001'::UUID
);
```

**Note**: Replace `'00000000-0000-0000-0000-000000000001'::UUID` with the actual organization ID from your database.

## Query Optimization Recommendations

### 1. Primary Query Patterns

**List Active Warehouses for Organization** (Most Common):
```sql
SELECT * FROM warehouse 
WHERE organization_id = $1 
  AND deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT $2 OFFSET $3;
```
**Index Used**: `warehouse_org_deleted_at_idx`

**Search Warehouses**:
```sql
SELECT * FROM warehouse 
WHERE organization_id = $1 
  AND deleted_at IS NULL 
  AND (
    name ILIKE $2 OR 
    code ILIKE $2 OR 
    city ILIKE $2 OR 
    province ILIKE $2
  )
ORDER BY name ASC 
LIMIT $3 OFFSET $4;
```
**Indexes Used**: `warehouse_org_deleted_at_idx` + sequential scan on text fields
**Optimization**: Consider adding `pg_trgm` extension with GIN indexes for heavy search use

**Get Warehouse by Code**:
```sql
SELECT * FROM warehouse 
WHERE UPPER(code) = UPPER($1) 
  AND organization_id = $2 
  AND deleted_at IS NULL;
```
**Index Used**: `warehouse_code_org_unique` (partial index, very efficient)

### 2. Index Strategy Summary

| Query Pattern | Recommended Index | Notes |
|--------------|-------------------|-------|
| List by org (active only) | `warehouse_org_deleted_at_idx` | Compound index covers both filters |
| Code lookup | `warehouse_code_org_unique` | Unique partial index, very fast |
| Name search/sort | `warehouse_name_search_idx` | Supports LIKE and ORDER BY |
| City filter | `warehouse_city_idx` | For geographic filtering |
| Province filter | `warehouse_province_idx` | For geographic filtering |

### 3. Performance Considerations

1. **Soft Delete Impact**: The `WHERE deleted_at IS NULL` clause is selective and works well with the compound index
2. **Text Search**: ILIKE with leading wildcard (`%search`) cannot use B-tree indexes efficiently. For high-volume search, consider:
   - Full-text search with PostgreSQL `tsvector`
   - `pg_trgm` extension with GIN indexes
   - Application-level search (e.g., Elasticsearch) for very large datasets
3. **Pagination**: Always use `ORDER BY` with pagination. Recommended: `ORDER BY created_at DESC` or `ORDER BY name ASC`
4. **Connection Pooling**: Warehouse queries are typically fast; ensure connection pool is sized appropriately

## Error Handling Scenarios

### Application-Level Errors

| Error Scenario | HTTP Status | Error Code | User Message | Resolution |
|----------------|-------------|------------|--------------|------------|
| Validation - Name required | 400 | `VALIDATION_ERROR` | "Warehouse name is required" | Provide a name |
| Validation - Name too long | 400 | `VALIDATION_ERROR` | "Name must be 255 characters or less" | Shorten the name |
| Validation - Code required | 400 | `VALIDATION_ERROR` | "Warehouse code is required" | Provide a code |
| Validation - Code format invalid | 400 | `VALIDATION_ERROR` | "Code can only contain letters, numbers, hyphens, and underscores" | Use valid characters |
| Validation - Code exists | 409 | `DUPLICATE_CODE` | "Warehouse code already exists in your organization" | Use a unique code |
| Validation - Email format | 400 | `VALIDATION_ERROR` | "Invalid email format" | Provide valid email |
| Not Found | 404 | `NOT_FOUND` | "Warehouse not found" | Check ID/permissions |
| Forbidden | 403 | `FORBIDDEN` | "You don't have permission to access this warehouse" | Check organization access |
| Database Connection | 500 | `DATABASE_ERROR` | "Unable to save warehouse. Please try again." | Retry or contact support |
| Unique Violation (race condition) | 409 | `DUPLICATE_CODE` | "Warehouse code already exists. Please choose another." | Retry with different code |

### Database-Level Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `unique_violation` (23505) | Concurrent insert with same code | Catch and convert to 409 Conflict with user-friendly message |
| `not_null_violation` (23502) | Missing required field | Should be caught by application validation before reaching DB |
| `check_violation` (23514) | CHECK constraint failed (empty name/code) | Should be caught by application validation |
| `foreign_key_violation` (23503) | Invalid organization_id | Should be caught by checking organization context first |

### Error Response Format (API/Server Actions)

```typescript
// Success response
{
  success: true,
  data: Warehouse
}

// Validation error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: {
      name: ['Warehouse name is required'],
      code: ['Warehouse code already exists']
    }
  }
}

// Not found error
{
  success: false,
  error: {
    code: 'NOT_FOUND',
    message: 'Warehouse not found'
  }
}

// Forbidden error
{
  success: false,
  error: {
    code: 'FORBIDDEN',
    message: 'You don\'t have permission to access this warehouse'
  }
}
```

## Multi-Tenancy Safeguards

### 1. Organization Isolation

**Database Level**:
- All queries MUST include `WHERE organization_id = ?`
- Foreign key constraint ensures referential integrity to `organization.id`
- `ON DELETE CASCADE` ensures data cleanup when organization is deleted

**Application Level**:
```typescript
// Repository layer - ALWAYS filter by organization
async function findById(id: string, organizationId: string): Promise<Warehouse | null> {
  return db
    .selectFrom('warehouse')
    .selectAll()
    .where('id', '=', id)
    .where('organization_id', '=', organizationId) // REQUIRED
    .where('deleted_at', 'is', null)
    .executeTakeFirst();
}

// Server Action - Validate organization context
export async function getWarehouse(params: GetWarehouseParams) {
  const session = await auth();
  if (!session?.activeOrganizationId) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'No active organization' } };
  }
  
  // Ensure params.organizationId matches session
  if (params.organizationId !== session.activeOrganizationId) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Invalid organization' } };
  }
  
  return warehouseRepository.findById(params.id, params.organizationId);
}
```

### 2. Preventing Cross-Organization Access

**Critical Checks**:
1. **Every read query** must filter by `organization_id`
2. **Every write operation** must verify the user has access to the specified organization
3. **URL parameters** for IDs should not be trusted alone; always validate against organization
4. **Cascade considerations**: When organization is deleted, all warehouses are automatically deleted (DB-level CASCADE)

**Testing Strategy**:
```typescript
// Test case: Cross-organization access should fail
test('should not return warehouse from different organization', async () => {
  const org1Warehouse = await createWarehouse({ organizationId: org1Id });
  
  // Attempt to access with org2 context
  const result = await getWarehouse({ 
    id: org1Warehouse.id, 
    organizationId: org2Id 
  });
  
  expect(result).toBeNull(); // Or return 404
});
```

## Integration Hooks for Future Inventory Table

### 1. Database Schema Preparation

The warehouse table is designed for a future `inventory` table:

```sql
-- Future migration: create_inventory_table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  warehouse_id UUID NOT NULL REFERENCES warehouse(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one inventory record per warehouse per variant
  UNIQUE (warehouse_id, product_variant_id, organization_id)
);

-- Index for common queries
CREATE INDEX inventory_warehouse_idx ON inventory (warehouse_id);
CREATE INDEX inventory_variant_idx ON inventory (product_variant_id);
CREATE INDEX inventory_org_idx ON inventory (organization_id);
```

### 2. Foreign Key Relationship Design

```
warehouse (1) ──────< inventory (many) >────── product_variant (1)
   └── id (PK)            └── warehouse_id (FK)      └── id (PK)
                          └── product_variant_id (FK)
                          └── organization_id (FK)
```

**Design Decisions**:
- `ON DELETE CASCADE` on `warehouse_id`: If warehouse is deleted, all inventory records for that warehouse are removed
- `ON DELETE CASCADE` on `product_variant_id`: If variant is deleted, inventory records are cleaned up
- Organization denormalized to `inventory` for query efficiency (avoids joins for tenant filtering)

### 3. Warehouse Aggregate Methods (Future)

```typescript
// src/modules/warehouses/application/services/warehouse-service.ts

interface WarehouseInventorySummary {
  totalSkuCount: number;
  totalQuantity: number;
  lowStockCount: number; // Items below threshold
}

interface WarehouseService {
  // Future method: Get inventory summary for a warehouse
  getInventorySummary(
    warehouseId: string, 
    organizationId: string
  ): Promise<WarehouseInventorySummary>;
  
  // Future method: Check if warehouse has any inventory before soft-delete
  hasInventory(
    warehouseId: string, 
    organizationId: string
  ): Promise<boolean>;
  
  // Future method: Validate warehouse can be deleted (no inventory or gated)
  validateCanDelete(
    warehouseId: string, 
    organizationId: string
  ): Promise<{ canDelete: boolean; reason?: string }>;
}
```

### 4. Soft-Delete Considerations with Inventory

When implementing inventory, the soft-delete behavior for warehouses should consider:

```typescript
// Pseudo-code for future delete warehouse with inventory
type DeleteResult = 
  | { success: true }
  | { success: false; error: 'HAS_INVENTORY'; inventoryCount: number }
  | { success: false; error: 'TRANSFER_REQUIRED' };

async function softDeleteWarehouse(
  id: string, 
  organizationId: string
): Promise<DeleteResult> {
  // Check if warehouse has inventory
  const hasStock = await inventoryRepository.hasStock(id, organizationId);
  
  if (hasStock) {
    // Option A: Block deletion
    return { 
      success: false, 
      error: 'HAS_INVENTORY',
      inventoryCount: await inventoryRepository.getStockCount(id, organizationId)
    };
    
    // Option B: Allow with warning (user must transfer inventory first)
    // Option C: Archive mode (keep records but mark warehouse as archived)
  }
  
  // Proceed with soft-delete
  await warehouseRepository.softDelete(id, organizationId);
  return { success: true };
}
```

### 5. Query Patterns for Future Integration

**Get warehouses with inventory summary**:
```sql
SELECT 
  w.*,
  COUNT(i.id) as sku_count,
  COALESCE(SUM(i.quantity), 0) as total_quantity
FROM warehouse w
LEFT JOIN inventory i ON i.warehouse_id = w.id
WHERE w.organization_id = $1
  AND w.deleted_at IS NULL
GROUP BY w.id;
```

**Get low stock items per warehouse**:
```sql
SELECT 
  w.name as warehouse_name,
  pv.sku,
  i.quantity,
  i.reserved_quantity
FROM warehouse w
JOIN inventory i ON i.warehouse_id = w.id
JOIN product_variant pv ON pv.id = i.product_variant_id
WHERE w.organization_id = $1
  AND w.deleted_at IS NULL
  AND i.quantity < $2; -- Threshold
```

## Future Extension Points

The warehouse table is designed to be extended without breaking changes:

- **Inventory tracking**: Add `inventory` table with FK to `warehouse.id` (planned next feature)
- **Warehouse zones**: Add `warehouse_zone` table with FK to `warehouse.id`
- **Warehouse capacity**: Add `capacity_pallets`, `capacity_volume_m3` columns
- **Geolocation**: Add `latitude`, `longitude` DECIMAL columns
- **Operating hours**: Add `opening_time`, `closing_time`, `operating_days` columns
- **Warehouse type**: Add `type` column (e.g., 'distribution', 'storage', 'cold_storage')
- **Integration IDs**: Add `external_id` column for ERP integrations
- **Warehouse transfers**: Add `warehouse_transfer` table linking source and destination warehouses
- **Audit logging**: Add `warehouse_audit_log` table for tracking all changes

All extensions can be added via new migration files without modifying the initial schema.
