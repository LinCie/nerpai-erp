import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import { variantKeys } from "./variant-keys";

export function useSoftDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      treatyFn(api.products.variants({ id }).delete()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: variantKeys.lists(),
      });
    },
  });
}
