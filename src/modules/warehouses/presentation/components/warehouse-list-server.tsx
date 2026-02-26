"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";
import { WarehouseList } from "./warehouse-list";
import { WarehouseEmptyState } from "./warehouse-empty-state";
import { WarehouseSearch } from "./warehouse-search";

interface WarehouseListServerProps {
  warehouses: Warehouse[];
  searchQuery: string;
  province?: string;
  provinces: string[];
}

export function WarehouseListServer({
  warehouses,
  searchQuery,
  province,
  provinces,
}: WarehouseListServerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (value: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set("search", value);
      } else {
        url.searchParams.delete("search");
      }
      router.push(url.pathname + url.search);
    });
  };

  const handleProvinceChange = (value: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);
      if (value && value !== "all") {
        url.searchParams.set("province", value);
      } else {
        url.searchParams.delete("province");
      }
      router.push(url.pathname + url.search);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <WarehouseSearch
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={isPending}
        />
        {provinces.length > 0 && (
          <select
            value={province || "all"}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]"
            aria-label="Filter by province"
          >
            <option value="all">All Provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {warehouses.length > 0 ? (
        <WarehouseList warehouses={warehouses} />
      ) : (
        <WarehouseEmptyState
          searchQuery={searchQuery}
          onAddClick={() => {
            document.getElementById("add-warehouse-trigger")?.click();
          }}
        />
      )}
    </div>
  );
}