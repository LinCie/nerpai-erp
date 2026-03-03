// src/modules/orders/infrastructure/repositories/order-status-history.repository.ts
import { db } from "@/shared/infrastructure/persistence";
import type { OrderStatusHistory } from "../../domain/entities/order-status-history";
import type { IOrderStatusHistoryRepository } from "../../application/repositories/order-status-history.repository.interface";

export class OrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
  async create(params: {
    orderId: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: string;
  }): Promise<OrderStatusHistory> {
    const result = await db
      .insertInto("orderStatusHistory")
      .values({
        orderId: params.orderId,
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        changedBy: params.changedBy,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomain(result);
  }

  async findByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
    const results = await db
      .selectFrom("orderStatusHistory")
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
    previousStatus: string | null;
    newStatus: string;
    changedBy: string;
    createdAt: Date;
    deletedAt: Date | null;
  }): OrderStatusHistory {
    return {
      id: result.id,
      orderId: result.orderId,
      previousStatus: result.previousStatus as OrderStatusHistory["previousStatus"],
      newStatus: result.newStatus as OrderStatusHistory["newStatus"],
      changedBy: result.changedBy,
      createdAt: result.createdAt,
      deletedAt: result.deletedAt,
    };
  }
}

export const orderStatusHistoryRepository = new OrderStatusHistoryRepository();
