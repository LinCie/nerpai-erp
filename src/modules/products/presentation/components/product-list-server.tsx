"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/modules/products/domain/entities/product";
import { ProductList } from "./product-list";
import { ProductEmptyState } from "./product-empty-state";
import { ProductSearch } from "./product-search";

interface ProductListServerProps {
  products: Product[];
  searchQuery: string;
}

export function ProductListServer({ products, searchQuery }: ProductListServerProps) {
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

  const handleEdit = (product: Product) => {
    // TODO: Implement in Phase 5
    console.log("Edit:", product);
  };

  const handleDelete = (product: Product) => {
    // TODO: Implement in Phase 6
    console.log("Delete:", product);
  };

  return (
    <div className="space-y-4">
      <ProductSearch 
        value={searchQuery} 
        onChange={handleSearchChange}
        disabled={isSearching}
      />
      
      {products.length > 0 ? (
        <ProductList 
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
