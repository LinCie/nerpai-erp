"use client";

import Link from "next/link";
import { Warehouse, MapPin } from "lucide-react";
import type { Warehouse as WarehouseEntity } from "../../domain/entities/warehouse";

interface WarehouseListProps {
  warehouses: WarehouseEntity[];
}

export function WarehouseList({ warehouses }: WarehouseListProps) {
  if (warehouses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Name
                </div>
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Code
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  City
                </div>
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                Province
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((warehouse) => (
              <tr
                key={warehouse.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle">
                  <Link
                    href={`/warehouses/${warehouse.id}`}
                    className="font-medium hover:underline"
                  >
                    {warehouse.name}
                  </Link>
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {warehouse.code}
                </td>
                <td className="p-4 align-middle">
                  {warehouse.city || "—"}
                </td>
                <td className="p-4 align-middle">
                  {warehouse.province || "—"}
                </td>
                <td className="p-4 align-middle text-right">
                  <Link
                    href={`/warehouses/${warehouse.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}