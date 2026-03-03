"use client";

import { Badge } from "@/shared/presentation/components/ui/badge";
import type { OrderStatus } from "../../domain/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusColors: Record<OrderStatus, string> = {
  unpaid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  process: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  sent: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  return: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge className={statusColors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </Badge>
  );
}
