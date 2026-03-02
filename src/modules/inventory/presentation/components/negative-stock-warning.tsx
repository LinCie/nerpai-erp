"use client";

import { Icons } from "@/shared/presentation/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/presentation/components/ui/alert-dialog";

interface NegativeStockWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStock: number;
  resultingStock: number;
}

export function NegativeStockWarning({
  isOpen,
  onClose,
  onConfirm,
  currentStock,
  resultingStock,
}: NegativeStockWarningProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
            <Icons.alert className="h-5 w-5 text-destructive" />
            Negative Stock Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This dispatch will result in negative stock levels. Please review
              the details:
            </p>
            <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="font-medium">{currentStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resulting Stock:</span>
                <span className="font-medium text-destructive">
                  {resultingStock} units
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Deficit:</span>
                <span className="font-medium text-destructive">
                  {Math.abs(resultingStock)} units
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to proceed? This will create a negative
              stock balance.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm Dispatch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
