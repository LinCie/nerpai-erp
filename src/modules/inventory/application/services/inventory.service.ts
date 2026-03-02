import type { IStockMovementRepository } from "../repositories/stock-movement.repository.interface";
import type {
  GetStockLevelsParams,
  GetMovementHistoryParams,
  GetCurrentStockParams,
} from "../types";
import type { StockLevelWithDetails } from "../../domain/types";
import type { StockMovementWithDetails } from "../../presentation/types";

export class InventoryService {
  constructor(private repository: IStockMovementRepository) {}

  async getStockLevels(
    params: GetStockLevelsParams,
  ): Promise<{ data: StockLevelWithDetails[]; total: number }> {
    return this.repository.getStockLevels(params);
  }

  async getMovementHistory(
    params: GetMovementHistoryParams,
  ): Promise<{ data: StockMovementWithDetails[]; total: number }> {
    return this.repository.getMovementHistory(params);
  }

  async getCurrentStock(params: GetCurrentStockParams): Promise<number> {
    return this.repository.getCurrentStock(params);
  }
}
