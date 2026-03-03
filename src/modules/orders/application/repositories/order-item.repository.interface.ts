// src/modules/orders/application/repositories/order-item.repository.interface.ts
import type { OrderItem } from "../../domain/entities/order-item";
import type { CreateOrderItemParams } from "../types";

export interface IOrderItemRepository {
  /** Create multiple order items in a batch */
  createMany(
    orderId: string,
    organizationId: string,
    items: CreateOrderItemParams[],
  ): Promise<OrderItem[]>;

  /** Soft-delete all active items for an order */
  deleteByOrderId(orderId: string, organizationId: string): Promise<void>;

  /** Find all items for an order */
  findByOrderId(orderId: string, organizationId: string): Promise<OrderItem[]>;
}
