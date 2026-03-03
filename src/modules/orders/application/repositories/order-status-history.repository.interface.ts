// src/modules/orders/application/repositories/order-status-history.repository.interface.ts
import type { OrderStatusHistory } from "../../domain/entities/order-status-history";
import type { OrderStatus } from "../../domain/types";
import type { OrderStatusHistoryEntry } from "../types";

export interface IOrderStatusHistoryRepository {
  /** Create a status history entry */
  create(params: {
    orderId: string;
    organizationId: string;
    previousStatus: OrderStatus | null;
    newStatus: OrderStatus;
    changedBy: string;
  }): Promise<OrderStatusHistory>;

  /** Find all status history for an order, ordered by created_at ASC */
  findByOrderId(orderId: string, organizationId: string): Promise<OrderStatusHistory[]>;

  /** Find status history enriched with actor names for detail view */
  findEntriesByOrderId(
    orderId: string,
    organizationId: string
  ): Promise<OrderStatusHistoryEntry[]>;
}
