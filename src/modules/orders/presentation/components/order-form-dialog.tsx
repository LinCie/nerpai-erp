"use client";

import { useActionState, useEffect, useState } from "react";
import {
  initialFormState,
  mergeForm,
  useForm,
  useStore,
  useTransform,
} from "@tanstack/react-form-nextjs";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { toast } from "sonner";
import { Icons } from "@/shared/presentation/components/icons";
import { createOrderFormOptions, updateOrderFormOptions } from "../lib/form-options";
import { createOrder, updateOrder } from "../actions/order.actions";
import { OrderLineItems } from "./order-line-items";
import type { OrderFormDialogProps } from "../types";

interface OrderFormDialogWrapperProps {
  order?: {
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
  } | null;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function OrderFormDialogTrigger({
  onSuccess,
  children,
}: OrderFormDialogWrapperProps & { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button id="create-order-trigger">
            <Icons.plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        {open && (
          <OrderForm
            onSuccess={() => {
              toast.success("Order created successfully");
              setOpen(false);
              onSuccess?.();
            }}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function OrderFormDialog({
  order = null,
  open,
  onOpenChange,
  onSuccess,
}: OrderFormDialogProps) {
  const isEditMode = !!order;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Order" : "Create New Order"}</DialogTitle>
        </DialogHeader>
        {open && (
          <OrderForm
            order={order}
            onSuccess={() => {
              toast.success(isEditMode ? "Order updated successfully" : "Order created successfully");
              onOpenChange(false);
              onSuccess?.();
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface OrderFormProps {
  order?: {
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
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const isEditMode = !!order;
  const action = isEditMode ? updateOrder : createOrder;
  const formOptions = isEditMode ? updateOrderFormOptions : createOrderFormOptions;

  const [state, formAction, isPending] = useActionState(
    action,
    initialFormState
  );

  const form = useForm({
    ...formOptions,
    transform: useTransform(
      (baseForm) => mergeForm(baseForm, state ?? {}),
      [state]
    ),
    defaultValues: isEditMode
      ? {
          id: order!.id,
          version: order!.version,
          customerName: order!.customerName,
          items: order!.items.length > 0
            ? order!.items
            : [
                {
                  productId: "",
                  productVariantId: "",
                  productName: "",
                  sku: "",
                  unitPrice: 0,
                  quantity: 1,
                },
              ],
        }
      : formOptions.defaultValues,
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);

  useEffect(() => {
    if (!state && !isPending) {
      onSuccess?.();
    }
  }, [state, isPending, onSuccess]);

  return (
    <form
      action={formAction as never}
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

      <FieldGroup>
        <form.Field name="customerName">
          {(field) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor={field.name}>Customer Name *</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter customer name"
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

        <form.Field name="items">
          {(field) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <OrderLineItems
                  items={field.state.value || []}
                  onItemsChange={(newItems) => field.handleChange(newItems)}
                  disabled={form.state.isSubmitting}
                />
                {hasErrors && (
                  <FieldError>
                    {field.state.meta.errors.map((e) => String(e)).join(", ")}
                  </FieldError>
                )}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onCancel?.()}
          disabled={form.state.isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
            ? "Update Order"
            : "Create Order"}
        </Button>
      </div>
    </form>
  );
}

export function CreateOrderButton({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <OrderFormDialogTrigger onSuccess={onSuccess}>
      <Button id="create-order-trigger">
        <Icons.plus className="w-4 h-4 mr-2" />
        Create Order
      </Button>
    </OrderFormDialogTrigger>
  );
}
