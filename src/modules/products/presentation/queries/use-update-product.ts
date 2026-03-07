import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/infrastructure/api-client";
import { treatyFn } from "@/shared/presentation/queries/treaty-fn";
import { productKeys } from "./product-keys";

interface UpdateProductInput {
  id: string;
  name: string;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: UpdateProductInput) =>
      treatyFn(api.products({ id }).put({ name })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}
