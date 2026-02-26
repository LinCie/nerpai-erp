"use client";

import { Warehouse, Plus } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";

interface WarehouseEmptyStateProps {
  onAddClick?: () => void;
  searchQuery?: string;
}

export function WarehouseEmptyState({
  onAddClick,
  searchQuery,
}: WarehouseEmptyStateProps) {
  const isSearching = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Warehouse className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {isSearching ? "No warehouses found" : "No warehouses yet"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {isSearching
          ? `No warehouses match your search for "${searchQuery}". Try a different search term.`
          : "Get started by creating your first warehouse."}
      </p>
      {!isSearching && onAddClick && (
        <Button onClick={onAddClick} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      )}
    </div>
  );
}