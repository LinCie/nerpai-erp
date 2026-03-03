"use client";

import { Icons } from "@/shared/presentation/components/icons";
import type { OrderStatus } from "../../domain/types";
import {
  PIPELINE_STATUSES,
  ORDER_STATUS_LABELS,
  isTerminalStatus,
} from "../../domain/types";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
}

export function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  // For terminal states, show badge instead of stepper
  if (isTerminalStatus(currentStatus)) {
    return <OrderStatusBadge status={currentStatus} />;
  }

  const currentIndex = PIPELINE_STATUSES.indexOf(currentStatus);

  return (
    <nav aria-label="Order progress">
      <ol className="flex items-center w-full">
        {PIPELINE_STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={status}
              className={`flex items-center ${
                index < PIPELINE_STATUSES.length - 1 ? "flex-1" : ""
              }`}
            >
              {/* Step circle and label container */}
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "bg-green-600 border-green-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Icons.check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-medium">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    isCompleted
                      ? "text-green-600"
                      : isCurrent
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {ORDER_STATUS_LABELS[status]}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < PIPELINE_STATUSES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors ${
                    isCompleted ? "bg-green-600" : "bg-gray-300"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
