"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form-nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { updateProductFormOptions } from "../lib/form-options";
import type { Product } from "../../domain/entities/product";
import { useUpdateProduct } from "../queries/use-update-product";

interface ProductEditFormProps {
  product: Product;
  onSuccess?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "value" in error) {
    const errorValue = (error as { value?: unknown }).value;
    if (
      errorValue &&
      typeof errorValue === "object" &&
      "error" in errorValue &&
      typeof (errorValue as { error?: unknown }).error === "string"
    ) {
      return (errorValue as { error: string }).error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to update product. Please try again.";
}

export function ProductEditForm({ product, onSuccess }: ProductEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateProductMutation = useUpdateProduct();

  const form = useForm({
    ...updateProductFormOptions,
    defaultValues: {
      name: product.name,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await updateProductMutation.mutateAsync({
          id: product.id,
          name: value.name,
        });
        onSuccess?.();
      } catch (error) {
        setServerError(getErrorMessage(error));
      }
    },
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      {(formErrors.length > 0 || serverError) && (
        <div className="text-destructive text-sm">
          {formErrors.map((error) => (
            <p key={String(error)}>{String(error)}</p>
          ))}
          {serverError ? <p>{serverError}</p> : null}
        </div>
      )}

      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>
                Product Name *
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Enter product name"
                disabled={form.state.isSubmitting || updateProductMutation.isPending}
                autoFocus
              />
              {field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
