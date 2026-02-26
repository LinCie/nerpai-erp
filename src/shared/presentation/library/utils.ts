import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes TanStack Form's mixed error types (string | StandardSchemaV1Issue | undefined)
 * into the { message?: string } shape that FieldError expects.
 */
export function normalizeTanstackErrors(
  errors: Array<{ message?: string } | string | undefined>,
): Array<{ message?: string } | undefined> {
  return errors.map((error) => {
    if (typeof error === "string") {
      return { message: error };
    }
    return error;
  });
}

export function buildServerFormErrorState(formData: FormData, message: string) {
  // Try to preserve basic form values if possible
  const activeFields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      activeFields[key] = value;
    }
  }

  return {
    errorMap: {
      onServer: message,
    },
    values: activeFields,
    errors: [message],
  };
}
