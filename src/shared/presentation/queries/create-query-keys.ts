/**
 * Creates a standardized query key factory for a module.
 *
 * Usage:
 *   const productKeys = createQueryKeys('products')
 *   productKeys.all        // ['products']
 *   productKeys.lists()    // ['products', 'list']
 *   productKeys.list({…})  // ['products', 'list', {…}]
 *   productKeys.details()  // ['products', 'detail']
 *   productKeys.detail(id) // ['products', 'detail', id]
 */
export function createQueryKeys<TScope extends string>(scope: TScope) {
  const all = [scope] as const;

  return {
    all,
    lists: () => [...all, "list"] as const,
    list: <TFilters>(filters: TFilters) =>
      [...all, "list", filters] as const,
    details: () => [...all, "detail"] as const,
    detail: (id: string) => [...all, "detail", id] as const,
  };
}
