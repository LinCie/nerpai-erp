import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attributeApi } from "./attribute-api";
import { attributeKeys } from "./attribute-keys";

export function useDeleteAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attributeApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      queryClient.removeQueries({ queryKey: attributeKeys.detail(id) });
    },
  });
}
