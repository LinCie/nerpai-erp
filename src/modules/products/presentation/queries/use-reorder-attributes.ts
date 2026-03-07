import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { ReorderAttributesBody } from "../schemas/variant.schema";
import { productKeys } from "./product-keys";

interface ReorderAttributesInput extends ReorderAttributesBody {
  productId: string;
}

export function useReorderAttributes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderAttributesInput) =>
      treatyFn(
        api.products.products({ productId: data.productId }).attributes.reorder.patch({
          orderedAttributeIds: data.orderedAttributeIds,
        })
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}
