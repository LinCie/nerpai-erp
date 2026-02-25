"use client";

import { PackageOpen } from "lucide-react";

interface VariantEmptyStateProps {
  hasAttributes?: boolean;
}

export function VariantEmptyState({ hasAttributes = false }: VariantEmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <PackageOpen className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">
        {hasAttributes
          ? "No variants generated yet. Select combinations above to generate variants."
          : "Add attributes to your product first, then generate variants."}
      </p>
    </div>
  );
}
