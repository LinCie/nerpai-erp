"use client";

import { useState } from "react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Icons } from "@/shared/presentation/components/icons";
import type { StockMovementWithDetails } from "../types";
import type { MovementType } from "../../domain/types";

interface MovementHistoryProps {
  movements: StockMovementWithDetails[];
}

function getMovementTypeIcon(type: MovementType) {
  switch (type) {
    case "receive":
      return <Icons.arrowDownRight className="h-4 w-4 text-green-600" />;
    case "dispatch":
      return <Icons.arrowUpRight className="h-4 w-4 text-red-600" />;
    case "adjustment":
      return <Icons.minus className="h-4 w-4 text-orange-600" />;
  }
}

function getMovementTypeLabel(type: MovementType) {
  switch (type) {
    case "receive":
      return "Receive";
    case "dispatch":
      return "Dispatch";
    case "adjustment":
      return "Adjustment";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function MovementHistory({ movements }: MovementHistoryProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const uniqueProducts = Array.from(
    new Map(movements.map((movement) => [movement.productId, movement.productName]))
  );

  const uniqueWarehouses = Array.from(
    new Map(movements.map((movement) => [movement.warehouseId, movement.warehouseName]))
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMovements = movements.filter((movement) => {
    if (selectedType && movement.movementType !== selectedType) {
      return false;
    }

    if (selectedProductId && movement.productId !== selectedProductId) {
      return false;
    }

    if (selectedWarehouseId && movement.warehouseId !== selectedWarehouseId) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      movement.productName.toLowerCase().includes(normalizedSearch) ||
      (movement.variantSku ?? "").toLowerCase().includes(normalizedSearch) ||
      movement.warehouseName.toLowerCase().includes(normalizedSearch) ||
      (movement.notes ?? "").toLowerCase().includes(normalizedSearch) ||
      movement.createdByName.toLowerCase().includes(normalizedSearch)
    );
  });

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Icons.calendar className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No movement history</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Stock movements will appear here as you receive, dispatch, or adjust inventory
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Search product, notes, user..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All movement types</option>
          <option value="receive">Receive</option>
          <option value="dispatch">Dispatch</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <select
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All products</option>
          {uniqueProducts.map(([productId, productName]) => (
            <option key={productId} value={productId}>
              {productName}
            </option>
          ))}
        </select>
        <select
          value={selectedWarehouseId}
          onChange={(event) => setSelectedWarehouseId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All warehouses</option>
          {uniqueWarehouses.map(([warehouseId, warehouseName]) => (
            <option key={warehouseId} value={warehouseId}>
              {warehouseName}
            </option>
          ))}
        </select>
      </div>

      {filteredMovements.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No movements match your current filters.
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.calendar className="h-4 w-4" />
                      Date
                    </div>
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.package className="h-4 w-4" />
                      Product
                    </div>
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.warehouse className="h-4 w-4" />
                      Warehouse
                    </div>
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                    Delta
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Notes
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.user className="h-4 w-4" />
                      User
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle text-sm text-muted-foreground">
                      {formatDate(movement.createdAt)}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        {getMovementTypeIcon(movement.movementType)}
                        <span className="text-sm font-medium">
                          {getMovementTypeLabel(movement.movementType)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{movement.productName}</span>
                        {movement.variantSku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {movement.variantSku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{movement.warehouseName}</span>
                        <span className="text-xs text-muted-foreground">
                          {movement.warehouseCode}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <span
                        className={`font-mono font-semibold ${
                          movement.delta > 0
                            ? "text-green-600"
                            : movement.delta < 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {movement.delta > 0 ? "+" : ""}
                        {movement.delta}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-sm text-muted-foreground max-w-xs truncate">
                      {movement.notes || "—"}
                    </td>
                    <td className="p-4 align-middle text-sm">
                      {movement.createdByName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
