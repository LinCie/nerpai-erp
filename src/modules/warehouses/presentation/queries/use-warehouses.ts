import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { Warehouse } from "../../domain/entities/warehouse";
import { warehouseKeys } from "./warehouse-keys";

export interface WarehousesFilters {
  search?: string;
  province?: string;
  page?: number;
  limit?: number;
}

export interface WarehousesListResult {
  items: Warehouse[];
  totalCount: number;
  provinces: string[];
}

export function useWarehouses(
  filters?: WarehousesFilters,
  initialData?: WarehousesListResult,
) {
  const query = {
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 10,
    ...(filters?.search ? { search: filters.search } : {}),
    ...(filters?.province ? { province: filters.province } : {}),
  };

  return useQuery({
    queryKey: warehouseKeys.list(filters ?? {}),
    queryFn: () =>
      treatyFn(
        api.warehouses.get({
          query,
        }),
      ),
    ...(initialData ? { initialData } : {}),
  });
}

export function useWarehousesTrash(initialData?: Warehouse[]) {
  return useQuery({
    queryKey: warehouseKeys.list({ trash: true }),
    queryFn: () => treatyFn(api.warehouses.trash.get()),
    ...(initialData ? { initialData } : {}),
  });
}

export function useWarehouse(id: string, initialData?: Warehouse) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => treatyFn(api.warehouses({ id }).get()),
    enabled: Boolean(id),
    ...(initialData ? { initialData } : {}),
  });
}
