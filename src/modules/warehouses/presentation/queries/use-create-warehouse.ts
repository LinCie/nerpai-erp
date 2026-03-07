import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { WarehouseCreateFormData } from "../schemas/warehouse.schema";
import { warehouseKeys } from "./warehouse-keys";

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WarehouseCreateFormData) =>
      treatyFn(api.warehouses.post(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.list({ trash: true }),
      });
    },
  });
}
