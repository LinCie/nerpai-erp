// src/modules/orders/application/services/order.service.ts
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
  GetOrderDetailParams,
  GetOrdersParams,
  OrderDetail,
  OrderListItem,
  ProductPickerItem,
  TransitionOrderStatusParams,
  UpdateOrderParams,
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
    const order = await this.orderRepository.create(params);
    const [items, historyEntries] = await Promise.all([
      this.orderItemRepository.findByOrderId(order.id, params.organizationId),
      this.orderStatusHistoryRepository.findByOrderId(order.id, params.organizationId),
    ]);

    const initialHistory = historyEntries[0];
    if (!initialHistory) {
      throw new Error("Failed to create initial order status history entry");
    }

    return {
      order,
      items,
      history: initialHistory,
    };
  }

  async updateOrder(params: UpdateOrderParams): Promise<{
    order: Order;
    items: OrderItem[];
  }> {
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

    const updatedOrder = await this.orderRepository.updateCustomerAndItems(params);
    if (!updatedOrder) {
      throw new ConcurrencyError();
    }

    const items = await this.orderItemRepository.findByOrderId(
      params.id,
      params.organizationId
    );

    return {
      order: updatedOrder,
      items,
    };
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

    const updatedOrder = await this.orderRepository.updateStatusWithLock({
      orderId: params.orderId,
      newStatus: params.newStatus,
      previousStatus: order.status,
      changedBy: params.changedBy,
      version: params.version,
      organizationId: params.organizationId,
    });

    if (!updatedOrder) {
      throw new ConcurrencyError();
    }

    return updatedOrder;
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
    const orderWithCreator = await this.orderRepository.findByIdWithCreator(
      params.orderId,
      params.organizationId
    );

    if (!orderWithCreator) {
      return null;
    }

    const [items, statusHistory] = await Promise.all([
      this.orderItemRepository.findByOrderId(params.orderId, params.organizationId),
      this.orderStatusHistoryRepository.findEntriesByOrderId(
        params.orderId,
        params.organizationId
      ),
    ]);

    return {
      id: orderWithCreator.order.id,
      customerName: orderWithCreator.order.customerName,
      status: orderWithCreator.order.status,
      totalAmount: orderWithCreator.order.totalAmount,
      version: orderWithCreator.order.version,
      createdBy: orderWithCreator.order.createdBy,
      createdByName: orderWithCreator.createdByName,
      organizationId: orderWithCreator.order.organizationId,
      createdAt: orderWithCreator.order.createdAt,
      updatedAt: orderWithCreator.order.updatedAt,
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
      statusHistory,
    };
  }

  async searchProducts(params: {
    search: string;
    organizationId: string;
    limit?: number;
  }): Promise<ProductPickerItem[]> {
    return this.orderRepository.searchProducts(params);
  }
}
