# Server Action Contracts: Order Management Module

**Feature Branch**: `005-order-management`  
**Date**: 2026-03-03  
**Status**: Draft

## Overview

All server actions require authentication and an active organization context. Actions use the established pattern: `getSessionAndOrg()` for auth, TanStack Form `createServerValidate` for form validation, and Zod schemas for input validation. Return shapes follow existing project patterns (warehouse/product/inventory actions).

## Mutation Actions

---

### `createOrder`

Create a new order with customer name and line items. The order starts with "unpaid" status and an initial status history entry is logged.

**Signature**: `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`

**Input Fields** (via FormData):
| Field | Type | Required | Validation |
| ----------------------- | -------- | -------- | ------------------------------------------- |
| `customerName` | `string` | Yes | Non-empty after trim, max 255 chars |
| `items[0].productId` | `string` | No | Valid UUID if provided |
| `items[0].productVariantId` | `string` | No | Valid UUID if provided |
| `items[0].productName` | `string` | Yes | Non-empty after trim |
| `items[0].sku` | `string` | Yes | Non-empty after trim |
| `items[0].unitPrice` | `number` | Yes | >= 0, numeric |
| `items[0].quantity` | `number` | Yes | Integer > 0 |
| _(indexed items array)_ | | | At least 1 item required |

**Success**: Returns `undefined`. Revalidates `/orders` path.

**Recoverable Errors**:

| Condition                   | Response                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Validation fails (Zod/Form) | Returns `ServerValidateError.formState` with field errors                           |
| No line items provided      | Returns `buildServerFormErrorState(formData, "At least one line item is required")` |

**Unexpected**: Throws `Error("Failed to create order. Please try again.")`

---

### `updateOrder`

Update an order's customer name and/or line items. Only allowed while the order is in "unpaid" status. Uses optimistic locking via version check.

**Signature**: `(prev: unknown, formData: FormData) => Promise<FormState | undefined>`

**Input Fields** (via FormData):
| Field | Type | Required | Validation |
| ----------------------- | -------- | -------- | ------------------------------------------- |
| `id` | `string` | Yes | Valid UUID |
| `version` | `number` | Yes | Integer >= 1 |
| `customerName` | `string` | Yes | Non-empty after trim, max 255 chars |
| `items[N].productId` | `string` | No | Valid UUID if provided |
| `items[N].productVariantId` | `string` | No | Valid UUID if provided |
| `items[N].productName` | `string` | Yes | Non-empty after trim |
| `items[N].sku` | `string` | Yes | Non-empty after trim |
| `items[N].unitPrice` | `number` | Yes | >= 0, numeric |
| `items[N].quantity` | `number` | Yes | Integer > 0 |

**Success**: Returns `undefined`. Revalidates `/orders` and `/orders/[id]` paths.

**Recoverable Errors**:

| Condition                    | Response                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Validation fails (Zod/Form)  | Returns `ServerValidateError.formState` with field errors                                            |
| Order not found              | Returns `buildServerFormErrorState(formData, "Order not found")`                                     |
| Order not in "unpaid" status | Returns `buildServerFormErrorState(formData, "Order can only be edited while in Unpaid status")`     |
| Concurrent modification      | Returns `buildServerFormErrorState(formData, "Order was modified by another user. Please refresh.")` |
| No line items provided       | Returns `buildServerFormErrorState(formData, "At least one line item is required")`                  |

**Unexpected**: Throws `Error("Failed to update order. Please try again.")`

---

### `transitionOrderStatus`

Advance, cancel, or return an order by transitioning its status. Validates the transition against the state machine, uses optimistic locking, and logs the transition in order_status_history.

**Signature**: `(params: { orderId: string; newStatus: OrderStatus; version: number }) => Promise<{ success: true } | { success: false; error: string }>`

**Input**:
| Field | Type | Required | Validation |
| ----------- | ------------- | -------- | ------------------------------------------------ |
| `orderId` | `string` | Yes | Valid UUID |
| `newStatus` | `OrderStatus` | Yes | Valid status value |
| `version` | `number` | Yes | Integer >= 1, must match current order version |

**Success**: Returns `{ success: true }`. Revalidates `/orders` and `/orders/[orderId]` paths.

**Recoverable Errors**:

| Condition                 | Response                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Order not found           | Returns `{ success: false, error: "Order not found" }`                                     |
| Invalid status transition | Returns `{ success: false, error: "Cannot transition from {from} to {to}" }`               |
| Concurrent modification   | Returns `{ success: false, error: "Order was modified by another user. Please refresh." }` |
| Order in terminal state   | Returns `{ success: false, error: "No further transitions allowed for this order" }`       |

**Unexpected**: Throws `Error("Failed to update order status. Please try again.")`

**Note**: This is NOT a form action — it's a direct server action called via button click (not FormData). The confirmation dialog is handled client-side before calling this action.

---

## Read Actions

---

### `getOrders`

Retrieve a paginated list of orders with optional filtering by status and search by customer name. Used by the orders list page (US-2).

**Signature**: `(params: GetOrdersParams) => Promise<{ data: OrderListItem[]; total: number }>`

**Input**:
| Field | Type | Required | Validation |
| ---------------- | ------------- | -------- | ------------------------------ |
| `organizationId` | `string` | Yes | From session |
| `status` | `OrderStatus` | No | Filter by status |
| `search` | `string` | No | Customer name substring search |
| `limit` | `number` | No | Default: 20 |
| `offset` | `number` | No | Default: 0 |

**Success**: Returns `{ data: OrderListItem[], total: number }`

**Note**: Read action called from a Server Component. Joins with `user` table for `createdByName` and aggregates item count from `order_item`.

---

### `getOrderDetail`

Retrieve full order details including line items and complete status history. Used by the order detail page (US-6).

**Signature**: `(params: GetOrderDetailParams) => Promise<OrderDetail | null>`

**Input**:
| Field | Type | Required | Validation |
| ---------------- | -------- | -------- | ------------ |
| `orderId` | `string` | Yes | Valid UUID |
| `organizationId` | `string` | Yes | From session |

**Success**: Returns `OrderDetail` with nested `items` and `statusHistory` arrays, or `null` if not found.

**Note**: Read action. Performs three queries: order base data (joined with user), order items, and status history (joined with user for `changedByName`).

---

### `searchProducts`

Search for products and product variants for the product picker combobox. Returns results matching the search term with product name, SKU, and price.

**Signature**: `(params: { search: string; organizationId: string; limit?: number }) => Promise<ProductPickerItem[]>`

**Input**:
| Field | Type | Required | Validation |
| ---------------- | -------- | -------- | --------------------------------- |
| `search` | `string` | Yes | Search term (min 1 char) |
| `organizationId` | `string` | Yes | From session |
| `limit` | `number` | No | Default: 20 |

**Success**: Returns `ProductPickerItem[]` — a flat list of products and variants matching the search term.

**Note**: Searches across `product.name` and `product_variant.sku`. Products without variants appear as base items; products with variants appear as individual variant entries. Only active (non-deleted) products/variants are returned.

## Shared Types

All shared types (`OrderListItem`, `OrderDetail`, `OrderItemDetail`, `OrderStatusHistoryEntry`, `ProductPickerItem`) are canonically defined in [data-model.md — Application Layer DTOs](./data-model.md#application-layer-dtos). Contracts reference those types directly; do not duplicate definitions here.
