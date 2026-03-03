"use client";

import { Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/presentation/components/ui/table";
import { VariantEmptyState } from "./variant-empty-state";
import { VariantEditRow } from "./variant-edit-row";
import type { VariantWithOptions } from "../../domain/types";

interface VariantListProps {
  variants: VariantWithOptions[];
  hasAttributes?: boolean;
  stockByVariantId?: Map<string, number>;
  onUpdate?: () => void;
}

export function VariantList({
  variants,
  hasAttributes = false,
  stockByVariantId,
  onUpdate,
}: VariantListProps) {
  if (variants.length === 0) {
    return <VariantEmptyState hasAttributes={hasAttributes} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Product Variants</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {variants.length} variant{variants.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variantWithOptions) => (
              <VariantEditRow
                key={variantWithOptions.variant.id}
                variantWithOptions={variantWithOptions}
                totalStock={stockByVariantId?.get(
                  variantWithOptions.variant.id,
                )}
                onUpdate={onUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
