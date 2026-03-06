import { useQuery } from "@tanstack/react-query";
import { attributeKeys } from "./attribute-keys";
import { attributeApi, type AttributeWithOptionsApi } from "./attribute-api";
export type { AttributeOptionApi, AttributeWithOptionsApi } from "./attribute-api";

interface AttributesFilters {
  search?: string;
}

export function useAttributes(
  filters?: AttributesFilters,
  initialData?: AttributeWithOptionsApi[],
) {
  return useQuery({
    queryKey: attributeKeys.list(filters ?? {}),
    queryFn: () => attributeApi.list(filters),
    ...(initialData ? { initialData } : {}),
  });
}

export function useAttribute(id: string) {
  return useQuery({
    queryKey: attributeKeys.detail(id),
    queryFn: () => attributeApi.get(id),
    enabled: Boolean(id),
  });
}
