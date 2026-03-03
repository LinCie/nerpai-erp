// src/modules/orders/domain/entities/order.ts
import type { OrderStatus } from "../types";

/** Order — a customer order tracked through the fulfillment pipeline */
export interface Order {
  id: string; // UUID v7
  customerName: string; // Free-text customer identifier
  status: OrderStatus; // Current pipeline status
  totalAmount: string; // NUMERIC stored as string (Kysely pattern)
  version: number; // Optimistic locking counter
  organizationId: string; // FK → organization.id
  createdBy: string; // FK → user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // Constitution IX compliance
}
