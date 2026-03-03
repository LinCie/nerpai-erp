"use server";

import { revalidatePath } from "next/cache";
import {
  ServerValidateError,
  createServerValidate,
} from "@tanstack/react-form-nextjs";
import { getSessionAndOrg } from "@/shared/presentation/auth/getSession";
import { buildServerFormErrorState } from "@/shared/presentation/library/utils";
import { orderRepository } from "../../infrastructure/repositories/order.repository";
import { orderItemRepository } from "../../infrastructure/repositories/order-item.repository";
import { orderStatusHistoryRepository } from "../../infrastructure/repositories/order-status-history.repository";
import {
  OrderService,
  OrderNotFoundError,
  OrderLockedError,
  InvalidTransitionError,
  ConcurrencyError,
  TerminalStatusError,
} from "../../application/services/order.service";
import type {
  GetOrdersParams,
  GetOrderDetailParams,
} from "../../application/types";
import type { OrderStatus } from "../../domain/types";
import { createOrderFormOptions, updateOrderFormOptions } from "../lib/form-options";
import { transitionOrderStatusSchema } from "../schemas/order.schema";

const orderService = new OrderService(
  orderRepository,
  orderItemRepository,
  orderStatusHistoryRepository
);

const validateCreateOrderForm = createServerValidate({
  ...createOrderFormOptions,
  onServerValidate: () => {
    return undefined;
  },
});

const validateUpdateOrderForm = createServerValidate({
  ...updateOrderFormOptions,
  onServerValidate: () => {
    return undefined;
  },
});

// Read Actions

export async function getOrders(params: Omit<GetOrdersParams, "organizationId">) {
  const { organizationId } = await getSessionAndOrg();

  return orderService.getOrders({
    ...params,
    organizationId,
  });
}

export async function getOrderDetail(params: Omit<GetOrderDetailParams, "organizationId">) {
  const { organizationId } = await getSessionAndOrg();

  return orderService.getOrderDetail({
    ...params,
    organizationId,
  });
}

export async function searchProducts(params: { search: string; limit?: number }) {
  const { organizationId } = await getSessionAndOrg();

  return orderService.searchProducts({
    ...params,
    organizationId,
  });
}

// Mutation Actions

export async function createOrder(prev: unknown, formData: FormData) {
  try {
    const { session, organizationId } = await getSessionAndOrg();
    const userId = session.user.id;

    // Validate form data using TanStack Form's server validation
    const validatedData = await validateCreateOrderForm(formData);

    // Validate at least one line item exists
    if (!validatedData.items || validatedData.items.length === 0) {
      return buildServerFormErrorState(
        formData,
        "At least one line item is required"
      );
    }

    await orderService.createOrder({
      customerName: validatedData.customerName,
      items: validatedData.items.map((item) => ({
        productId: item.productId || null,
        productVariantId: item.productVariantId || null,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      createdBy: userId,
      organizationId,
    });

    revalidatePath("/orders");

    // Return undefined on success - form will reset naturally
    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }

    console.error("Error creating order:", e);
    throw new Error("Failed to create order. Please try again.");
  }
}

export async function updateOrder(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    // Validate form data using TanStack Form's server validation
    const validatedData = await validateUpdateOrderForm(formData);

    // Validate at least one line item exists
    if (!validatedData.items || validatedData.items.length === 0) {
      return buildServerFormErrorState(
        formData,
        "At least one line item is required"
      );
    }

    await orderService.updateOrder({
      id: validatedData.id,
      version: validatedData.version,
      customerName: validatedData.customerName,
      items: validatedData.items.map((item) => ({
        productId: item.productId || null,
        productVariantId: item.productVariantId || null,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      organizationId,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${validatedData.id}`);

    // Return undefined on success - form will reset naturally
    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof OrderNotFoundError) {
      return buildServerFormErrorState(formData, e.message);
    }
    if (e instanceof OrderLockedError) {
      return buildServerFormErrorState(formData, e.message);
    }
    if (e instanceof ConcurrencyError) {
      return buildServerFormErrorState(formData, e.message);
    }

    console.error("Error updating order:", e);
    throw new Error("Failed to update order. Please try again.");
  }
}

export async function transitionOrderStatus(params: {
  orderId: string;
  newStatus: OrderStatus;
  version: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { session, organizationId } = await getSessionAndOrg();
    const userId = session.user.id;

    // Validate input
    const validationResult = transitionOrderStatusSchema.safeParse(params);
    if (!validationResult.success) {
      return { success: false, error: "Invalid input parameters" };
    }

    const { orderId, newStatus, version } = validationResult.data;

    await orderService.transitionOrderStatus({
      orderId,
      newStatus,
      version,
      changedBy: userId,
      organizationId,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);

    return { success: true };
  } catch (e) {
    if (e instanceof OrderNotFoundError) {
      return { success: false, error: "Order not found" };
    }
    if (e instanceof InvalidTransitionError) {
      return { success: false, error: e.message };
    }
    if (e instanceof ConcurrencyError) {
      return { success: false, error: e.message };
    }
    if (e instanceof TerminalStatusError) {
      return { success: false, error: e.message };
    }

    console.error("Error transitioning order status:", e);
    throw new Error("Failed to update order status. Please try again.");
  }
}
