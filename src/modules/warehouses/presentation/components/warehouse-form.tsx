"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { Textarea } from "@/shared/presentation/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/presentation/components/ui/field";
import { normalizeTanstackErrors } from "@/shared/presentation/library/utils";
import { warehouseCreateSchema } from "../schemas/warehouse.schema";
import { getWarehouseErrorMessage } from "../queries/get-warehouse-error-message";
import { useCheckWarehouseCode } from "../queries/use-check-warehouse-code";
import { useCreateWarehouse } from "../queries/use-create-warehouse";

interface WarehouseFormProps {
  onSuccess?: () => void;
}

export function WarehouseForm({ onSuccess }: WarehouseFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createWarehouseMutation = useCreateWarehouse();
  const checkWarehouseCodeMutation = useCheckWarehouseCode();

  const form = useForm({
    defaultValues: {
      name: "",
      code: "",
      streetAddress: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Indonesia",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    },
    validators: {
      onSubmit: warehouseCreateSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        await createWarehouseMutation.mutateAsync(value);
        onSuccess?.();
      } catch (error) {
        setServerError(
          getWarehouseErrorMessage(
            error,
            "Failed to create warehouse. Please try again.",
          ),
        );
      }
    },
  });

  const formErrors = useStore(form.store, (formState) => formState.errors);
  const notesLength = useStore(
    form.store,
    (formState) => formState.values?.notes?.length || 0,
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-6"
      noValidate
    >
      {(formErrors.length > 0 || serverError) && (
        <div className="text-destructive text-sm" role="alert">
          {formErrors.map((error) => (
            <p key={String(error)}>{String(error)}</p>
          ))}
          {serverError ? <p>{serverError}</p> : null}
        </div>
      )}

      {/* Fieldset 1: Basic Info */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold border-b w-full pb-2 mb-4">
          Basic Info
        </legend>
        <FieldGroup>
          <form.Field name="name">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Warehouse Name *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. Gudang Utama"
                    disabled={form.state.isSubmitting}
                    autoFocus
                    aria-required="true"
                    aria-invalid={hasErrors ? "true" : "false"}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  {hasErrors && (
                    <FieldError
                      id={`${field.name}-error`}
                      errors={field.state.meta.errors}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field
            name="code"
            validators={{
              onChangeAsyncDebounceMs: 300,
              onChangeAsync: async ({ value }) => {
                const trimmed = value?.trim();
                // Basic check so we don't spam API with empty strings or non-regex-matching
                if (
                  !trimmed ||
                  trimmed.length > 50 ||
                  !/^[a-zA-Z0-9_-]+$/.test(trimmed)
                ) {
                  return undefined;
                }
                try {
                  const res = await checkWarehouseCodeMutation.mutateAsync(trimmed);
                  return res.available
                    ? undefined
                    : "Warehouse code already exists in your organization";
                } catch {
                  return "Unable to validate warehouse code right now";
                }
              },
              onBlurAsync: async ({ value }) => {
                const trimmed = value?.trim();
                if (
                  !trimmed ||
                  trimmed.length > 50 ||
                  !/^[a-zA-Z0-9_-]+$/.test(trimmed)
                ) {
                  return undefined;
                }
                try {
                  const res = await checkWarehouseCodeMutation.mutateAsync(trimmed);
                  return res.available
                    ? undefined
                    : "Warehouse code already exists in your organization";
                } catch {
                  return "Unable to validate warehouse code right now";
                }
              },
            }}
          >
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Warehouse Code *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. WH-KDR-001"
                    disabled={form.state.isSubmitting}
                    aria-required="true"
                    aria-invalid={hasErrors ? "true" : "false"}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  {field.state.meta.isValidating && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Checking code availability...
                    </p>
                  )}
                  {hasErrors && (
                    <FieldError
                      id={`${field.name}-error`}
                      errors={normalizeTanstackErrors(field.state.meta.errors)}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </fieldset>

      {/* Fieldset 2: Address */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold border-b w-full pb-2 mb-4">
          Address
        </legend>
        <FieldGroup>
          <form.Field name="streetAddress">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Street Address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Full street address"
                    disabled={form.state.isSubmitting}
                    aria-invalid={hasErrors ? "true" : "false"}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  {hasErrors && (
                    <FieldError
                      id={`${field.name}-error`}
                      errors={field.state.meta.errors}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="city">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={field.name}>City</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Kediri"
                      disabled={form.state.isSubmitting}
                      aria-invalid={hasErrors ? "true" : "false"}
                      aria-describedby={
                        hasErrors ? `${field.name}-error` : undefined
                      }
                    />
                    {hasErrors && (
                      <FieldError
                        id={`${field.name}-error`}
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="province">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={field.name}>Province</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. East Java"
                      disabled={form.state.isSubmitting}
                      aria-invalid={hasErrors ? "true" : "false"}
                      aria-describedby={
                        hasErrors ? `${field.name}-error` : undefined
                      }
                    />
                    {hasErrors && (
                      <FieldError
                        id={`${field.name}-error`}
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="postalCode">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 64121"
                      disabled={form.state.isSubmitting}
                      aria-invalid={hasErrors ? "true" : "false"}
                      aria-describedby={
                        hasErrors ? `${field.name}-error` : undefined
                      }
                    />
                    {hasErrors && (
                      <FieldError
                        id={`${field.name}-error`}
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="country">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={field.name}>Country *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Indonesia"
                      disabled={form.state.isSubmitting}
                      aria-required="true"
                      aria-invalid={hasErrors ? "true" : "false"}
                      aria-describedby={
                        hasErrors ? `${field.name}-error` : undefined
                      }
                    />
                    {hasErrors && (
                      <FieldError
                        id={`${field.name}-error`}
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>
        </FieldGroup>
      </fieldset>

      {/* Fieldset 3: Contact */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold border-b w-full pb-2 mb-4">
          Contact Information
        </legend>
        <FieldGroup>
          <form.Field name="contactName">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor={field.name}>Contact Person</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Name of contact"
                    disabled={form.state.isSubmitting}
                    aria-invalid={hasErrors ? "true" : "false"}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  {hasErrors && (
                    <FieldError
                      id={`${field.name}-error`}
                      errors={field.state.meta.errors}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="contactPhone">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Phone number"
                      disabled={form.state.isSubmitting}
                      aria-invalid={hasErrors ? "true" : "false"}
                      aria-describedby={
                        hasErrors ? `${field.name}-error` : undefined
                      }
                    />
                    {hasErrors && (
                      <FieldError
                        id={`${field.name}-error`}
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="contactEmail">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Email address"
                      disabled={form.state.isSubmitting}
                      aria-invalid={hasErrors ? "true" : "false"}
                      aria-describedby={
                        hasErrors ? `${field.name}-error` : undefined
                      }
                    />
                    {hasErrors && (
                      <FieldError
                        id={`${field.name}-error`}
                        errors={field.state.meta.errors}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </div>
        </FieldGroup>
      </fieldset>

      {/* Fieldset 4: Notes */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold border-b w-full pb-2 mb-4">
          Additional Notes
        </legend>
        <FieldGroup>
          <form.Field name="notes">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <div className="flex justify-between items-center mb-1">
                    <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
                    <span
                      className={`text-xs ${
                        notesLength > 1000
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {notesLength}/1000
                    </span>
                  </div>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Any other relevant details about this warehouse (ops capacity, guidelines, etc.)"
                    disabled={form.state.isSubmitting}
                    className="min-h-25 resize-y"
                    aria-invalid={
                      hasErrors || notesLength > 1000 ? "true" : "false"
                    }
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  {hasErrors && (
                    <FieldError
                      id={`${field.name}-error`}
                      errors={field.state.meta.errors}
                    />
                  )}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </fieldset>

      <div className="flex justify-end gap-2 pt-4 border-t">
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
                "Save Warehouse"
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
