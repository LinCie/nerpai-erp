"use client";

import { useState, useCallback } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { ProductEditForm } from "./product-edit-form";
import { toast } from "sonner";
import type { Product } from "../../domain/entities/product";

interface EditProductDialogProps {
  product: Product;
  onSuccess?: () => void;
}

export function EditProductDialog({ product, onSuccess }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Product updated successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${product.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        {open && <ProductEditForm product={product} onSuccess={handleSuccess} />}
      </DialogContent>
    </Dialog>
  );
}
