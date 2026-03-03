// src/modules/orders/infrastructure/repositories/order-status-history.repository.ts
import { db } from "@/shared/infrastructure/persistence";
import type { OrderStatusHistoryEntry } from "../../application/types";
import type { OrderStatusHistory } from "../../domain/entities/order-status-history";
import type { OrderStatus } from "../../domain/types";
import type { IOrderStatusHistoryRepository } from "../../application/repositories/order-status-history.repository.interface";

export class OrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
  async create(params: {
    orderId: string;
    organizationId: string;
    previousStatus: OrderStatus | null;
    newStatus: OrderStatus;
    changedBy: string;
  }): Promise<OrderStatusHistory> {
    const result = await db
      .insertInto("orderStatusHistory")
      .values({
        orderId: params.orderId,
        organizationId: params.organizationId,
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        changedBy: params.changedBy,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomain(result);
  }

  async findByOrderId(
    orderId: string,
    organizationId: string
  ): Promise<OrderStatusHistory[]> {
    const results = await db
      .selectFrom("orderStatusHistory")
      .selectAll()
      .where("orderId", "=", orderId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .orderBy("createdAt", "asc")
      .execute();

    return results.map((result) => this.mapToDomain(result));
  }

  async findEntriesByOrderId(
    orderId: string,
    organizationId: string
  ): Promise<OrderStatusHistoryEntry[]> {
    const results = await db
      .selectFrom("orderStatusHistory")
      .leftJoin("user", "user.id", "orderStatusHistory.changedBy")
      .select([
        "orderStatusHistory.id as id",
        "orderStatusHistory.previousStatus as previousStatus",
        "orderStatusHistory.newStatus as newStatus",
        "orderStatusHistory.changedBy as changedBy",
        "user.name as changedByName",
        "orderStatusHistory.createdAt as createdAt",
      ])
      .where("orderStatusHistory.orderId", "=", orderId)
      .where("orderStatusHistory.organizationId", "=", organizationId)
      .where("orderStatusHistory.deletedAt", "is", null)
      .orderBy("orderStatusHistory.createdAt", "asc")
      .execute();

    return results.map((result) => ({
      id: result.id,
      previousStatus: result.previousStatus as OrderStatusHistoryEntry["previousStatus"],
      newStatus: result.newStatus as OrderStatusHistoryEntry["newStatus"],
      changedBy: result.changedBy,
      changedByName: result.changedByName ?? "",
      createdAt: result.createdAt ?? new Date(),
    }));
  }

  private mapToDomain(result: {
    id: string;
    orderId: string;
    organizationId: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: string;
    createdAt: Date;
    deletedAt: Date | null;
  }): OrderStatusHistory {
    return {
      id: result.id,
      orderId: result.orderId,
      organizationId: result.organizationId,
      previousStatus: result.previousStatus as OrderStatusHistory["previousStatus"],
      newStatus: result.newStatus as OrderStatusHistory["newStatus"],
      changedBy: result.changedBy,
      createdAt: result.createdAt,
      deletedAt: result.deletedAt,
    };
  }
}

export const orderStatusHistoryRepository = new OrderStatusHistoryRepository();
