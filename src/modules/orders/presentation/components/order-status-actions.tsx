"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/presentation/components/ui/alert-dialog";
import { Button } from "@/shared/presentation/components/ui/button";
import type { OrderStatus } from "../../domain/types";
import {
  canTransition,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  isTerminalStatus,
} from "../../domain/types";
import { transitionOrderStatus } from "../actions/order.actions";

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
  version: number;
}

export function OrderStatusActions({
  orderId,
  currentStatus,
  version,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in a terminal state
  if (isTerminalStatus(currentStatus)) {
    return null;
  }

  // Get the forward transition (the main pipeline flow)
  const getNextStatus = (): OrderStatus | null => {
    const transitions = ORDER_STATUS_TRANSITIONS[currentStatus];
    // Find the forward transition (not cancel/return)
    const forwardTransition = transitions.find(
      (t) => t !== "cancelled" && t !== "return"
    );
    return forwardTransition || null;
  };

  // Get valid cancel transition
  const canCancel = canTransition(currentStatus, "cancelled");

  // Get valid return transition
  const canReturn = canTransition(currentStatus, "return");

  const nextStatus = getNextStatus();

  const handleTransition = async (newStatus: OrderStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await transitionOrderStatus({
        orderId,
        newStatus,
        version,
      });

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to update order status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {error && (
        <div className="w-full text-sm text-red-600 mb-2">{error}</div>
      )}

      {/* Advance Button */}
      {nextStatus && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Advance to {ORDER_STATUS_LABELS[nextStatus]}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to advance this order to{" "}
                <strong>{ORDER_STATUS_LABELS[nextStatus]}</strong>?
                {nextStatus === "paid" && (
                  <span className="block mt-2 text-amber-600">
                    Note: Proof of payment will be required in a future update.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleTransition(nextStatus)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Processing..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isLoading}
            >
              Cancel Order
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this order? This action cannot be
                undone and the order will be marked as <strong>Cancelled</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Order</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleTransition("cancelled")}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Cancelling..." : "Yes, Cancel Order"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Return Button */}
      {canReturn && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Mark as Returned
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Return Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this order as{" "}
                <strong>Returned</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Order</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleTransition("return")}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? "Processing..." : "Yes, Mark as Returned"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
