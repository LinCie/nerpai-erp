"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AttributeWithOptionsApi } from "../queries/use-attributes";
import { AttributeList } from "./attribute-list";
import { AttributeEmptyState } from "./attribute-empty-state";
import { AddAttributeDialog } from "./attribute-add-dialog";
import { ProductSearch } from "./product-search";

interface AttributeListServerProps {
  initialAttributes: AttributeWithOptionsApi[];
  searchQuery: string;
}

export function AttributeListServer({
  initialAttributes,
  searchQuery,
}: AttributeListServerProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = (value: string) => {
    setIsSearching(true);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("search", value);
    } else {
      url.searchParams.delete("search");
    }
    router.push(url.pathname + url.search);
    setIsSearching(false);
  };

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const hasAttributes = initialAttributes.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <ProductSearch
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search attributes..."
          disabled={isSearching}
        />
        <AddAttributeDialog onSuccess={handleSuccess} />
      </div>

      {hasAttributes ? (
        <AttributeList initialAttributes={initialAttributes} onSuccess={handleSuccess} />
      ) : (
        <AttributeEmptyState
          searchQuery={searchQuery}
          onAddClick={() => {
            const trigger = document.getElementById("add-attribute-trigger");
            trigger?.click();
          }}
        />
      )}
    </div>
  );
}
