"use client";

import { Package, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/shared/presentation/components/ui/button";
import { toast } from "sonner";
import type { Product } from "../../domain/entities/product";
import { restoreProduct } from "../actions/product.actions";

interface ProductTrashListProps {
  products: Product[];
  onSuccess?: () => void;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProductTrashList({ products, onSuccess }: ProductTrashListProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRestore = (product: Product) => {
    setRestoringId(product.id);
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", product.id);

        await restoreProduct(formData);

        toast.success(`"${product.name}" has been restored`);
        onSuccess?.();
      } catch {
        toast.error("Failed to restore product. Please try again.");
      } finally {
        setRestoringId(null);
      }
    });
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Name
              </div>
            </th>
            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
              Deleted Date
            </th>
            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[140px]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle">
                <span className="font-medium text-muted-foreground">
                  {product.name}
                </span>
              </td>
              <td className="p-4 align-middle">
                <span className="text-sm text-muted-foreground">
                  {product.deletedAt ? formatDate(product.deletedAt) : "Unknown"}
                </span>
              </td>
              <td className="p-4 align-middle">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(product)}
                    disabled={isPending && restoringId === product.id}
                    aria-label={`Restore ${product.name}`}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isPending && restoringId === product.id
                      ? "Restoring..."
                      : "Restore"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
