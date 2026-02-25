"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, X, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { Badge } from "@/shared/presentation/components/ui/badge";
import {
  TableCell,
  TableRow,
} from "@/shared/presentation/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/presentation/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  updateVariant,
  checkSkuAvailability,
  toggleVariantActive,
  softDeleteVariant,
} from "../actions/variant.actions";
import type { VariantWithOptions } from "../../domain/types";

interface VariantEditRowProps {
  variantWithOptions: VariantWithOptions;
  onUpdate?: () => void;
}

export function VariantEditRow({ variantWithOptions, onUpdate }: VariantEditRowProps) {
  const { variant, options } = variantWithOptions;
  const [isEditing, setIsEditing] = useState(false);
  const [editSku, setEditSku] = useState(variant.sku);
  const [editPrice, setEditPrice] = useState(parseFloat(variant.price).toString());
  const [editStock, setEditStock] = useState(variant.stockQuantity.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skuStatus, setSkuStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "invalid" | "error"
  >("idle");
  const [skuMessage, setSkuMessage] = useState<string | null>(null);

  const isNewVariant = parseFloat(variant.price) === 0 && variant.stockQuantity === 0;

  const handleStartEdit = useCallback(() => {
    setEditSku(variant.sku);
    setEditPrice(parseFloat(variant.price).toString());
    setEditStock(variant.stockQuantity.toString());
    setSkuStatus("idle");
    setSkuMessage(null);
    setIsEditing(true);
  }, [variant]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditSku(variant.sku);
    setEditPrice(parseFloat(variant.price).toString());
    setEditStock(variant.stockQuantity.toString());
    setSkuStatus("idle");
    setSkuMessage(null);
  }, [variant]);

  useEffect(() => {
    if (!isEditing) return;

    const trimmedSku = editSku.trim();
    if (trimmedSku.length === 0) {
      setSkuStatus("invalid");
      setSkuMessage("SKU is required");
      return;
    }
    if (trimmedSku === variant.sku) {
      setSkuStatus("idle");
      setSkuMessage(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setSkuStatus("checking");
      setSkuMessage("Checking SKU availability...");

      const formData = new FormData();
      formData.append("id", variant.id);
      formData.append("sku", trimmedSku);

      const result = await checkSkuAvailability(formData);

      if (!result.success) {
        setSkuStatus("error");
        setSkuMessage(result.error ?? "Could not check SKU availability");
        return;
      }

      if (result.available) {
        setSkuStatus("available");
        setSkuMessage("SKU is available");
      } else {
        setSkuStatus("unavailable");
        setSkuMessage("SKU already exists in your organization.");
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [isEditing, editSku, variant.id, variant.sku]);

  const handleSaveEdit = async () => {
    if (skuStatus === "checking" || skuStatus === "unavailable" || skuStatus === "invalid") {
      toast.error(skuMessage ?? "Please resolve SKU validation before saving");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", variant.id);
      
      if (editSku !== variant.sku) {
        formData.append("sku", editSku.trim());
      }
      
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice) && newPrice !== parseFloat(variant.price)) {
        formData.append("price", newPrice.toString());
      }
      
      const newStock = parseInt(editStock, 10);
      if (!isNaN(newStock) && newStock !== variant.stockQuantity) {
        formData.append("stockQuantity", newStock.toString());
      }

      const result = await updateVariant(formData);
      if (result.success) {
        toast.success("Variant updated");
        setIsEditing(false);
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to update variant");
      }
    } catch {
      toast.error("Failed to update variant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      const formData = new FormData();
      formData.append("id", variant.id);
      formData.append("isActive", String(!variant.isActive));

      const result = await toggleVariantActive(formData);
      if (result.success) {
        toast.success(variant.isActive ? "Variant deactivated" : "Variant activated");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to toggle variant status");
      }
    } catch {
      toast.error("Failed to toggle variant status");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      const formData = new FormData();
      formData.append("id", variant.id);

      const result = await softDeleteVariant(formData);
      if (result.success) {
        toast.success("Variant deleted");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to delete variant");
      }
    } catch {
      toast.error("Failed to delete variant");
    }
  };

  const optionLabels = options
    .sort((a, b) => a.productAttribute.displayOrder - b.productAttribute.displayOrder)
    .map((o) => o.option.value)
    .join(" / ");

  if (isEditing) {
    return (
      <TableRow className={variant.isActive ? "" : "opacity-50"}>
        <TableCell className="font-mono text-sm">
          <div className="space-y-1">
            <Input
              value={editSku}
              onChange={(e) => setEditSku(e.target.value)}
              className="h-8 font-mono"
              placeholder="SKU"
            />
            {skuMessage && (
              <p
                className={`text-xs ${
                  skuStatus === "unavailable" || skuStatus === "invalid" || skuStatus === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {skuMessage}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm">{optionLabels}</TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="h-8 w-24"
            placeholder="Price"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min="0"
            value={editStock}
            onChange={(e) => setEditStock(e.target.value)}
            className="h-8 w-24"
            placeholder="Stock"
          />
        </TableCell>
        <TableCell>
          <Badge variant={variant.isActive ? "default" : "secondary"}>
            {variant.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleSaveEdit}
              disabled={isSaving || skuStatus === "checking" || skuStatus === "unavailable" || skuStatus === "invalid"}
              aria-label="Save changes"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCancelEdit}
              disabled={isSaving}
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow className={variant.isActive ? "" : "opacity-50"}>
        <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
        <TableCell className="text-sm">{optionLabels}</TableCell>
        <TableCell>${parseFloat(variant.price).toFixed(2)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span>{variant.stockQuantity}</span>
            {variant.stockQuantity === 0 && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant={variant.isActive ? "default" : "secondary"}>
              {variant.isActive ? "Active" : "Inactive"}
            </Badge>
            {isNewVariant && (
              <Badge variant="outline">New</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleStartEdit}
              aria-label="Edit variant"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleToggleActive}
              disabled={isToggling}
              aria-label={variant.isActive ? "Deactivate variant" : "Activate variant"}
            >
              {variant.isActive ? (
                <PowerOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Power className="h-4 w-4 text-green-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete variant"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the variant &quot;{variant.sku}&quot;. The variant can be restored later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete Variant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
