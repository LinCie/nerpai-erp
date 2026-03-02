export interface StockMovement {
  id: string;
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  movementType: "receive" | "dispatch" | "adjustment";
  delta: number;
  referenceId: string | null;
  notes: string | null;
  createdBy: string;
  organizationId: string;
  createdAt: Date;
  deletedAt: Date | null;
}
