import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import { warehouseKeys } from "./warehouse-keys";

export function useRestoreWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => treatyFn(api.warehouses({ id }).restore.post()),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.list({ trash: true }),
      });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}
