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
import { updateAttributeFormOptions } from "../lib/form-options";
import { useUpdateAttribute } from "../queries/use-update-attribute";
import type { AttributeWithOptionsApi } from "../queries/use-attributes";

interface AttributeEditFormProps {
  attribute: Pick<AttributeWithOptionsApi, "id" | "name">;
  onSuccess?: () => void;
}

export function AttributeEditForm({ attribute, onSuccess }: AttributeEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateAttributeMutation = useUpdateAttribute();

  const form = useForm({
    ...updateAttributeFormOptions,
    defaultValues: {
      name: attribute.name,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await updateAttributeMutation.mutateAsync({
          id: attribute.id,
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
                  form.state.isSubmitting || updateAttributeMutation.isPending
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

  return "Failed to update attribute. Please try again.";
}
