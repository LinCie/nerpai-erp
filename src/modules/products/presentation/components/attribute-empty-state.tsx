"use client";

import { Layers, Plus } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";

interface AttributeEmptyStateProps {
  onAddClick?: () => void;
  searchQuery?: string;
}

export function AttributeEmptyState({ onAddClick, searchQuery }: AttributeEmptyStateProps) {
  const isSearching = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Layers className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {isSearching ? "No attributes found" : "No attributes yet"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {isSearching
          ? `No attributes match your search for "${searchQuery}". Try a different search term.`
          : "Attributes define product variations like Color or Size. Create your first attribute to get started."}
      </p>
      {!isSearching && onAddClick && (
        <Button onClick={onAddClick} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      )}
    </div>
  );
}
