/**
 * Unwraps an Eden Treaty response for use as a TanStack Query `queryFn`.
 *
 * Eden Treaty returns `{ data, error }` instead of throwing. This helper
 * throws on error so TanStack Query can track it via `isError` / `error`.
 *
 * Usage:
 *   useQuery({
 *     queryKey: productKeys.list(filters),
 *     queryFn: () => treatyFn(api.products.get({ query: filters })),
 *   })
 */
export async function treatyFn<TData>(
  promise: Promise<{ data: TData; error: null } | { data: null; error: unknown }>,
): Promise<TData> {
  const result = await promise;

  if (result.error !== null) {
    throw result.error;
  }

  return result.data as TData;
}
