// src/modules/orders/domain/types/index.ts

/** Order status enum — constrained in DB via CHECK */
export type OrderStatus =
  | "unpaid"
  | "paid"
  | "process"
  | "sent"
  | "completed"
  | "return"
  | "cancelled";

/** Pipeline (non-terminal) statuses in display order */
export const PIPELINE_STATUSES: readonly OrderStatus[] = [
  "unpaid",
  "paid",
  "process",
  "sent",
  "completed",
] as const;

/** Terminal statuses */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  "return",
  "cancelled",
] as const;

/** State machine: valid transitions from each status */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  unpaid: ["paid", "cancelled"],
  paid: ["process", "cancelled"],
  process: ["sent", "cancelled"],
  sent: ["completed", "return"],
  completed: ["return"],
  return: [],
  cancelled: [],
} as const;

/** Check if a transition is valid */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** Check if a status is terminal */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[status].length === 0;
}

/** Display labels for statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  process: "Processing",
  sent: "Sent",
  completed: "Completed",
  return: "Returned",
  cancelled: "Cancelled",
};
