// src/modules/orders/application/repositories/order-status-history.repository.interface.ts
import type { OrderStatusHistory } from "../../domain/entities/order-status-history";

export interface IOrderStatusHistoryRepository {
  /** Create a status history entry */
  create(params: {
    orderId: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: string;
  }): Promise<OrderStatusHistory>;

  /** Find all status history for an order, ordered by created_at ASC */
  findByOrderId(orderId: string): Promise<OrderStatusHistory[]>;
}
