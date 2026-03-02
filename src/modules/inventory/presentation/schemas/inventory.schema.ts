import { z } from "zod";

export const receiveStockSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "Product must be a valid UUID" }),
  productVariantId: z
    .string()
    .uuid({ message: "Product variant must be a valid UUID" })
    .optional()
    .or(z.literal("")),
  warehouseId: z
    .string()
    .uuid({ message: "Warehouse must be a valid UUID" }),
  quantity: z
    .number()
    .int({ message: "Quantity must be an integer" })
    .positive({ message: "Quantity must be greater than 0" }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Notes must be 1000 characters or less" })
    .optional()
    .or(z.literal("")),
});

export const dispatchStockSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "Product must be a valid UUID" }),
  productVariantId: z
    .string()
    .uuid({ message: "Product variant must be a valid UUID" })
    .optional()
    .or(z.literal("")),
  warehouseId: z
    .string()
    .uuid({ message: "Warehouse must be a valid UUID" }),
  quantity: z
    .number()
    .int({ message: "Quantity must be an integer" })
    .positive({ message: "Quantity must be greater than 0" }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Notes must be 1000 characters or less" })
    .optional()
    .or(z.literal("")),
  confirmNegative: z
    .enum(["true", "false"])
    .optional(),
});

export const adjustStockSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "Product must be a valid UUID" }),
  productVariantId: z
    .string()
    .uuid({ message: "Product variant must be a valid UUID" })
    .optional()
    .or(z.literal("")),
  warehouseId: z
    .string()
    .uuid({ message: "Warehouse must be a valid UUID" }),
  newQuantity: z
    .number()
    .int({ message: "New quantity must be an integer" })
    .min(0, { message: "New quantity must be 0 or greater" }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Notes must be 1000 characters or less" })
    .optional()
    .or(z.literal("")),
});

export const transferStockSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "Product must be a valid UUID" }),
  productVariantId: z
    .string()
    .uuid({ message: "Product variant must be a valid UUID" })
    .optional()
    .or(z.literal("")),
  sourceWarehouseId: z
    .string()
    .uuid({ message: "Source warehouse must be a valid UUID" }),
  destinationWarehouseId: z
    .string()
    .uuid({ message: "Destination warehouse must be a valid UUID" }),
  quantity: z
    .number()
    .int({ message: "Quantity must be an integer" })
    .positive({ message: "Quantity must be greater than 0" }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Notes must be 1000 characters or less" })
    .optional()
    .or(z.literal("")),
  confirmNegative: z
    .enum(["true", "false"])
    .optional(),
}).refine((data) => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: "Source and destination warehouses must be different",
  path: ["destinationWarehouseId"],
});

export type ReceiveStockFormData = z.infer<typeof receiveStockSchema>;
export type DispatchStockFormData = z.infer<typeof dispatchStockSchema>;
export type AdjustStockFormData = z.infer<typeof adjustStockSchema>;
export type TransferStockFormData = z.infer<typeof transferStockSchema>;
