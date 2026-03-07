import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { ToggleVariantActiveBody } from "../schemas/variant.schema";
import { variantKeys } from "./variant-keys";

interface ToggleVariantActiveInput extends ToggleVariantActiveBody {
  id: string;
}

export function useToggleVariantActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ToggleVariantActiveInput) =>
      treatyFn(
        api.products.variants({ id: data.id }).toggle.patch({
          isActive: data.isActive,
        })
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: variantKeys.detail(variables.id),
      });
    },
  });
}
