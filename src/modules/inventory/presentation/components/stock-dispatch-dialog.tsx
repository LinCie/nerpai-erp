"use client";

import { useState, useCallback } from "react";
import { Icons } from "@/shared/presentation/components/icons";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { StockDispatchForm } from "./stock-dispatch-form";
import { toast } from "sonner";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";
import type { InventoryVariantOption } from "../types";

interface StockDispatchDialogProps {
  products: Product[];
  warehouses: Warehouse[];
  variants: InventoryVariantOption[];
  onSuccess?: () => void;
}

export function StockDispatchDialog({
  products,
  warehouses,
  variants,
  onSuccess,
}: StockDispatchDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Stock dispatched successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="dispatch-stock-trigger" variant="outline">
          <Icons.arrowUpFromLine className="w-4 h-4 mr-2" />
          Dispatch Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispatch Stock</DialogTitle>
        </DialogHeader>
        {open && (
          <StockDispatchForm
            products={products}
            warehouses={warehouses}
            variants={variants}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
