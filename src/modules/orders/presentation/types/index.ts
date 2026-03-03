// src/modules/orders/presentation/types/index.ts
import type { OrderItemFormData } from "../schemas/order.schema";

/** Form state for order create/edit form */
export interface OrderFormState {
  customerName: string;
  items: OrderItemFormData[];
}

/** Result from product picker selection */
export interface ProductPickerResult {
  productId: string;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
}

/** Props for order form dialog */
export interface OrderFormDialogProps {
  order?: {
    id: string;
    version: number;
    customerName: string;
    items: OrderItemFormData[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** Props for order line items component */
export interface OrderLineItemsProps {
  items: OrderItemFormData[];
  onItemsChange: (items: OrderItemFormData[]) => void;
  disabled?: boolean;
}

/** Props for product picker component */
export interface ProductPickerProps {
  value: {
    productId: string | null;
    productVariantId: string | null;
    productName: string;
    sku: string;
    unitPrice: number;
  };
  onChange: (value: ProductPickerResult) => void;
  disabled?: boolean;
}
