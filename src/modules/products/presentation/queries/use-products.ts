import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { Product } from "../../domain/entities/product";
import { productKeys } from "./product-keys";

interface ProductsFilters {
  search?: string;
}

export function useProducts(filters?: ProductsFilters, initialData?: Product[]) {
  return useQuery({
    queryKey: productKeys.list(filters ?? {}),
    queryFn: () => treatyFn(api.products.get({ query: filters ?? {} })),
    ...(initialData ? { initialData } : {}),
  });
}

export function useProductsTrash(initialData?: Product[]) {
  return useQuery({
    queryKey: productKeys.list({ trash: true }),
    queryFn: () => treatyFn(api.products.trash.get()),
    ...(initialData ? { initialData } : {}),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => treatyFn(api.products({ id }).get()),
    enabled: Boolean(id),
  });
}
