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
import { WarehouseEditForm } from "./warehouse-edit-form";
import { toast } from "sonner";
import type { Warehouse } from "../../domain/entities/warehouse";

interface EditWarehouseDialogProps {
  warehouse: Warehouse;
  onSuccess?: () => void;
  /** Optional custom trigger element; defaults to an icon button with pencil icon */
  trigger?: React.ReactNode;
}

export function EditWarehouseDialog({
  warehouse,
  onSuccess,
  trigger,
}: EditWarehouseDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Warehouse updated successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" aria-label="Edit warehouse">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Warehouse</DialogTitle>
        </DialogHeader>
        {open && (
          <WarehouseEditForm warehouse={warehouse} onSuccess={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}