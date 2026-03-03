"use client";

import { History, ArrowRight, Circle } from "lucide-react";
import type { OrderStatusHistoryEntry } from "../../application/types";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderStatusHistoryProps {
  history: OrderStatusHistoryEntry[];
}

export function OrderStatusHistory({ history }: OrderStatusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No status history available.
      </div>
    );
  }

  // Sort by created date ascending (oldest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Status History</h4>
      </div>

      <div className="relative border-l-2 border-gray-200 pl-4 space-y-4">
        {sortedHistory.map((entry) => (
          <div key={entry.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[21px] top-1">
              {entry.previousStatus === null ? (
                <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
              ) : (
                <div className="h-3 w-3 rounded-full bg-gray-300" />
              )}
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.previousStatus === null ? (
                  <span className="text-sm text-muted-foreground">
                    Order created as
                  </span>
                ) : (
                  <>
                    <OrderStatusBadge status={entry.previousStatus} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <OrderStatusBadge status={entry.newStatus} />
              </div>

              <div className="text-xs text-muted-foreground">
                <span>{entry.changedByName}</span>
                <span className="mx-1">•</span>
                <time dateTime={entry.createdAt.toISOString()}>
                  {new Date(entry.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
