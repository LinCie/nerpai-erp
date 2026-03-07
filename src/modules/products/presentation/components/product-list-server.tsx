"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/modules/products/domain/entities/product";
import { ProductList } from "./product-list";
import { ProductEmptyState } from "./product-empty-state";
import { ProductSearch } from "./product-search";

interface ProductListServerProps {
  productsData: {
    data: Product[];
    metadata: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
  searchQuery: string;
}

export function ProductListServer({
  productsData,
  searchQuery,
}: ProductListServerProps) {
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

  const handleSuccess = () => {
    // Refresh the page data after delete
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <ProductSearch
        value={searchQuery}
        onChange={handleSearchChange}
        disabled={isSearching}
      />

      {productsData.data.length > 0 ? (
        <ProductList productsData={productsData} onSuccess={handleSuccess} />
      ) : (
        <ProductEmptyState
          searchQuery={searchQuery}
          onAddClick={() => {
            // This will be handled by the AddProductDialog trigger
            document.getElementById("add-product-trigger")?.click();
          }}
        />
      )}
    </div>
  );
}
