import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { RemoveAttributeQuery } from "../schemas/variant.schema";
import { productKeys } from "./product-keys";

interface RemoveAttributeInput extends RemoveAttributeQuery {
  productId: string;
  attributeId: string;
}

export function useRemoveAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RemoveAttributeInput) =>
      treatyFn(
        api.products
          .products({ productId: data.productId })
          .attributes({
            attributeId: data.attributeId,
          })
          .delete(
            {},
            {
              query: {
                confirmed: data.confirmed,
              },
            },
          ),
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}
