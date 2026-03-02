"use client";

import { Package, Tag } from "lucide-react";
import { Building2 } from "lucide-react";
import type { StockLevelWithDetails } from "../../domain/types";
import type { Product } from "@/modules/products/domain/entities/product";
import type { Warehouse } from "@/modules/warehouses/domain/entities/warehouse";
import { StockReceiveDialog } from "./stock-receive-dialog";
import { StockDispatchDialog } from "./stock-dispatch-dialog";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { StockTransferDialog } from "./stock-transfer-dialog";

interface InventoryDashboardProps {
  stockLevels: StockLevelWithDetails[];
  products: Product[];
  warehouses: Warehouse[];
}

export function InventoryDashboard({
  stockLevels,
  products,
  warehouses,
}: InventoryDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Stock Levels</h2>
          <p className="text-sm text-muted-foreground">
            {stockLevels.length === 0
              ? "No stock levels found"
              : `${stockLevels.length} items in stock`}
          </p>
        </div>
        <div className="flex gap-2">
          <StockAdjustDialog products={products} warehouses={warehouses} />
          <StockDispatchDialog products={products} warehouses={warehouses} />
          <StockTransferDialog products={products} warehouses={warehouses} />
          <StockReceiveDialog products={products} warehouses={warehouses} />
        </div>
      </div>

      {stockLevels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50" />
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
                      <Package className="h-4 w-4" />
                      Product
                    </div>
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Variant (SKU)
                    </div>
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Warehouse
                    </div>
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                    Current Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((stock) => (
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
