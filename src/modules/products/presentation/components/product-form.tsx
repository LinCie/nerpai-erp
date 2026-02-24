"use client";

import { useActionState, useEffect } from "react";
import {
  initialFormState,
  mergeForm,
  useForm,
  useStore,
  useTransform,
} from "@tanstack/react-form-nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { createProductFormOptions } from "../lib/form-options";
import { createProduct } from "../actions/product.actions";

interface ProductFormProps {
  onSuccess?: () => void;
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const [state, action, isPending] = useActionState(createProduct, initialFormState);

  const form = useForm({
    ...createProductFormOptions,
    transform: useTransform((baseForm) => mergeForm(baseForm, state ?? {}), [state]),
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);

  // Handle success - when state is undefined (no validation errors) and we were submitting
  useEffect(() => {
    if (!state && !isPending) {
      // Form submitted successfully
      onSuccess?.();
    }
  }, [state, isPending, onSuccess]);

  return (
    <form
      action={action as never}
      onSubmit={() => form.handleSubmit()}
      className="space-y-4"
    >
      {formErrors.length > 0 && (
        <div className="text-destructive text-sm">
          {formErrors.map((error) => (
            <p key={String(error)}>{String(error)}</p>
          ))}
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
                disabled={form.state.isSubmitting}
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
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
