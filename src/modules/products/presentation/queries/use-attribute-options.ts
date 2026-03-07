import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AttributeOptionFormData } from "../schemas/attribute.schema";
import { attributeApi } from "./attribute-api";
import { attributeKeys } from "./attribute-keys";

interface CreateAttributeOptionInput extends AttributeOptionFormData {
  attributeId: string;
}

interface UpdateAttributeOptionInput extends AttributeOptionFormData {
  attributeId: string;
  id: string;
}

interface DeleteAttributeOptionInput {
  attributeId: string;
  id: string;
}

export function useCreateAttributeOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attributeId, ...data }: CreateAttributeOptionInput) =>
      attributeApi.createOption(attributeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: attributeKeys.detail(variables.attributeId),
      });
    },
  });
}

export function useUpdateAttributeOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attributeId, id, ...data }: UpdateAttributeOptionInput) =>
      attributeApi.updateOption(attributeId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: attributeKeys.detail(variables.attributeId),
      });
    },
  });
}

export function useDeleteAttributeOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attributeId, id }: DeleteAttributeOptionInput) =>
      attributeApi.deleteOption(attributeId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: attributeKeys.detail(variables.attributeId),
      });
    },
  });
}
