// src/modules/orders/domain/entities/order-status-history.ts
import type { OrderStatus } from "../types";

/** Order Status History — immutable audit record of a status transition */
export interface OrderStatusHistory {
  id: string; // UUID v7
  orderId: string; // FK → order.id
  organizationId: string; // FK → organization.id
  previousStatus: OrderStatus | null; // NULL for initial creation
  newStatus: OrderStatus;
  changedBy: string; // FK → user.id
  createdAt: Date;
  deletedAt: Date | null; // Constitution IX compliance
}
