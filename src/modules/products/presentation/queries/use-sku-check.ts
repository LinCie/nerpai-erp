import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import type { CheckSkuBody } from "../schemas/variant.schema";

export function useCheckSkuAvailability() {
  return useMutation({
    mutationFn: (data: CheckSkuBody) =>
      treatyFn(
        api.products.variants["check-sku"].post({
          sku: data.sku,
          excludeVariantId: data.excludeVariantId,
        })
      ),
  });
}
