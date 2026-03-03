// src/modules/orders/application/repositories/order.repository.interface.ts
import type { Order } from "../../domain/entities/order";
import type {
  CreateOrderParams,
  GetOrdersParams,
  OrderListItem,
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
    newStatus: string;
    version: number;
    organizationId: string;
  }): Promise<Order | null>;

  /** Find order by ID */
  findById(id: string, organizationId: string): Promise<Order | null>;

  /** Find paginated list of orders with filters */
  findList(params: GetOrdersParams): Promise<OrderListItem[]>;

  /** Count total orders matching filters */
  countList(params: GetOrdersParams): Promise<number>;
}
