"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { toast } from "sonner";
import type { Product } from "../../domain/entities/product";
import { useDeleteProduct } from "../queries/use-delete-product";

interface ProductDeleteDialogProps {
  product: Product;
  onSuccess?: () => void;
}

export function ProductDeleteDialog({ product, onSuccess }: ProductDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteProductMutation = useDeleteProduct();

  const handleDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync(product.id);
      toast.success(`"${product.name}" has been deleted`);
      setOpen(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to delete product. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${product.name}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{product.name}</strong>? This
            action can be undone by restoring the product from the trash.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteProductMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
