// src/modules/orders/application/services/order.service.ts
import { db } from "@/shared/infrastructure/persistence";
import type { Order } from "../../domain/entities/order";
import type { OrderItem } from "../../domain/entities/order-item";
import type { OrderStatusHistory } from "../../domain/entities/order-status-history";
import type { OrderStatus } from "../../domain/types";
import { canTransition, isTerminalStatus } from "../../domain/types";
import type { IOrderRepository } from "../repositories/order.repository.interface";
import type { IOrderItemRepository } from "../repositories/order-item.repository.interface";
import type { IOrderStatusHistoryRepository } from "../repositories/order-status-history.repository.interface";
import type {
  CreateOrderParams,
  UpdateOrderParams,
  TransitionOrderStatusParams,
  GetOrdersParams,
  GetOrderDetailParams,
  OrderListItem,
  OrderDetail,
  ProductPickerItem,
} from "../types";

export class OrderNotFoundError extends Error {
  constructor() {
    super("Order not found");
    this.name = "OrderNotFoundError";
  }
}

export class OrderLockedError extends Error {
  constructor() {
    super("Order can only be edited while in Unpaid status");
    this.name = "OrderLockedError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export class ConcurrencyError extends Error {
  constructor() {
    super("Order was modified by another user. Please refresh.");
    this.name = "ConcurrencyError";
  }
}

export class TerminalStatusError extends Error {
  constructor() {
    super("No further transitions allowed for this order");
    this.name = "TerminalStatusError";
  }
}

export class OrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private orderItemRepository: IOrderItemRepository,
    private orderStatusHistoryRepository: IOrderStatusHistoryRepository
  ) {}

  async createOrder(params: CreateOrderParams): Promise<{
    order: Order;
    items: OrderItem[];
    history: OrderStatusHistory;
  }> {
    return await db.transaction().execute(async (trx) => {
      // Create the order first
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

      const order: Order = {
        id: orderResult.id,
        customerName: orderResult.customerName,
        status: orderResult.status as OrderStatus,
        totalAmount: orderResult.totalAmount,
        version: orderResult.version,
        organizationId: orderResult.organizationId,
        createdBy: orderResult.createdBy,
        createdAt: orderResult.createdAt ?? new Date(),
        updatedAt: orderResult.updatedAt ?? new Date(),
        deletedAt: orderResult.deletedAt,
      };

      // Create order items
      const itemValues = params.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.quantity * item.unitPrice,
      }));

      const itemResults = await trx
        .insertInto("orderItem")
        .values(itemValues)
        .returningAll()
        .execute();

      const items: OrderItem[] = itemResults.map((result) => ({
        id: result.id,
        orderId: result.orderId,
        productId: result.productId,
        productVariantId: result.productVariantId,
        productName: result.productName,
        sku: result.sku,
        unitPrice: result.unitPrice,
        quantity: result.quantity,
        subtotal: result.subtotal,
        createdAt: result.createdAt ?? new Date(),
        deletedAt: result.deletedAt,
      }));

      // Create initial status history entry
      const historyResult = await trx
        .insertInto("orderStatusHistory")
        .values({
          orderId: order.id,
          previousStatus: null,
          newStatus: order.status,
          changedBy: params.createdBy,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const history: OrderStatusHistory = {
        id: historyResult.id,
        orderId: historyResult.orderId,
        previousStatus: historyResult.previousStatus as OrderStatus | null,
        newStatus: historyResult.newStatus as OrderStatus,
        changedBy: historyResult.changedBy,
        createdAt: historyResult.createdAt ?? new Date(),
        deletedAt: historyResult.deletedAt,
      };

      return { order, items, history };
    });
  }

  async updateOrder(params: UpdateOrderParams): Promise<{
    order: Order;
    items: OrderItem[];
  }> {
    // Verify order exists and is in unpaid status
    const existingOrder = await this.orderRepository.findById(
      params.id,
      params.organizationId
    );

    if (!existingOrder) {
      throw new OrderNotFoundError();
    }

    if (existingOrder.status !== "unpaid") {
      throw new OrderLockedError();
    }

    if (existingOrder.version !== params.version) {
      throw new ConcurrencyError();
    }

    return await db.transaction().execute(async (trx) => {
      // Update the order
      const orderResult = await trx
        .updateTable("order")
        .set({
          customerName: params.customerName,
          totalAmount: this.calculateTotalAmount(params.items),
          version: params.version + 1,
        })
        .where("id", "=", params.id)
        .where("organizationId", "=", params.organizationId)
        .where("version", "=", params.version)
        .returningAll()
        .executeTakeFirstOrThrow();

      const order: Order = {
        id: orderResult.id,
        customerName: orderResult.customerName,
        status: orderResult.status as OrderStatus,
        totalAmount: orderResult.totalAmount,
        version: orderResult.version,
        organizationId: orderResult.organizationId,
        createdBy: orderResult.createdBy,
        createdAt: orderResult.createdAt ?? new Date(),
        updatedAt: orderResult.updatedAt ?? new Date(),
        deletedAt: orderResult.deletedAt,
      };

      // Delete existing items
      await trx
        .deleteFrom("orderItem")
        .where("orderId", "=", params.id)
        .execute();

      // Create new items
      const itemValues = params.items.map((item) => ({
        orderId: params.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.quantity * item.unitPrice,
      }));

      const itemResults = await trx
        .insertInto("orderItem")
        .values(itemValues)
        .returningAll()
        .execute();

      const items: OrderItem[] = itemResults.map((result) => ({
        id: result.id,
        orderId: result.orderId,
        productId: result.productId,
        productVariantId: result.productVariantId,
        productName: result.productName,
        sku: result.sku,
        unitPrice: result.unitPrice,
        quantity: result.quantity,
        subtotal: result.subtotal,
        createdAt: result.createdAt ?? new Date(),
        deletedAt: result.deletedAt,
      }));

      return { order, items };
    });
  }

  async transitionOrderStatus(
    params: TransitionOrderStatusParams
  ): Promise<Order> {
    const order = await this.orderRepository.findById(
      params.orderId,
      params.organizationId
    );

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (isTerminalStatus(order.status)) {
      throw new TerminalStatusError();
    }

    if (!canTransition(order.status, params.newStatus)) {
      throw new InvalidTransitionError(order.status, params.newStatus);
    }

    return await db.transaction().execute(async (trx) => {
      // Update order with optimistic locking
      const updatedOrderResult = await trx
        .updateTable("order")
        .set({
          status: params.newStatus,
          version: params.version + 1,
        })
        .where("id", "=", params.orderId)
        .where("organizationId", "=", params.organizationId)
        .where("version", "=", params.version)
        .returningAll()
        .executeTakeFirst();

      if (!updatedOrderResult) {
        throw new ConcurrencyError();
      }

      // Create status history entry
      await trx
        .insertInto("orderStatusHistory")
        .values({
          orderId: params.orderId,
          previousStatus: order.status,
          newStatus: params.newStatus,
          changedBy: params.changedBy,
        })
        .execute();

      return {
        id: updatedOrderResult.id,
        customerName: updatedOrderResult.customerName,
        status: updatedOrderResult.status as OrderStatus,
        totalAmount: updatedOrderResult.totalAmount,
        version: updatedOrderResult.version,
        organizationId: updatedOrderResult.organizationId,
        createdBy: updatedOrderResult.createdBy,
        createdAt: updatedOrderResult.createdAt ?? new Date(),
        updatedAt: updatedOrderResult.updatedAt ?? new Date(),
        deletedAt: updatedOrderResult.deletedAt,
      };
    });
  }

  async getOrders(params: GetOrdersParams): Promise<{
    data: OrderListItem[];
    total: number;
  }> {
    const [data, total] = await Promise.all([
      this.orderRepository.findList(params),
      this.orderRepository.countList(params),
    ]);

    return { data, total };
  }

  async getOrderDetail(params: GetOrderDetailParams): Promise<OrderDetail | null> {
    const order = await this.orderRepository.findById(
      params.orderId,
      params.organizationId
    );

    if (!order) {
      return null;
    }

    const [items, statusHistory] = await Promise.all([
      this.orderItemRepository.findByOrderId(params.orderId),
      this.orderStatusHistoryRepository.findByOrderId(params.orderId),
    ]);

    // Fetch user names for createdBy and changedBy
    const userIds = new Set<string>([order.createdBy]);
    statusHistory.forEach((h) => userIds.add(h.changedBy));

    const users = await db
      .selectFrom("user")
      .select(["id", "name"])
      .where("id", "in", Array.from(userIds))
      .execute();

    const userNameMap = new Map(users.map((u) => [u.id, u.name]));

    return {
      id: order.id,
      customerName: order.customerName,
      status: order.status,
      totalAmount: order.totalAmount,
      version: order.version,
      createdBy: order.createdBy,
      createdByName: userNameMap.get(order.createdBy) ?? "",
      organizationId: order.organizationId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      statusHistory: statusHistory.map((h) => ({
        id: h.id,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        changedBy: h.changedBy,
        changedByName: userNameMap.get(h.changedBy) ?? "",
        createdAt: h.createdAt,
      })),
    };
  }

  async searchProducts(params: {
    search: string;
    organizationId: string;
    limit?: number;
  }): Promise<ProductPickerItem[]> {
    const { search, organizationId, limit = 20 } = params;

    // Search products
    const products = await db
      .selectFrom("product")
      .select(["id", "name"])
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .where("name", "ilike", `%${search}%`)
      .limit(limit)
      .execute();

    if (products.length === 0) {
      return [];
    }

    const productIds = products.map((p) => p.id);

    // Get variants for these products
    const variants = await db
      .selectFrom("productVariant")
      .select(["id", "productId", "sku", "price"])
      .where("productId", "in", productIds)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .execute();

    // Group variants by product
    const variantsByProductId = new Map<string, typeof variants>();
    for (const variant of variants) {
      const list = variantsByProductId.get(variant.productId) ?? [];
      list.push(variant);
      variantsByProductId.set(variant.productId, list);
    }

    // Build product picker items
    const results: ProductPickerItem[] = [];

    for (const product of products) {
      const productVariants = variantsByProductId.get(product.id) ?? [];

      if (productVariants.length === 0) {
        // Product without variants - include product-level data
        results.push({
          productId: product.id,
          productVariantId: null,
          productName: product.name,
          sku: "",
          unitPrice: "0",
          hasVariants: false,
        });
      } else {
        // Product with variants - include each variant as separate item
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
    }

    return results.slice(0, limit);
  }

  private calculateTotalAmount(
    items: { quantity: number; unitPrice: number }[]
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
}
