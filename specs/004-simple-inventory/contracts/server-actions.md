# Server Action Contracts: Simple Inventory Module

**Feature Branch**: `004-simple-inventory`  
**Date**: 2026-03-02  
**Status**: Draft

## Overview

All server actions require authentication and an active organization context. Actions use the established pattern: `getSessionAndOrg()` for auth, TanStack Form `createServerValidate` for form validation, and Zod schemas for input validation. Return shapes follow existing project patterns (warehouse/product actions).

## Actions

---

### `receiveStock`

Record incoming stock for a product/variant at a warehouse.

**Signature**: `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`

**Input Fields** (via FormData):
| Field | Type | Required | Validation |
| ------------------ | -------- | -------- | ---------------------------------- |
| `productId` | `string` | Yes | Valid UUID, references active product |
| `productVariantId` | `string` | No | Valid UUID if provided, must belong to product |
| `warehouseId` | `string` | Yes | Valid UUID, references active warehouse |
| `quantity` | `number` | Yes | Integer > 0 |
| `notes` | `string` | No | Max 1000 chars |

**Success**: Returns `undefined`. Revalidates `/inventory` path.

**Recoverable Errors**:

| Condition                   | Response                                                                   |
| --------------------------- | -------------------------------------------------------------------------- |
| Validation fails (Zod/Form) | Returns `ServerValidateError.formState` with field errors                  |
| Product not found           | Returns `buildServerFormErrorState(formData, "Product not found")`         |
| Warehouse not found         | Returns `buildServerFormErrorState(formData, "Warehouse not found")`       |
| Variant not found           | Returns `buildServerFormErrorState(formData, "Product variant not found")` |

**Unexpected**: Throws `Error("Failed to receive stock. Please try again.")`

---

### `dispatchStock`

Record outgoing stock for a product/variant from a warehouse.

**Signature**: `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`

**Input Fields** (via FormData):
| Field | Type | Required | Validation |
| ------------------ | -------- | -------- | ---------------------------------- |
| `productId` | `string` | Yes | Valid UUID, references active product |
| `productVariantId` | `string` | No | Valid UUID if provided, must belong to product |
| `warehouseId` | `string` | Yes | Valid UUID, references active warehouse |
| `quantity` | `number` | Yes | Integer > 0 |
| `notes` | `string` | No | Max 1000 chars |
| `confirmNegative` | `string` | No | `"true"` if user confirms negative stock |

**Success**: Returns `undefined`. Revalidates `/inventory` path.

**Recoverable Errors**:

| Condition                                      | Response                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Validation fails (Zod/Form)                    | Returns `ServerValidateError.formState` with field errors                                               |
| Product not found                              | Returns `buildServerFormErrorState(formData, "Product not found")`                                      |
| Warehouse not found                            | Returns `buildServerFormErrorState(formData, "Warehouse not found")`                                    |
| Variant not found                              | Returns `buildServerFormErrorState(formData, "Product variant not found")`                              |
| Would result in negative stock & not confirmed | Returns `buildServerFormErrorState(formData, "NEGATIVE_STOCK_WARNING:{currentStock}:{resultingStock}")` |

**Unexpected**: Throws `Error("Failed to dispatch stock. Please try again.")`

**Note**: The negative stock warning uses a structured error message format `NEGATIVE_STOCK_WARNING:{current}:{resulting}` so the client can parse and display an appropriate confirmation dialog. After user confirms, the form re-submits with `confirmNegative=true`.

---

### `adjustStock`

Manually override stock to an absolute quantity. Creates a movement with delta = (newQuantity - currentStock).

**Signature**: `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`

**Input Fields** (via FormData):
| Field | Type | Required | Validation |
| ------------------ | -------- | -------- | ---------------------------------- |
| `productId` | `string` | Yes | Valid UUID, references active product |
| `productVariantId` | `string` | No | Valid UUID if provided, must belong to product |
| `warehouseId` | `string` | Yes | Valid UUID, references active warehouse |
| `newQuantity` | `number` | Yes | Integer >= 0 |
| `notes` | `string` | No | Max 1000 chars (recommended: reason for adjustment) |

**Success**: Returns `undefined`. Revalidates `/inventory` path.

**Recoverable Errors**:

| Condition                   | Response                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Validation fails (Zod/Form) | Returns `ServerValidateError.formState` with field errors                                   |
| Product not found           | Returns `buildServerFormErrorState(formData, "Product not found")`                          |
| Warehouse not found         | Returns `buildServerFormErrorState(formData, "Warehouse not found")`                        |
| No change needed            | Returns `buildServerFormErrorState(formData, "Stock is already at the specified quantity")` |

