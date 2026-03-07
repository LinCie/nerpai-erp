import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import { warehouseKeys } from "./warehouse-keys";

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => treatyFn(api.warehouses({ id }).delete()),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.list({ trash: true }),
      });
      queryClient.removeQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}
