"use client";

import { useState, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { StockTransferForm } from "./stock-transfer-form";
import { toast } from "sonner";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";

interface StockTransferDialogProps {
  products: Product[];
  warehouses: Warehouse[];
  onSuccess?: () => void;
}

export function StockTransferDialog({
  products,
  warehouses,
  onSuccess,
}: StockTransferDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Stock transferred successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="transfer-stock-trigger" variant="outline">
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Transfer Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
        </DialogHeader>
        {open && (
          <StockTransferForm
            products={products}
            warehouses={warehouses}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
