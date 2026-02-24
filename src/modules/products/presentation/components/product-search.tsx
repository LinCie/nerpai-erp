"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Button } from "@/shared/presentation/components/ui/button";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductSearch({ value, onChange, placeholder = "Search products...", disabled }: ProductSearchProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        aria-label="Search products"
        disabled={disabled}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
