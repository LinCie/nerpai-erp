import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import { productKeys } from "./product-keys";

export function useRestoreProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => treatyFn(api.products({ id }).restore.post()),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.list({ trash: true }) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}
