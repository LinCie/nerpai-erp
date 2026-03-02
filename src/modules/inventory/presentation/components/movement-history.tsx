"use client";

import { Calendar, ArrowUpRight, ArrowDownRight, Minus, Package, Warehouse, User } from "lucide-react";
import type { StockMovementWithDetails } from "../types";
import type { MovementType } from "../../domain/types";

interface MovementHistoryProps {
  movements: StockMovementWithDetails[];
}

function getMovementTypeIcon(type: MovementType) {
  switch (type) {
    case "receive":
      return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    case "dispatch":
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    case "adjustment":
      return <Minus className="h-4 w-4 text-orange-600" />;
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
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No movement history</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Stock movements will appear here as you receive, dispatch, or adjust inventory
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Type
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product
                </div>
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
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
                  <User className="h-4 w-4" />
                  User
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
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
  );
}
