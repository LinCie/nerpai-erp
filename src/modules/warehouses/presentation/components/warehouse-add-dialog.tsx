"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { WarehouseForm } from "./warehouse-form";
import { toast } from "sonner";

interface AddWarehouseDialogProps {
  onSuccess?: () => void;
}

export function AddWarehouseDialog({ onSuccess }: AddWarehouseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Warehouse created successfully");
    setOpen(false);
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="add-warehouse-trigger">
          <Plus className="w-4 h-4 mr-2" />
          Add Warehouse
        </Button>
      </DialogTrigger>
      {/* We use max-w-2xl to give the form enough space for 2 columns */}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Warehouse</DialogTitle>
        </DialogHeader>
        {open && <WarehouseForm onSuccess={handleSuccess} />}
      </DialogContent>
    </Dialog>
  );
}
