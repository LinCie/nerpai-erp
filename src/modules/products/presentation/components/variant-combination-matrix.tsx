"use client";

import { useMemo, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Checkbox } from "@/shared/presentation/components/ui/checkbox";
import { Badge } from "@/shared/presentation/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/presentation/components/ui/table";
import { toast } from "sonner";
import { generateVariants } from "../actions/variant.actions";
import type { AttributeWithOptions } from "../../domain/types";
import type { ProductAttribute } from "../../domain/entities/product-attribute";

interface VariantCombinationMatrixProps {
  productId: string;
  attributes: Array<{
    productAttribute: ProductAttribute;
    attribute: AttributeWithOptions["attribute"];
    options: AttributeWithOptions["options"];
  }>;
  existingVariantCount: number;
  onVariantsGenerated?: () => void;
}

export function VariantCombinationMatrix({
  productId,
  attributes,
  existingVariantCount,
  onVariantsGenerated,
}: VariantCombinationMatrixProps) {
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedAttributes = useMemo(
    () => [...attributes].sort((a, b) => a.productAttribute.displayOrder - b.productAttribute.displayOrder),
    [attributes]
  );

  const toggleOption = (attributeId: string, optionId: string) => {
    setSelections((prev) => {
      const current = prev[attributeId] ?? new Set<string>();
      const newSet = new Set(current);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return { ...prev, [attributeId]: newSet };
    });
  };

  const toggleAllForAttribute = (attributeId: string, options: AttributeWithOptions["options"]) => {
    setSelections((prev) => {
      const current = prev[attributeId] ?? new Set<string>();
      const allSelected = current.size === options.length;
      const newSet = allSelected ? new Set<string>() : new Set(options.map((o) => o.id));
      return { ...prev, [attributeId]: newSet };
    });
  };

  const totalCombinations = useMemo(() => {
    const counts = sortedAttributes.map((attr) => {
      const selected = selections[attr.attribute.id];
      return selected?.size ?? 0;
    });
    if (counts.some((c) => c === 0)) return 0;
    return counts.reduce((acc, c) => acc * c, 1);
  }, [sortedAttributes, selections]);

  const handleGenerateVariants = async () => {
    if (totalCombinations === 0) {
      toast.error("Please select at least one option for each attribute");
      return;
    }

    setIsGenerating(true);
    try {
      const selectionsRecord: Record<string, string[]> = {};
      for (const [attrId, optionIds] of Object.entries(selections)) {
        selectionsRecord[attrId] = Array.from(optionIds);
      }

      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("selections", JSON.stringify(selectionsRecord));

      const result = await generateVariants(formData);
      if (result.success) {
        toast.success(`Generated ${result.created} variant(s)`);
        setSelections({});
        onVariantsGenerated?.();
      } else {
        toast.error(result.error || "Failed to generate variants");
      }
    } catch {
      toast.error("Failed to generate variants");
    } finally {
      setIsGenerating(false);
    }
  };

  if (sortedAttributes.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Add attributes to your product to generate variants.
        </p>
      </div>
    );
  }

  const hasSelections = Object.values(selections).some((s) => s.size > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variant Combinations</h3>
        {existingVariantCount > 0 && (
          <Badge variant="secondary">{existingVariantCount} existing variant(s)</Badge>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {sortedAttributes.map(({ attribute, options }) => (
                <TableHead key={attribute.id} className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{attribute.name}</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toggleAllForAttribute(attribute.id, options)}
                    >
                      {selections[attribute.id]?.size === options.length ? "None" : "All"}
                    </Button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const maxOptions = Math.max(...sortedAttributes.map((a) => a.options.length));
              const rows = [];
              for (let i = 0; i < maxOptions; i++) {
                rows.push(
                  <TableRow key={i}>
                    {sortedAttributes.map(({ attribute, options }) => {
                      const option = options[i];
                      if (!option) {
                        return <TableCell key={attribute.id} />;
                      }
                      const isSelected = selections[attribute.id]?.has(option.id) ?? false;
                      return (
                        <TableCell key={`${attribute.id}-${option.id}`}>
                          <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOption(attribute.id, option.id)}
                            />
                            <span className={isSelected ? "font-medium" : ""}>{option.value}</span>
                          </label>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              }
              return rows;
            })()}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCombinations > 0 ? (
            <>
              <Check className="mr-1 inline h-4 w-4 text-green-500" />
              {totalCombinations} combination{totalCombinations !== 1 ? "s" : ""} selected
            </>
          ) : hasSelections ? (
            "Select at least one option for each attribute"
          ) : (
            "Select options to generate variants"
          )}
        </div>
        <Button
          onClick={handleGenerateVariants}
          disabled={totalCombinations === 0 || isGenerating}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Variants"}
        </Button>
      </div>
    </div>
  );
}
