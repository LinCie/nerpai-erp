import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attributeApi } from "./attribute-api";
import { attributeKeys } from "./attribute-keys";

interface UpdateAttributeInput {
  id: string;
  name: string;
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: UpdateAttributeInput) =>
      attributeApi.update(id, { name }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: attributeKeys.detail(variables.id),
      });
    },
  });
}
