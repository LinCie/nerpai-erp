"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { attributeSchema } from "../schemas/attribute.schema";
import { useCreateAttribute } from "../queries/use-create-attribute";

interface AttributeFormProps {
  onSuccess?: () => void;
}

export function AttributeForm({ onSuccess }: AttributeFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createAttributeMutation = useCreateAttribute();

  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: attributeSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await createAttributeMutation.mutateAsync(value);
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
                Attribute Name *
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g., Color, Size, Material"
                disabled={
                  form.state.isSubmitting || createAttributeMutation.isPending
                }
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
                "Create Attribute"
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
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

  return "Failed to create attribute. Please try again.";
}
