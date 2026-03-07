import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { UpdateVariantBody } from "../schemas/variant.schema";
import { variantKeys } from "./variant-keys";

interface UpdateVariantInput extends Partial<UpdateVariantBody> {
  id: string;
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVariantInput) =>
      treatyFn(
        api.products.variants({ id: data.id }).patch({
          sku: data.sku,
          price: data.price,
        })
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: variantKeys.detail(variables.id),
      });
    },
  });
}
