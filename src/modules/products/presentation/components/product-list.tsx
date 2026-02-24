"use client";

import { Package } from "lucide-react";
import type { Product } from "../../domain/entities/product";
import { EditProductDialog } from "./product-edit-dialog";
import { ProductDeleteDialog } from "./product-delete-dialog";

interface ProductListProps {
  products: Product[];
  onSuccess?: () => void;
}

export function ProductList({ products, onSuccess }: ProductListProps) {
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
                <span className="font-medium">{product.name}</span>
              </td>
              <td className="p-4 align-middle">
                <div className="flex items-center justify-end gap-2">
                  <EditProductDialog product={product} onSuccess={onSuccess} />
                  <ProductDeleteDialog product={product} onSuccess={onSuccess} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
