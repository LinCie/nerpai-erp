"use client";

import { Package, Plus } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";

interface ProductEmptyStateProps {
  onAddClick?: () => void;
  searchQuery?: string;
}

export function ProductEmptyState({ onAddClick, searchQuery }: ProductEmptyStateProps) {
  const isSearching = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {isSearching ? "No products found" : "No products yet"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {isSearching
          ? `No products match your search for "${searchQuery}". Try a different search term.`
          : "Get started by creating your first product."}
      </p>
      {!isSearching && onAddClick && (
        <Button onClick={onAddClick} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      )}
    </div>
  );
}
