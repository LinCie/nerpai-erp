"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Button } from "@/shared/presentation/components/ui/button";
import { searchProducts } from "../actions/order.actions";
import type { ProductPickerResult } from "../types";

interface ProductPickerProps {
  value: {
    productId: string | null;
    productVariantId: string | null;
    productName: string;
    sku: string;
    unitPrice: number;
  };
  onChange: (value: ProductPickerResult) => void;
  disabled?: boolean;
}

interface ProductOption {
  productId: string;
  productVariantId: string | null;
  productName: string;
  sku: string;
  unitPrice: string;
  hasVariants: boolean;
}

export function ProductPicker({
  value,
  onChange,
  disabled = false,
}: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchProducts({ search: term, limit: 20 });
      setOptions(results);
    } catch (error) {
      console.error("Error searching products:", error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: ProductOption) => {
    onChange({
      productId: option.productId,
      productVariantId: option.productVariantId,
      productName: option.productName,
      sku: option.sku,
      unitPrice: parseFloat(option.unitPrice) || 0,
    });
    setSearchTerm("");
    setIsOpen(false);
    setOptions([]);
  };

  const handleClear = () => {
    onChange({
      productId: null,
      productVariantId: null,
      productName: "",
      sku: "",
      unitPrice: 0,
    });
    setSearchTerm("");
    setIsOpen(false);
  };

  const hasSelection = value.productName && value.sku;

  return (
    <div ref={containerRef} className="relative w-full">
      {hasSelection ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{value.productName}</p>
            <p className="text-sm text-muted-foreground truncate">
              SKU: {value.sku} • ${value.unitPrice.toFixed(2)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
            className="pl-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {isOpen && !hasSelection && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {searchTerm.length < 2 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Type at least 2 characters to search
            </div>
          ) : options.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {isLoading ? "Searching..." : "No products found"}
            </div>
          ) : (
            <ul className="py-1">
              {options.map((option) => (
                <li key={`${option.productId}-${option.productVariantId ?? "null"}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <div className="font-medium">{option.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {option.sku} • ${parseFloat(option.unitPrice || "0").toFixed(2)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
