// src/modules/orders/infrastructure/repositories/order.repository.ts
import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
import type { Order } from "../../domain/entities/order";
import type {
  CreateOrderParams,
  GetOrdersParams,
  OrderListItem,
  UpdateOrderParams,
} from "../../application/types";
import type { IOrderRepository } from "../../application/repositories/order.repository.interface";

export class OrderRepository implements IOrderRepository {
  async create(params: CreateOrderParams): Promise<Order> {
    const result = await db
      .insertInto("order")
      .values({
        customerName: params.customerName,
        totalAmount: this.calculateTotalAmount(params.items),
        createdBy: params.createdBy,
        organizationId: params.organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomain(result);
  }

  async updateCustomerAndItems(
    params: UpdateOrderParams
  ): Promise<Order | null> {
    const result = await db
      .updateTable("order")
      .set({
        customerName: params.customerName,
        totalAmount: this.calculateTotalAmount(params.items),
        version: params.version + 1,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", params.id)
      .where("organizationId", "=", params.organizationId)
      .where("status", "=", "unpaid")
      .where("version", "=", params.version)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return result ? this.mapToDomain(result) : null;
  }

  async updateStatusWithLock(params: {
    orderId: string;
    newStatus: string;
    version: number;
    organizationId: string;
  }): Promise<Order | null> {
    const result = await db
      .updateTable("order")
      .set({
        status: params.newStatus,
        version: params.version + 1,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", params.orderId)
      .where("organizationId", "=", params.organizationId)
      .where("version", "=", params.version)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return result ? this.mapToDomain(result) : null;
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Order | null> {
    const result = await db
      .selectFrom("order")
      .selectAll()
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    return result ? this.mapToDomain(result) : null;
  }

  async findList(params: GetOrdersParams): Promise<OrderListItem[]> {
    const { organizationId, status, search, limit = 20, offset = 0 } = params;

    let query = db
      .selectFrom("order")
      .leftJoin("orderItem", (join) =>
        join
          .onRef("orderItem.orderId", "=", "order.id")
          .on("orderItem.deletedAt", "is", null)
      )
      .leftJoin("user", "user.id", "order.createdBy")
      .select([
        "order.id",
        "order.customerName",
        "order.status",
        "order.totalAmount",
        "order.version",
        "order.createdBy",
        "user.name as createdByName",
        "order.createdAt",
        "order.updatedAt",
      ])
      .select(db.fn.count("orderItem.id").as("itemCount"))
      .where("order.organizationId", "=", organizationId)
      .where("order.deletedAt", "is", null)
      .groupBy([
        "order.id",
        "order.customerName",
        "order.status",
        "order.totalAmount",
        "order.version",
        "order.createdBy",
        "user.name",
        "order.createdAt",
        "order.updatedAt",
      ])
      .orderBy("order.createdAt", "desc")
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where("order.status", "=", status);
    }

    if (search) {
      query = query.where("order.customerName", "ilike", `%${search}%`);
    }

    const results = await query.execute();

    return results.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      status: row.status as Order["status"],
      totalAmount: row.totalAmount,
      itemCount: Number(row.itemCount),
      version: row.version,
      createdBy: row.createdBy,
      createdByName: row.createdByName ?? "",
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));
  }

  async countList(params: GetOrdersParams): Promise<number> {
    const { organizationId, status, search } = params;

    let query = db
      .selectFrom("order")
      .select(db.fn.countAll().as("count"))
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null);

    if (status) {
      query = query.where("status", "=", status);
    }

    if (search) {
      query = query.where("customerName", "ilike", `%${search}%`);
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[]
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  private mapToDomain(result: {
    id: string;
    customerName: string;
    status: string;
    totalAmount: string;
    version: number;
    organizationId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Order {
    return {
      id: result.id,
      customerName: result.customerName,
      status: result.status as Order["status"],
      totalAmount: result.totalAmount,
      version: result.version,
      organizationId: result.organizationId,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
    };
  }
}

export const orderRepository = new OrderRepository();
