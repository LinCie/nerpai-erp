import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { WarehouseUpdateFormData } from "../schemas/warehouse.schema";
import { warehouseKeys } from "./warehouse-keys";

interface UpdateWarehouseInput extends WarehouseUpdateFormData {
  id: string;
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWarehouseInput) =>
      treatyFn(api.warehouses({ id }).put(payload)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.detail(variables.id),
      });
    },
  });
}
