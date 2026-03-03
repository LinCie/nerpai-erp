// src/modules/orders/presentation/schemas/order.schema.ts
import { z } from "zod";

/** Order item schema for line items */
export const orderItemSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "Product must be a valid UUID" })
    .nullable()
    .or(z.literal("")),
  productVariantId: z
    .string()
    .uuid({ message: "Product variant must be a valid UUID" })
    .nullable()
    .or(z.literal("")),
  productName: z
    .string()
    .trim()
    .min(1, { message: "Product name is required" }),
  sku: z
    .string()
    .trim()
    .min(1, { message: "SKU is required" }),
  unitPrice: z
    .number()
    .min(0, { message: "Unit price must be 0 or greater" }),
  quantity: z
    .number()
    .int({ message: "Quantity must be an integer" })
    .positive({ message: "Quantity must be greater than 0" }),
});

/** Schema for creating a new order */
export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, { message: "Customer name is required" })
    .max(255, { message: "Customer name must be 255 characters or less" }),
  items: z
    .array(orderItemSchema)
    .min(1, { message: "At least one line item is required" }),
});

/** Schema for updating an existing order */
export const updateOrderSchema = z.object({
  id: z
    .string()
    .uuid({ message: "Order ID must be a valid UUID" }),
  version: z
    .number()
    .int({ message: "Version must be an integer" })
    .min(1, { message: "Version must be at least 1" }),
  customerName: z
    .string()
    .trim()
    .min(1, { message: "Customer name is required" })
    .max(255, { message: "Customer name must be 255 characters or less" }),
  items: z
    .array(orderItemSchema)
    .min(1, { message: "At least one line item is required" }),
});

/** Valid order statuses */
const orderStatuses = [
  "unpaid",
  "paid",
  "process",
  "sent",
  "completed",
  "return",
  "cancelled",
] as const;

/** Schema for transitioning order status (NOT a FormData schema) */
export const transitionOrderStatusSchema = z.object({
  orderId: z
    .string()
    .uuid({ message: "Order ID must be a valid UUID" }),
  newStatus: z
    .enum(orderStatuses, { message: "Invalid order status" }),
  version: z
    .number()
    .int({ message: "Version must be an integer" })
    .min(1, { message: "Version must be at least 1" }),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
export type TransitionOrderStatusInput = z.infer<typeof transitionOrderStatusSchema>;