**Unexpected**: Throws `Error("Failed to adjust stock. Please try again.")`

---

### `transferStock`

Atomically move stock from one warehouse to another. Creates two movements (dispatch + receive) within a single transaction, linked by `reference_id`.

**Signature**: `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`

**Input Fields** (via FormData):
| Field | Type | Required | Validation |
| ------------------------ | -------- | -------- | ---------------------------------- |
| `productId` | `string` | Yes | Valid UUID, references active product |
| `productVariantId` | `string` | No | Valid UUID if provided |
| `sourceWarehouseId` | `string` | Yes | Valid UUID, references active warehouse |
| `destinationWarehouseId` | `string` | Yes | Valid UUID, different from source |
| `quantity` | `number` | Yes | Integer > 0 |
| `notes` | `string` | No | Max 1000 chars |
| `confirmNegative` | `string` | No | `"true"` if user confirms negative stock at source |

**Success**: Returns `undefined`. Revalidates `/inventory` path.

**Recoverable Errors**:

| Condition                                                | Response                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Validation fails (Zod/Form)                              | Returns `ServerValidateError.formState` with field errors                                               |
| Same source and destination                              | Returns `buildServerFormErrorState(formData, "Source and destination warehouses must be different")`    |
| Product/warehouse not found                              | Returns `buildServerFormErrorState(formData, "{entity} not found")`                                     |
| Would result in negative stock at source & not confirmed | Returns `buildServerFormErrorState(formData, "NEGATIVE_STOCK_WARNING:{currentStock}:{resultingStock}")` |

**Unexpected**: Throws `Error("Failed to transfer stock. Please try again.")`

---

### `getStockLevels`

Retrieve aggregated stock levels across products and warehouses. Used by the inventory dashboard (US-1).

**Signature**: `(params: GetStockLevelsParams) => Promise<{ data: StockLevelWithDetails[]; total: number }>`

**Input**:
| Field | Type | Required | Validation |
| ---------------- | -------- | -------- | --------------------- |
| `organizationId` | `string` | Yes | From session |
| `productId` | `string` | No | Filter by product |
| `warehouseId` | `string` | No | Filter by warehouse |
| `search` | `string` | No | Text search |
| `limit` | `number` | No | Default: 50 |
| `offset` | `number` | No | Default: 0 |

**Success**: Returns `{ data: StockLevelWithDetails[], total: number }`

**Note**: This is a read action called directly from a Server Component, not a form action. It joins `stock_movement` with `product`, `product_variant`, and `warehouse` tables to include display names.

---

### `getMovementHistory`

Retrieve the chronological audit trail of stock movements.

**Signature**: `(params: GetMovementHistoryParams) => Promise<{ data: StockMovementWithDetails[]; total: number }>`

**Input**:
| Field | Type | Required | Validation |
| ------------------ | --------------- | -------- | -------------------------- |
| `organizationId` | `string` | Yes | From session |
| `productId` | `string` | No | Filter by product |
| `productVariantId` | `string | null` | No | Filter by variant |
| `warehouseId` | `string` | No | Filter by warehouse |
| `movementType` | `MovementType` | No | Filter by type |
| `limit` | `number` | No | Default: 50 |
| `offset` | `number` | No | Default: 0 |

**Success**: Returns `{ data: StockMovementWithDetails[], total: number }`

**Note**: Read action. Includes joined product name, variant SKU, warehouse name, and user name for display.

---

### `getCurrentStock`

Get the current stock level for a specific product/variant at a specific warehouse. Used before dispatch/transfer to check for negative stock warnings.

**Signature**: `(params: GetCurrentStockParams) => Promise<number>`

**Input**:
| Field | Type | Required | Validation |
| ------------------ | --------------- | -------- | --------------------- |
| `productId` | `string` | Yes | Valid UUID |
| `productVariantId` | `string | null` | No | Valid UUID if provided |
| `warehouseId` | `string` | Yes | Valid UUID |
| `organizationId` | `string` | Yes | From session |

**Success**: Returns `number` (current stock, may be negative)

## Shared Types

```typescript
/** Movement record with joined display names for UI */
interface StockMovementWithDetails {
  id: string;
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantSku: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  movementType: MovementType;
  delta: number;
  referenceId: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  organizationId: string;
  createdAt: Date;
}
```
