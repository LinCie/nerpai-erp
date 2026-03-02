import { formOptions } from "@tanstack/react-form-nextjs";
import { receiveStockSchema, dispatchStockSchema } from "../schemas/inventory.schema";

export const receiveStockFormOpts = formOptions({
  defaultValues: {
    productId: "",
    productVariantId: "",
    warehouseId: "",
    quantity: 0,
    notes: "",
  } as {
    productId: string;
    productVariantId?: string;
    warehouseId: string;
    quantity: number;
    notes?: string;
  },
  validators: {
    onSubmit: receiveStockSchema,
  },
});

export type ReceiveStockFormValues = {
  productId: string;
  productVariantId?: string;
  warehouseId: string;
  quantity: number;
  notes?: string;
};

export const dispatchStockFormOpts = formOptions({
  defaultValues: {
    productId: "",
    productVariantId: "",
    warehouseId: "",
    quantity: 0,
    notes: "",
    confirmNegative: "false",
  } as {
    productId: string;
    productVariantId?: string;
    warehouseId: string;
    quantity: number;
    notes?: string;
    confirmNegative?: string;
  },
  validators: {
    onSubmit: dispatchStockSchema,
  },
});

export type DispatchStockFormValues = {
  productId: string;
  productVariantId?: string;
  warehouseId: string;
  quantity: number;
  notes?: string;
  confirmNegative?: string;
};
