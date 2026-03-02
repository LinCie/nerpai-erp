import type { MovementType } from "@/modules/inventory/domain/types";

export interface StockMovementWithDetails {
  id: string;
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantSku: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  movementType: MovementType;
  delta: number;
  referenceId: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  organizationId: string;
  createdAt: Date;
}
