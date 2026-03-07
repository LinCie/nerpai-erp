"use client";

import { Package, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/presentation/components/ui/button";
import { toast } from "sonner";
import type { Product } from "../../domain/entities/product";
import { useProductsTrash } from "../queries/use-products";
import { useRestoreProduct } from "../queries/use-restore-product";

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
  const { data: trashProducts = [] } = useProductsTrash(products);
  const restoreProductMutation = useRestoreProduct();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (product: Product) => {
    setRestoringId(product.id);

    try {
      await restoreProductMutation.mutateAsync(product.id);
      toast.success(`"${product.name}" has been restored`);
      onSuccess?.();
    } catch {
      toast.error("Failed to restore product. Please try again.");
    } finally {
      setRestoringId(null);
    }
  };

  if (trashProducts.length === 0) {
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
          {trashProducts.map((product) => (
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
                    disabled={
                      restoreProductMutation.isPending &&
                      restoringId === product.id
                    }
                    aria-label={`Restore ${product.name}`}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {restoreProductMutation.isPending && restoringId === product.id
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
