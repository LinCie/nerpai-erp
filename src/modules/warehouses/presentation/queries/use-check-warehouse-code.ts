import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";

export function useCheckWarehouseCode() {
  return useMutation({
    mutationFn: (code: string) =>
      treatyFn(
        api.warehouses["check-code"].get({
          query: { code },
        }),
      ),
  });
}
