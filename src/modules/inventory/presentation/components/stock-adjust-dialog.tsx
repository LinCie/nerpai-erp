"use client";

import { useState, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { StockAdjustForm } from "./stock-adjust-form";
import { toast } from "sonner";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";

interface StockAdjustDialogProps {
  products: Product[];
  warehouses: Warehouse[];
  onSuccess?: () => void;
}

export function StockAdjustDialog({
  products,
  warehouses,
  onSuccess,
}: StockAdjustDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Stock adjusted successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="adjust-stock-trigger" variant="outline">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        {open && (
          <StockAdjustForm
            products={products}
            warehouses={warehouses}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
