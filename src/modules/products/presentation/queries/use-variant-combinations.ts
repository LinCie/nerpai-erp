import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import { variantKeys } from "./variant-keys";

export function useGetVariantCombinations(productId: string) {
  return useQuery({
    queryKey: variantKeys.combinations(productId),
    queryFn: () =>
      treatyFn(
        api.products.products({ productId })["variant-combinations"].get()
      ),
  });
}
