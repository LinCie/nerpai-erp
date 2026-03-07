export function getWarehouseErrorMessage(
  error: unknown,
  fallback: string,
): string {
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

  return fallback;
}
