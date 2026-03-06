import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AttributeFormData } from "../schemas/attribute.schema";
import { attributeApi } from "./attribute-api";
import { attributeKeys } from "./attribute-keys";

export function useCreateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AttributeFormData) => attributeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
    },
  });
}
