// src/modules/orders/infrastructure/repositories/order-item.repository.ts
import { db } from "@/shared/infrastructure/persistence";
import type { OrderItem } from "../../domain/entities/order-item";
import type { CreateOrderItemParams } from "../../application/types";
import type { IOrderItemRepository } from "../../application/repositories/order-item.repository.interface";

export class OrderItemRepository implements IOrderItemRepository {
  async createMany(
    orderId: string,
    items: CreateOrderItemParams[]
  ): Promise<OrderItem[]> {
    if (items.length === 0) {
      return [];
    }

    const values = items.map((item) => ({
      orderId,
      productId: item.productId,
      productVariantId: item.productVariantId,
      productName: item.productName,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.quantity * item.unitPrice,
    }));

    const results = await db
      .insertInto("orderItem")
      .values(values)
      .returningAll()
      .execute();

    return results.map((result) => this.mapToDomain(result));
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await db
      .deleteFrom("orderItem")
      .where("orderId", "=", orderId)
      .execute();
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const results = await db
      .selectFrom("orderItem")
      .selectAll()
      .where("orderId", "=", orderId)
      .where("deletedAt", "is", null)
      .orderBy("createdAt", "asc")
      .execute();

    return results.map((result) => this.mapToDomain(result));
  }

  private mapToDomain(result: {
    id: string;
    orderId: string;
    productId: string | null;
    productVariantId: string | null;
    productName: string;
    sku: string;
    unitPrice: string;
    quantity: number;
    subtotal: string;
    createdAt: Date;
    deletedAt: Date | null;
  }): OrderItem {
    return {
      id: result.id,
      orderId: result.orderId,
      productId: result.productId,
      productVariantId: result.productVariantId,
      productName: result.productName,
      sku: result.sku,
      unitPrice: result.unitPrice,
      quantity: result.quantity,
      subtotal: result.subtotal,
      createdAt: result.createdAt,
      deletedAt: result.deletedAt,
    };
  }
}

export const orderItemRepository = new OrderItemRepository();
