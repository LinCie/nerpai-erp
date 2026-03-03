"use client";

import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import {
  Field,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { Icons } from "@/shared/presentation/components/icons";
import { ProductPicker } from "./product-picker";
import type { OrderLineItemsProps } from "../types";

interface OrderLineItemRow {
  productId: string | null;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export function OrderLineItems({
  items,
  onItemsChange,
  disabled = false,
}: OrderLineItemsProps) {
  const handleAddItem = () => {
    const newItem: OrderLineItemRow = {
      productId: null,
      productVariantId: null,
      productName: "",
      sku: "",
      unitPrice: 0,
      quantity: 1,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderLineItemRow,
    value: string | number | null
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  };

  const handleProductSelect = (
    index: number,
    product: {
      productId: string | null;
      productVariantId: string | null;
      productName: string;
      sku: string;
      unitPrice: number;
    }
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.productId,
      productVariantId: product.productVariantId,
      productName: product.productName,
      sku: product.sku,
      unitPrice: product.unitPrice,
    };
    onItemsChange(newItems);
  };

  const calculateSubtotal = (item: OrderLineItemRow) => {
    return item.unitPrice * item.quantity;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Line Items</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={disabled}
        >
          <Icons.plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No items added. Click &quot;Add Item&quot; to start.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-md space-y-4 bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Field>
                    <FieldLabel>Product</FieldLabel>
                    <ProductPicker
                      value={item}
                      onChange={(product) => handleProductSelect(index, product)}
                      disabled={disabled}
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                  disabled={disabled || items.length === 1}
                  className="mt-6"
                >
                  <Icons.trash className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel>Quantity</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                    disabled={disabled}
                  />
                </Field>

                <Field>
                  <FieldLabel>Unit Price</FieldLabel>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                    ${item.unitPrice.toFixed(2)}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Subtotal</FieldLabel>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                    ${calculateSubtotal(item).toFixed(2)}
                  </div>
                </Field>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
