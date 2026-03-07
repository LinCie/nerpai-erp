import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { GenerateVariantsBody } from "../schemas/variant.schema";
import { variantKeys } from "./variant-keys";

interface GenerateVariantsInput extends GenerateVariantsBody {
  productId: string;
}

export function useGenerateVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateVariantsInput) =>
      treatyFn(
        api.products.products({ productId: data.productId }).variants.generate.post({
          selections: data.selections,
          onlyNew: data.onlyNew,
        })
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: variantKeys.list(variables.productId),
      });
    },
  });
}
