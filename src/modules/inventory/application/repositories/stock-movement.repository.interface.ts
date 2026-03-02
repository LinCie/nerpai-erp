import type { StockMovement } from "@/modules/inventory/domain/entities/stock-movement";
import type { StockLevelWithDetails } from "@/modules/inventory/domain/types";
import type {
  CreateStockMovementParams,
  GetMovementHistoryParams,
  GetStockLevelsParams,
  GetCurrentStockParams,
  InventoryVariantOption,
  StockMovementWithDetails,
} from "@/modules/inventory/application/types";

export interface IStockMovementRepository {
  create(params: CreateStockMovementParams): Promise<StockMovement>;
  createTransferPair(
    dispatch: CreateStockMovementParams,
    receive: CreateStockMovementParams
  ): Promise<[StockMovement, StockMovement]>;
  getStockLevels(params: GetStockLevelsParams): Promise<{ data: StockLevelWithDetails[]; total: number }>;
  getMovementHistory(params: GetMovementHistoryParams): Promise<{ data: StockMovementWithDetails[]; total: number }>;
  getCurrentStock(params: GetCurrentStockParams): Promise<number>;
  getSelectableVariants(params: { organizationId: string; productId?: string }): Promise<InventoryVariantOption[]>;
}
