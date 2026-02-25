"use client";

import { useState, useCallback } from "react";
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

  const handleStartEdit = useCallback(() => {
    setEditSku(variant.sku);
    setEditPrice(parseFloat(variant.price).toString());
    setEditStock(variant.stockQuantity.toString());
    setIsEditing(true);
  }, [variant]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditSku(variant.sku);
    setEditPrice(parseFloat(variant.price).toString());
    setEditStock(variant.stockQuantity.toString());
  }, [variant]);

  const handleSaveEdit = async () => {
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
          <Input
            value={editSku}
            onChange={(e) => setEditSku(e.target.value)}
            className="h-8 font-mono"
            placeholder="SKU"
          />
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
              disabled={isSaving}
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
        <TableCell>{variant.stockQuantity}</TableCell>
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
