"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import {
  initialFormState,
  mergeForm,
  useForm,
  useStore,
  useTransform,
} from "@tanstack/react-form-nextjs";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { Textarea } from "@/shared/presentation/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { dispatchStockFormOpts } from "../lib/form-options";
import { dispatchStock } from "../actions/inventory.actions";
import { NegativeStockWarning } from "./negative-stock-warning";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";
import type { InventoryVariantOption } from "../types";

interface StockDispatchFormProps {
  products: Product[];
  warehouses: Warehouse[];
  variants: InventoryVariantOption[];
  onSuccess?: () => void;
}

interface NegativeStockWarningState {
  isOpen: boolean;
  currentStock: number;
  resultingStock: number;
}

export function StockDispatchForm({
  products,
  warehouses,
  variants,
  onSuccess,
}: StockDispatchFormProps) {
  const [state, action, isPending] = useActionState(
    dispatchStock,
    initialFormState,
  );

  const [warningState, setWarningState] = useState<NegativeStockWarningState>({
    isOpen: false,
    currentStock: 0,
    resultingStock: 0,
  });

  const form = useForm({
    ...dispatchStockFormOpts,
    transform: useTransform(
      (baseForm) => mergeForm(baseForm, state ?? {}),
      [state],
    ),
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);

  useEffect(() => {
    if (!state && !isPending) {
      onSuccess?.();
      return;
    }

    if (state?.errors) {
      const errors = state.errors as string[];
      errors.forEach((error) => {
        if (error.startsWith("NEGATIVE_STOCK_WARNING:")) {
          const parts = error.split(":");
          if (parts.length === 3) {
            const currentStock = parseInt(parts[1], 10);
            const resultingStock = parseInt(parts[2], 10);
            setWarningState({
              isOpen: true,
              currentStock,
              resultingStock,
            });
          }
        }
      });
    }
  }, [state, isPending, onSuccess]);

  const handleConfirmNegative = useCallback(() => {
    setWarningState((prev) => ({ ...prev, isOpen: false }));

    form.setFieldValue("confirmNegative", "true");

    requestAnimationFrame(() => {
      const formElement = document.getElementById(
        "dispatch-stock-form",
      ) as HTMLFormElement;
      if (formElement) {
        formElement.requestSubmit();
      }
    });
  }, [form]);

  const handleCloseWarning = useCallback(() => {
    setWarningState((prev) => ({ ...prev, isOpen: false }));
    form.setFieldValue("confirmNegative", "false");
  }, [form]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const availableVariants = selectedProductId
    ? variants.filter((variant) => variant.productId === selectedProductId)
    : [];

  return (
    <>
      <form
        id="dispatch-stock-form"
        action={action as never}
        onSubmit={() => form.handleSubmit()}
        className="space-y-6"
        noValidate
      >
        {formErrors.length > 0 && (
          <div className="text-destructive text-sm" role="alert">
            {formErrors.map((error) => (
              <p key={String(error)}>{String(error)}</p>
            ))}
          </div>
        )}

        <input
          type="hidden"
          name="confirmNegative"
          value={form.getFieldValue("confirmNegative")}
        />

        <FieldGroup>
          <form.Field name="productId">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Product *</FieldLabel>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setSelectedProductId(e.target.value);
                      form.setFieldValue("productVariantId", "");
                    }}
                    onBlur={field.handleBlur}
                    disabled={form.state.isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-required="true"
                    aria-invalid={hasErrors ? "true" : "false"}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {hasErrors && (
                    <FieldError id={`${field.name}-error`}>
                      {field.state.meta.errors.map((e) => String(e)).join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="productVariantId">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>
                    Product Variant (Optional)
                  </FieldLabel>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={form.state.isSubmitting || !selectedProductId}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={hasErrors ? "true" : "false"}
                  >
                    <option value="">
                      {!selectedProductId
                        ? "Select a product first"
                        : availableVariants.length === 0
                          ? "No variants (base product)"
                          : "No variant (base product)"}
                    </option>
                    {availableVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.sku}
                      </option>
                    ))}
                  </select>
                  {hasErrors && (
                    <FieldError id={`${field.name}-error`}>
                      {field.state.meta.errors.map((e) => String(e)).join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="warehouseId">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Warehouse *</FieldLabel>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={form.state.isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-required="true"
                    aria-invalid={hasErrors ? "true" : "false"}
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                  {hasErrors && (
                    <FieldError id={`${field.name}-error`}>
                      {field.state.meta.errors.map((e) => String(e)).join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="quantity">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Quantity *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min="1"
                    step="1"
                    value={field.state.value ?? ""}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? parseInt(e.target.value, 10) : 0,
                      )
                    }
                    onBlur={field.handleBlur}
                    placeholder="Enter quantity"
                    disabled={form.state.isSubmitting}
                    aria-required="true"
                    aria-invalid={hasErrors ? "true" : "false"}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  {hasErrors && (
                    <FieldError id={`${field.name}-error`}>
                      {field.state.meta.errors.map((e) => String(e)).join(", ")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="notes">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              const notesLength = field.state.value?.length || 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Notes (Optional)</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter notes (max 1000 characters)"
                    disabled={form.state.isSubmitting}
                    rows={3}
                    maxLength={1000}
                    aria-invalid={hasErrors ? "true" : "false"}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {hasErrors && (
                      <FieldError id={`${field.name}-error`}>
                        {field.state.meta.errors
                          .map((e) => String(e))
                          .join(", ")}
                      </FieldError>
                    )}
                    <span className="ml-auto">{notesLength}/1000</span>
                  </div>
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={form.state.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? "Dispatching..." : "Dispatch Stock"}
          </Button>
        </div>
      </form>

      <NegativeStockWarning
        isOpen={warningState.isOpen}
        onClose={handleCloseWarning}
        onConfirm={handleConfirmNegative}
        currentStock={warningState.currentStock}
        resultingStock={warningState.resultingStock}
      />
    </>
  );
}
