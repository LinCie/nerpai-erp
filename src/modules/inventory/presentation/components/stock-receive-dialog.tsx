"use client";

import { useState, useCallback } from "react";
import { Package } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { StockReceiveForm } from "./stock-receive-form";
import { toast } from "sonner";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";

interface StockReceiveDialogProps {
  products: Product[];
  warehouses: Warehouse[];
  onSuccess?: () => void;
}

export function StockReceiveDialog({
  products,
  warehouses,
  onSuccess,
}: StockReceiveDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Stock received successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="receive-stock-trigger">
          <Package className="w-4 h-4 mr-2" />
          Receive Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
        </DialogHeader>
        {open && (
          <StockReceiveForm
            products={products}
            warehouses={warehouses}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
