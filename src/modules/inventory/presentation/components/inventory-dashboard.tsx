"use client";

import { useState } from "react";
import { Icons } from "@/shared/presentation/components/icons";
import { Input } from "@/shared/presentation/components/ui/input";
import type { StockLevelWithDetails } from "../../domain/types";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";
import type { InventoryVariantOption } from "../types";
import { StockReceiveDialog } from "./stock-receive-dialog";
import { StockDispatchDialog } from "./stock-dispatch-dialog";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { StockTransferDialog } from "./stock-transfer-dialog";

interface InventoryDashboardProps {
  stockLevels: StockLevelWithDetails[];
  products: Product[];
  warehouses: Warehouse[];
  variants: InventoryVariantOption[];
}

export function InventoryDashboard({
  stockLevels,
  products,
  warehouses,
  variants,
}: InventoryDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStockLevels = stockLevels.filter((stock) => {
    if (selectedProductId && stock.productId !== selectedProductId) {
      return false;
    }

    if (selectedWarehouseId && stock.warehouseId !== selectedWarehouseId) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      stock.productName.toLowerCase().includes(normalizedSearch) ||
      (stock.variantSku ?? "").toLowerCase().includes(normalizedSearch) ||
      stock.warehouseName.toLowerCase().includes(normalizedSearch) ||
      stock.warehouseCode.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Stock Levels</h2>
          <p className="text-sm text-muted-foreground">
            {filteredStockLevels.length === 0
              ? "No stock levels found"
              : `${filteredStockLevels.length} items in stock`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <StockAdjustDialog products={products} warehouses={warehouses} variants={variants} />
          <StockDispatchDialog products={products} warehouses={warehouses} variants={variants} />
          <StockTransferDialog products={products} warehouses={warehouses} variants={variants} />
          <StockReceiveDialog products={products} warehouses={warehouses} variants={variants} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search product, SKU, warehouse..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <select
          value={selectedWarehouseId}
          onChange={(event) => setSelectedWarehouseId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name} ({warehouse.code})
            </option>
          ))}
        </select>
      </div>

      {filteredStockLevels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Icons.package className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No stock levels found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Stock levels will appear here once you receive inventory
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.package className="h-4 w-4" />
                      Product
                    </div>
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.productTag className="h-4 w-4" />
                      Variant (SKU)
                    </div>
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icons.organization className="h-4 w-4" />
                      Warehouse
                    </div>
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                    Current Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStockLevels.map((stock) => (
                  <tr
                    key={`${stock.productId}-${stock.productVariantId}-${stock.warehouseId}`}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {stock.productName}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {stock.variantSku || "—"}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{stock.warehouseName}</span>
                        <span className="text-xs text-muted-foreground">
                          {stock.warehouseCode}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <span
                        className={`font-mono text-lg ${
                          stock.currentStock < 0
                            ? "text-destructive"
                            : stock.currentStock === 0
                              ? "text-muted-foreground"
                              : "text-foreground"
                        }`}
                      >
                        {stock.currentStock}
                      </span>
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
