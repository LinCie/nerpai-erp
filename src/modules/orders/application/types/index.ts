// src/modules/orders/application/types/index.ts
import type { OrderStatus } from "../../domain/types";

/** Params for creating a new order */
export interface CreateOrderParams {
  customerName: string;
  items: CreateOrderItemParams[];
  createdBy: string;
  organizationId: string;
}

export interface CreateOrderItemParams {
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number; // Numeric value (converted to NUMERIC on insert)
  quantity: number; // > 0
}

/** Params for updating an order (only while unpaid) */
export interface UpdateOrderParams {
  id: string;
  customerName: string;
  items: CreateOrderItemParams[];
  version: number; // Optimistic locking
  organizationId: string;
}

/** Params for transitioning order status */
export interface TransitionOrderStatusParams {
  orderId: string;
  newStatus: OrderStatus;
  version: number; // Optimistic locking
  changedBy: string;
  organizationId: string;
}

/** Params for listing orders */
export interface GetOrdersParams {
  organizationId: string;
  status?: OrderStatus;
  search?: string; // Customer name search
  limit?: number; // Default: 20
  offset?: number; // Default: 0
}

/** Params for getting a single order with details */
export interface GetOrderDetailParams {
  orderId: string;
  organizationId: string;
}

/** Order with item count for list display */
export interface OrderListItem {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: string;
  itemCount: number;
  version: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Order detail with items and status history */
export interface OrderDetail {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: string;
  version: number;
  createdBy: string;
  createdByName: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemDetail[];
  statusHistory: OrderStatusHistoryEntry[];
}

/** Status history entry with user name for display */
export interface OrderStatusHistoryEntry {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string;
  changedByName: string;
  createdAt: Date;
}

/** Order item detail for presentation (subset of OrderItem entity) */
export interface OrderItemDetail {
  id: string;
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

/** Product/variant search result for the product picker */
export interface ProductPickerItem {
  productId: string;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: string;
  hasVariants: boolean;
}
