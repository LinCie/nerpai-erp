import type { MovementType } from "@/modules/inventory/domain/types";

export interface ReceiveStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  quantity: number;
  notes?: string | null;
  createdBy: string;
  organizationId: string;
}

export interface DispatchStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  quantity: number;
  notes?: string | null;
  confirmNegative?: boolean;
  createdBy: string;
  organizationId: string;
}

export interface AdjustStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  newQuantity: number;
  notes?: string | null;
  createdBy: string;
  organizationId: string;
}

export interface TransferStockParams {
  productId: string;
  productVariantId?: string | null;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  notes?: string | null;
  confirmNegative?: boolean;
  createdBy: string;
  organizationId: string;
}

export interface GetStockLevelsParams {
  organizationId: string;
  productId?: string;
  warehouseId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetMovementHistoryParams {
  organizationId: string;
  productId?: string;
  productVariantId?: string | null;
  warehouseId?: string;
  movementType?: MovementType;
  limit?: number;
  offset?: number;
}

export interface GetCurrentStockParams {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  organizationId: string;
}
