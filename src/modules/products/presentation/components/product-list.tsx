"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import type { Product } from "../../domain/entities/product";
import { EditProductDialog } from "./product-edit-dialog";
import { ProductDeleteDialog } from "./product-delete-dialog";
import { useProducts } from "../queries/use-products";

interface ProductListProps {
  products: Product[];
  onSuccess?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "value" in error) {
    const errorValue = (error as { value?: unknown }).value;
    if (
      errorValue &&
      typeof errorValue === "object" &&
      "error" in errorValue &&
      typeof (errorValue as { error?: unknown }).error === "string"
    ) {
      return (errorValue as { error: string }).error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to load products.";
}

export function ProductList({ products, onSuccess }: ProductListProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? undefined;
  const {
    data: activeProducts = [],
    isLoading,
    isError,
    error,
  } = useProducts({ search }, products);

  if (isError) {
    return (
      <div className="rounded-md border p-4 text-sm text-destructive">
        {getErrorMessage(error)}
      </div>
    );
  }

  if (isLoading && activeProducts.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Loading products...
      </div>
    );
  }

  if (activeProducts.length === 0) {
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
          {activeProducts.map((product) => (
            <tr
              key={product.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle">
                <Link
                  href={`/products/${product.id}`}
                  className="font-medium hover:underline"
                >
                  {product.name}
                </Link>
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
