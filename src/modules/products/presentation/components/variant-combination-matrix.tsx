"use client";

import { useMemo, useState, useEffect } from "react";
import { Sparkles, Check, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Checkbox } from "@/shared/presentation/components/ui/checkbox";
import { Badge } from "@/shared/presentation/components/ui/badge";
import { Switch } from "@/shared/presentation/components/ui/switch";
import { Label } from "@/shared/presentation/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/presentation/components/ui/table";
import { toast } from "sonner";
import { generateVariants, getExistingVariantCombinationKeys } from "../actions/variant.actions";
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

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
    [[]]
  );
}

export function VariantCombinationMatrix({
  productId,
  attributes,
  existingVariantCount,
  onVariantsGenerated,
}: VariantCombinationMatrixProps) {
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [onlyNew, setOnlyNew] = useState(true);
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  const sortedAttributes = useMemo(
    () => [...attributes].sort((a, b) => a.productAttribute.displayOrder - b.productAttribute.displayOrder),
    [attributes]
  );

  useEffect(() => {
    if (existingVariantCount > 0) {
      setIsLoadingKeys(true);
      getExistingVariantCombinationKeys(productId)
        .then((result) => {
          if (result.success && result.keys) {
            setExistingKeys(new Set(result.keys));
          }
        })
        .finally(() => setIsLoadingKeys(false));
    }
  }, [productId, existingVariantCount]);

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

  const selectOnlyNewOptions = () => {
    const newSelections: Record<string, Set<string>> = {};
    for (const { attribute, options } of sortedAttributes) {
      const newOptionsForAttribute = new Set<string>();
      for (const option of options) {
        let isUsedInExisting = false;
        for (const key of existingKeys) {
          if (key.includes(option.id)) {
            isUsedInExisting = true;
            break;
          }
        }
        if (!isUsedInExisting) {
          newOptionsForAttribute.add(option.id);
        }
      }
      if (newOptionsForAttribute.size > 0) {
        newSelections[attribute.id] = newOptionsForAttribute;
      }
    }
    setSelections(newSelections);
  };

  const { totalCombinations, newCombinations, existingCombinations } = useMemo(() => {
    const counts = sortedAttributes.map((attr) => {
      const selected = selections[attr.attribute.id];
      return selected?.size ?? 0;
    });
    if (counts.some((c) => c === 0)) {
      return { totalCombinations: 0, newCombinations: 0, existingCombinations: 0 };
    }
    const total = counts.reduce((acc, c) => acc * c, 1);

    if (existingKeys.size === 0) {
      return { totalCombinations: total, newCombinations: total, existingCombinations: 0 };
    }

    const orderedOptionIds = sortedAttributes.map((attr) => {
      const selected = selections[attr.attribute.id];
      return Array.from(selected ?? []);
    });

    const combinations = cartesian(orderedOptionIds);

    let newCount = 0;
    let existingCount = 0;

    for (const combo of combinations) {
      const key = [...combo].sort().join("|");
      if (existingKeys.has(key)) {
        existingCount++;
      } else {
        newCount++;
      }
    }

    return { totalCombinations: total, newCombinations: newCount, existingCombinations: existingCount };
  }, [sortedAttributes, selections, existingKeys]);

  const optionsWithNewStatus = useMemo(() => {
    const result = new Map<string, { isNew: boolean; usedInExisting: boolean }>();

    for (const { options } of sortedAttributes) {
      for (const option of options) {
        let usedInExisting = false;
        for (const key of existingKeys) {
          if (key.includes(option.id)) {
            usedInExisting = true;
            break;
          }
        }
        result.set(option.id, { isNew: !usedInExisting, usedInExisting });
      }
    }

    return result;
  }, [sortedAttributes, existingKeys]);

  const handleGenerateVariants = async () => {
    if (totalCombinations === 0) {
      toast.error("Please select at least one option for each attribute");
      return;
    }

    if (onlyNew && newCombinations === 0) {
      toast.error("No new combinations to generate. All selected combinations already exist.");
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
      formData.append("onlyNew", onlyNew.toString());

      const result = await generateVariants(formData);
      if (result.success) {
        if (result.skipped && result.skipped > 0) {
          toast.success(`Generated ${result.created} new variant(s), skipped ${result.skipped} existing`);
        } else {
          toast.success(`Generated ${result.created} variant(s)`);
        }
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
  const hasExistingVariants = existingVariantCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variant Combinations</h3>
        <div className="flex items-center gap-2">
          {hasExistingVariants && (
            <>
              <Badge variant="secondary">{existingVariantCount} existing</Badge>
              {newCombinations > 0 && hasSelections && (
                <Badge variant="default" className="bg-green-600">
                  {newCombinations} new
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {hasExistingVariants && (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="only-new"
                checked={onlyNew}
                onCheckedChange={setOnlyNew}
              />
              <Label htmlFor="only-new" className="text-sm font-medium">
                Generate only new combinations
              </Label>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={selectOnlyNewOptions}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Select new options
          </Button>
        </div>
      )}

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
            {isLoadingKeys ? (
              <TableRow>
                <TableCell colSpan={sortedAttributes.length} className="text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-4 w-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : (
              (() => {
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
                        const optionStatus = optionsWithNewStatus.get(option.id);
                        const isNew = optionStatus?.isNew ?? !hasExistingVariants;
                        const usedInExisting = optionStatus?.usedInExisting ?? false;

                        return (
                          <TableCell key={`${attribute.id}-${option.id}`}>
                            <label
                              className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors ${
                                isNew && hasExistingVariants
                                  ? "bg-green-50 dark:bg-green-950"
                                  : ""
                              } ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleOption(attribute.id, option.id)}
                              />
                              <span className={isSelected ? "font-medium" : ""}>{option.value}</span>
                              {isNew && hasExistingVariants && (
                                <Badge variant="outline" className="ml-auto text-xs text-green-600 border-green-600">
                                  new
                                </Badge>
                              )}
                              {usedInExisting && !isNew && hasExistingVariants && (
                                <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">
                                  existing
                                </Badge>
                              )}
                            </label>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                }
                return rows;
              })()
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCombinations > 0 ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                {onlyNew && hasExistingVariants ? (
                  <>
                    <strong>{newCombinations}</strong> new combination{newCombinations !== 1 ? "s" : ""}
                    {existingCombinations > 0 && (
                      <span className="text-muted-foreground">
                        {" "}({existingCombinations} existing skipped)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <strong>{totalCombinations}</strong> combination{totalCombinations !== 1 ? "s" : ""}
                    {hasExistingVariants && existingCombinations > 0 && (
                      <span className="text-muted-foreground">
                        {" "}({existingCombinations} existing, {newCombinations} new)
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          ) : hasSelections ? (
            "Select at least one option for each attribute"
          ) : (
            "Select options to generate variants"
          )}
        </div>
        <Button
          onClick={handleGenerateVariants}
          disabled={totalCombinations === 0 || isGenerating || (onlyNew && newCombinations === 0)}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating
            ? "Generating..."
            : onlyNew && hasExistingVariants
              ? `Generate ${newCombinations} New`
              : "Generate Variants"}
        </Button>
      </div>
    </div>
  );
}
