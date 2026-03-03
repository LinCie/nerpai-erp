// src/modules/orders/presentation/lib/form-options.ts
// Shared form options for TanStack Form + Next.js Server Actions

import { formOptions } from "@tanstack/react-form-nextjs";
import { createOrderSchema, updateOrderSchema } from "../schemas/order.schema";

export const createOrderFormOptions = formOptions({
  defaultValues: {
    customerName: "",
    items: [
      {
        productId: "",
        productVariantId: "",
        productName: "",
        sku: "",
        unitPrice: 0,
        quantity: 1,
      },
    ],
  } as {
    customerName: string;
    items: {
      productId: string | null;
      productVariantId: string | null;
      productName: string;
      sku: string;
      unitPrice: number;
      quantity: number;
    }[];
  },
  validators: {
    onSubmit: createOrderSchema,
  },
});

export type CreateOrderFormValues = {
  customerName: string;
  items: {
    productId: string | null;
    productVariantId: string | null;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[];
};

export const updateOrderFormOptions = formOptions({
  defaultValues: {
    id: "",
    version: 1,
    customerName: "",
    items: [
      {
        productId: "",
        productVariantId: "",
        productName: "",
        sku: "",
        unitPrice: 0,
        quantity: 1,
      },
    ],
  } as {
    id: string;
    version: number;
    customerName: string;
    items: {
      productId: string | null;
      productVariantId: string | null;
      productName: string;
      sku: string;
      unitPrice: number;
      quantity: number;
    }[];
  },
  validators: {
    onSubmit: updateOrderSchema,
  },
});

export type UpdateOrderFormValues = {
  id: string;
  version: number;
  customerName: string;
  items: {
    productId: string | null;
    productVariantId: string | null;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[];
};
