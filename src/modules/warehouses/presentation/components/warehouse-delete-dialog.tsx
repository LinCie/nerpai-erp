"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/presentation/components/ui/alert-dialog";
import { Button } from "@/shared/presentation/components/ui/button";
import { toast } from "sonner";
import { getWarehouseErrorMessage } from "../queries/get-warehouse-error-message";
import { useDeleteWarehouse } from "../queries/use-delete-warehouse";

interface DeleteWarehouseDialogProps {
  warehouseId: string;
  warehouseName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteWarehouseDialog({
  warehouseId,
  warehouseName,
  onSuccess,
  trigger,
}: DeleteWarehouseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteWarehouseMutation = useDeleteWarehouse();

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteWarehouseMutation.mutateAsync(warehouseId);
      toast.success("Warehouse deleted successfully");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(
        getWarehouseErrorMessage(
          error,
          "Failed to delete warehouse. Please try again.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deleteWarehouseMutation, onSuccess, router, warehouseId]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{warehouseName}</strong>? This
            action will soft-delete the warehouse and it will no longer appear
            in the active list. You can restore it later from the trash.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Warehouse"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
