// src/modules/orders/infrastructure/repositories/order.repository.ts
import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
import type { Order } from "../../domain/entities/order";
import type { OrderStatus } from "../../domain/types";
import type {
  CreateOrderParams,
  GetOrdersParams,
  OrderListItem,
  ProductPickerItem,
  UpdateOrderParams,
} from "../../application/types";
import type { IOrderRepository } from "../../application/repositories/order.repository.interface";

export class OrderRepository implements IOrderRepository {
  async create(params: CreateOrderParams): Promise<Order> {
    return db.transaction().execute(async (trx) => {
      const orderResult = await trx
        .insertInto("order")
        .values({
          customerName: params.customerName,
          totalAmount: this.calculateTotalAmount(params.items),
          createdBy: params.createdBy,
          organizationId: params.organizationId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const itemValues = params.items.map((item) => ({
        orderId: orderResult.id,
        organizationId: params.organizationId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.quantity * item.unitPrice,
      }));

      if (itemValues.length > 0) {
        await trx.insertInto("orderItem").values(itemValues).execute();
      }

      await trx
        .insertInto("orderStatusHistory")
        .values({
          orderId: orderResult.id,
          organizationId: params.organizationId,
          previousStatus: null,
          newStatus: orderResult.status,
          changedBy: params.createdBy,
        })
        .execute();

      return this.mapToDomain(orderResult);
    });
  }

  async updateCustomerAndItems(
    params: UpdateOrderParams
  ): Promise<Order | null> {
    return db.transaction().execute(async (trx) => {
      const updatedOrder = await trx
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

      if (!updatedOrder) {
        return null;
      }

      await trx
        .updateTable("orderItem")
        .set({
          deletedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where("orderId", "=", params.id)
        .where("organizationId", "=", params.organizationId)
        .where("deletedAt", "is", null)
        .execute();

      const newItemValues = params.items.map((item) => ({
        orderId: params.id,
        organizationId: params.organizationId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.quantity * item.unitPrice,
      }));

      if (newItemValues.length > 0) {
        await trx.insertInto("orderItem").values(newItemValues).execute();
      }

      return this.mapToDomain(updatedOrder);
    });
  }

  async updateStatusWithLock(params: {
    orderId: string;
    newStatus: OrderStatus;
    previousStatus: OrderStatus;
    changedBy: string;
    version: number;
    organizationId: string;
  }): Promise<Order | null> {
    return db.transaction().execute(async (trx) => {
      const updatedOrder = await trx
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

      if (!updatedOrder) {
        return null;
      }

      await trx
        .insertInto("orderStatusHistory")
        .values({
          orderId: params.orderId,
          organizationId: params.organizationId,
          previousStatus: params.previousStatus,
          newStatus: params.newStatus,
          changedBy: params.changedBy,
        })
        .execute();

      return this.mapToDomain(updatedOrder);
    });
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

  async findByIdWithCreator(
    id: string,
    organizationId: string
  ): Promise<{ order: Order; createdByName: string } | null> {
    const result = await db
      .selectFrom("order")
      .leftJoin("user", "user.id", "order.createdBy")
      .select([
        "order.id as id",
        "order.customerName as customerName",
        "order.status as status",
        "order.totalAmount as totalAmount",
        "order.version as version",
        "order.organizationId as organizationId",
        "order.createdBy as createdBy",
        "order.createdAt as createdAt",
        "order.updatedAt as updatedAt",
        "order.deletedAt as deletedAt",
        "user.name as createdByName",
      ])
      .where("order.id", "=", id)
      .where("order.organizationId", "=", organizationId)
      .where("order.deletedAt", "is", null)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return {
      order: this.mapToDomain({
        id: result.id,
        customerName: result.customerName,
        status: result.status,
        totalAmount: result.totalAmount,
        version: result.version,
        organizationId: result.organizationId,
        createdBy: result.createdBy,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        deletedAt: result.deletedAt,
      }),
      createdByName: result.createdByName ?? "",
    };
  }

  async findList(params: GetOrdersParams): Promise<OrderListItem[]> {
    const { organizationId, status, search, limit = 20, offset = 0 } = params;

    let query = db
      .selectFrom("order")
      .leftJoin("orderItem", (join) =>
        join
          .onRef("orderItem.orderId", "=", "order.id")
          .onRef("orderItem.organizationId", "=", "order.organizationId")
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

  async searchProducts(params: {
    search: string;
    organizationId: string;
    limit?: number;
  }): Promise<ProductPickerItem[]> {
    const searchTerm = params.search.trim();
    if (!searchTerm) {
      return [];
    }

    const limit = params.limit ?? 20;
    const pattern = `%${searchTerm}%`;

    const [productsByName, variantsBySku] = await Promise.all([
      db
        .selectFrom("product")
        .select(["id", "name"])
        .where("organizationId", "=", params.organizationId)
        .where("deletedAt", "is", null)
        .where("name", "ilike", pattern)
        .limit(limit)
        .execute(),
      db
        .selectFrom("productVariant")
        .innerJoin("product", "product.id", "productVariant.productId")
        .select([
          "productVariant.id as id",
          "productVariant.productId as productId",
          "productVariant.sku as sku",
          "productVariant.price as price",
          "product.name as productName",
        ])
        .where("productVariant.organizationId", "=", params.organizationId)
        .where("productVariant.deletedAt", "is", null)
        .where("product.organizationId", "=", params.organizationId)
        .where("product.deletedAt", "is", null)
        .where("productVariant.sku", "ilike", pattern)
        .limit(limit)
        .execute(),
    ]);

    const orderedProductIds: string[] = [];
    const seenProductIds = new Set<string>();
    for (const product of productsByName) {
      if (!seenProductIds.has(product.id)) {
        seenProductIds.add(product.id);
        orderedProductIds.push(product.id);
      }
    }
    for (const variant of variantsBySku) {
      if (!seenProductIds.has(variant.productId)) {
        seenProductIds.add(variant.productId);
        orderedProductIds.push(variant.productId);
      }
    }

    if (orderedProductIds.length === 0) {
      return [];
    }

    const [products, variants] = await Promise.all([
      db
        .selectFrom("product")
        .select(["id", "name"])
        .where("id", "in", orderedProductIds)
        .where("organizationId", "=", params.organizationId)
        .where("deletedAt", "is", null)
        .execute(),
      db
        .selectFrom("productVariant")
        .select(["id", "productId", "sku", "price"])
        .where("productId", "in", orderedProductIds)
        .where("organizationId", "=", params.organizationId)
        .where("deletedAt", "is", null)
        .execute(),
    ]);

    const productsById = new Map(products.map((product) => [product.id, product]));
    const variantsByProductId = new Map<string, typeof variants>();
    for (const variant of variants) {
      const list = variantsByProductId.get(variant.productId) ?? [];
      list.push(variant);
      variantsByProductId.set(variant.productId, list);
    }

    const results: ProductPickerItem[] = [];
    for (const productId of orderedProductIds) {
      const product = productsById.get(productId);
      if (!product) {
        continue;
      }

      const productVariants = variantsByProductId.get(product.id) ?? [];
      if (productVariants.length === 0) {
        results.push({
          productId: product.id,
          productVariantId: null,
          productName: product.name,
          sku: "",
          unitPrice: "0",
          hasVariants: false,
        });
        continue;
      }

      for (const variant of productVariants) {
        results.push({
          productId: product.id,
          productVariantId: variant.id,
          productName: `${product.name} - ${variant.sku}`,
          sku: variant.sku,
          unitPrice: variant.price,
          hasVariants: true,
        });
      }
    }

    return results.slice(0, limit);
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[]
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  private mapToDomain(result: {
    id: string;
    customerName: string;
    status: string | OrderStatus;
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
