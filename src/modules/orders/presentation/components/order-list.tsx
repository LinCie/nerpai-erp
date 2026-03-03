"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/shared/presentation/components/ui/input";
import { Icons } from "@/shared/presentation/components/icons";
import type { OrderListItem } from "../../application/types";
import type { OrderStatus } from "../../domain/types";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderListProps {
  orders: OrderListItem[];
  searchQuery: string;
  status?: OrderStatus;
  page: number;
  limit: number;
  total: number;
}

export function OrderList({
  orders,
  searchQuery,
  status,
  page,
  limit,
  total,
}: OrderListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    startTransition(() => {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set("search", value);
      } else {
        url.searchParams.delete("search");
      }
      url.searchParams.delete("page");
      router.push(url.pathname + url.search);
    });
  };

  const handleStatusChange = (value: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);
      if (value && value !== "all") {
        url.searchParams.set("status", value);
      } else {
        url.searchParams.delete("status");
      }
      url.searchParams.delete("page");
      router.push(url.pathname + url.search);
    });
  };

  const offset = (page - 1) * limit;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer name..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            disabled={isPending}
          />
        </div>
        <select
          value={status || "all"}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[180px]"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="process">Processing</option>
          <option value="sent">Sent</option>
          <option value="completed">Completed</option>
          <option value="return">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {orders.length > 0 ? (
        <>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">
                      Items
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.customerName}
                        </Link>
                      </td>
                      <td className="p-4 align-middle">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="p-4 align-middle text-right font-mono">
                        ${order.totalAmount}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {order.itemCount}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <Icons.eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} orders
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ""}${status ? `&status=${status}` : ""}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    Previous
                  </Link>
                )}
                {offset + limit < total && (
                  <Link
                    href={`?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ""}${status ? `&status=${status}` : ""}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery || status
              ? "Try adjusting your search or filter"
              : "Create your first order to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
