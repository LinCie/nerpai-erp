// src/modules/orders/application/repositories/order.repository.interface.ts
import type { Order } from "../../domain/entities/order";
import type { OrderStatus } from "../../domain/types";
import type {
  CreateOrderParams,
  GetOrdersParams,
  OrderListItem,
  ProductPickerItem,
  UpdateOrderParams,
} from "../types";

export interface IOrderRepository {
  /** Create a new order with initial status */
  create(params: CreateOrderParams): Promise<Order>;

  /** Update order customer name and items (only when unpaid) */
  updateCustomerAndItems(params: UpdateOrderParams): Promise<Order | null>;

  /** Update order status with optimistic locking */
  updateStatusWithLock(params: {
    orderId: string;
    newStatus: OrderStatus;
    previousStatus: OrderStatus;
    changedBy: string;
    version: number;
    organizationId: string;
  }): Promise<Order | null>;

  /** Find order by ID */
  findById(id: string, organizationId: string): Promise<Order | null>;

  /** Find order by ID with creator display name */
  findByIdWithCreator(
    id: string,
    organizationId: string
  ): Promise<{ order: Order; createdByName: string } | null>;

  /** Find paginated list of orders with filters */
  findList(params: GetOrdersParams): Promise<OrderListItem[]>;

  /** Count total orders matching filters */
  countList(params: GetOrdersParams): Promise<number>;

  /** Search products + variants for product picker */
  searchProducts(params: {
    search: string;
    organizationId: string;
    limit?: number;
  }): Promise<ProductPickerItem[]>;
}
