export type MovementType = "receive" | "dispatch" | "adjustment";

export interface StockLevel {
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  currentStock: number;
}

export interface StockLevelWithDetails {
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantSku: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  currentStock: number;
}
