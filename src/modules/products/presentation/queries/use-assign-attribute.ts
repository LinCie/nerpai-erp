import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { AssignAttributeBody } from "../schemas/variant.schema";
import { productKeys } from "./product-keys";

interface AssignAttributeInput extends AssignAttributeBody {
  productId: string;
}

export function useAssignAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignAttributeInput) =>
      treatyFn(
        api.products.products({ productId: data.productId }).attributes.post({
          attributeId: data.attributeId,
        })
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}
