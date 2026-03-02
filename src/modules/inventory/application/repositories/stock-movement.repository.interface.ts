import type { StockMovement } from "@/modules/inventory/domain/entities/stock-movement";
import type { StockLevelWithDetails } from "@/modules/inventory/domain/types";
import type {
  GetMovementHistoryParams,
  GetStockLevelsParams,
  GetCurrentStockParams,
  ReceiveStockParams,
  DispatchStockParams,
  AdjustStockParams,
} from "@/modules/inventory/application/types";
import type { StockMovementWithDetails } from "@/modules/inventory/presentation/types";

export interface IStockMovementRepository {
  create(params: ReceiveStockParams | DispatchStockParams | AdjustStockParams): Promise<StockMovement>;
  createTransferPair(
    dispatch: Omit<DispatchStockParams, "confirmNegative"> & { referenceId: string },
    receive: Omit<ReceiveStockParams, "createdBy" | "organizationId"> & { referenceId: string }
  ): Promise<[StockMovement, StockMovement]>;
  getStockLevels(params: GetStockLevelsParams): Promise<{ data: StockLevelWithDetails[]; total: number }>;
  getMovementHistory(params: GetMovementHistoryParams): Promise<{ data: StockMovementWithDetails[]; total: number }>;
  getCurrentStock(params: GetCurrentStockParams): Promise<number>;
}
