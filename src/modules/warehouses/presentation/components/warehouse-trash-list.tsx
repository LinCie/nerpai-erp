"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, Loader2, MapPin, Calendar } from "lucide-react";
import type { Warehouse as WarehouseEntity } from "../../domain/entities/warehouse";
import { Button } from "@/shared/presentation/components/ui/button";
import { toast } from "sonner";
import { getWarehouseErrorMessage } from "../queries/get-warehouse-error-message";
import { useRestoreWarehouse } from "../queries/use-restore-warehouse";
import { useWarehousesTrash } from "../queries/use-warehouses";

interface WarehouseTrashListProps {
  warehouses: WarehouseEntity[];
  onRestore?: () => void;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WarehouseTrashItem({
  warehouse,
  onRestoreSuccess,
}: {
  warehouse: WarehouseEntity;
  onRestoreSuccess: () => void;
}) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreWarehouseMutation = useRestoreWarehouse();

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      await restoreWarehouseMutation.mutateAsync(warehouse.id);
      toast.success(`"${warehouse.name}" restored successfully`);
      router.refresh();
      onRestoreSuccess();
    } catch (error) {
      toast.error(
        getWarehouseErrorMessage(
          error,
          "Failed to restore warehouse. Please try again.",
        ),
      );
    } finally {
      setIsRestoring(false);
    }
  }, [onRestoreSuccess, restoreWarehouseMutation, router, warehouse.id, warehouse.name]);

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium truncate">{warehouse.name}</span>
          <span className="text-sm text-muted-foreground">
            ({warehouse.code})
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {warehouse.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{warehouse.city}</span>
              {warehouse.province && <span>, {warehouse.province}</span>}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Deleted: {formatDate(warehouse.deletedAt)}</span>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={isRestoring}
      >
        {isRestoring ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4 mr-2" />
        )}
        Restore
      </Button>
    </div>
  );
}

export function WarehouseTrashList({ warehouses, onRestore }: WarehouseTrashListProps) {
  const [key, setKey] = useState(0);
  const { data: trashWarehouses = warehouses } = useWarehousesTrash(warehouses);

  const handleRestoreSuccess = useCallback(() => {
    setKey((prev) => prev + 1);
    onRestore?.();
  }, [onRestore]);

  if (trashWarehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Trash2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Trash is empty</h3>
        <p className="text-muted-foreground max-w-sm">
          No deleted warehouses found. Deleted warehouses will appear here and
          can be restored at any time.
        </p>
      </div>
    );
  }

  return (
    <div key={key} className="rounded-md border">
      {trashWarehouses.map((warehouse) => (
        <WarehouseTrashItem
          key={warehouse.id}
          warehouse={warehouse}
          onRestoreSuccess={handleRestoreSuccess}
        />
      ))}
    </div>
  );
}
