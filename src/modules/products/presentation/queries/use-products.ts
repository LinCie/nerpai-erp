import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { Product } from "../../domain/entities/product";
import type { PaginationMetadataDto } from "../dtos/product.dto";
import { productKeys } from "./product-keys";

interface ProductsFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export function useProducts(
  filters?: ProductsFilters,
  initialData?: { data: Product[]; metadata: PaginationMetadataDto },
) {
  return useQuery({
    queryKey: productKeys.list(filters ?? {}),
    queryFn: () => treatyFn(api.products.get({ query: filters ?? {} })),
    ...(initialData ? { initialData } : {}),
  });
}

export function useProductsTrash(initialData?: {
  data: Product[];
  metadata: PaginationMetadataDto;
}) {
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
