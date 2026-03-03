// src/modules/orders/application/repositories/order-item.repository.interface.ts
import type { OrderItem } from "../../domain/entities/order-item";
import type { CreateOrderItemParams } from "../types";

export interface IOrderItemRepository {
  /** Create multiple order items in a batch */
  createMany(
    orderId: string,
    items: CreateOrderItemParams[],
  ): Promise<OrderItem[]>;

  /** Delete all items for an order */
  deleteByOrderId(orderId: string): Promise<void>;

  /** Find all items for an order */
  findByOrderId(orderId: string): Promise<OrderItem[]>;
}
