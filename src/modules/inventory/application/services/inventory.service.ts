import type { IStockMovementRepository } from "../repositories/stock-movement.repository.interface";
import type { IProductRepository } from "@/modules/products/application/repositories/product.repository.interface";
import type { IWarehouseRepository } from "@/modules/warehouses/application/repositories/warehouse.repository.interface";
import type {
  GetStockLevelsParams,
  GetMovementHistoryParams,
  GetCurrentStockParams,
  ReceiveStockParams,
  DispatchStockParams,
} from "../types";
import type { StockLevelWithDetails } from "../../domain/types";
import type { StockMovementWithDetails } from "../../presentation/types";
import type { StockMovement } from "../../domain/entities/stock-movement";

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
  }
}

export class WarehouseNotFoundError extends Error {
  constructor() {
    super("Warehouse not found");
    this.name = "WarehouseNotFoundError";
  }
}

export class ProductVariantNotFoundError extends Error {
  constructor() {
    super("Product variant not found");
    this.name = "ProductVariantNotFoundError";
  }
}

export class NegativeStockWarningError extends Error {
  public currentStock: number;
  public resultingStock: number;

  constructor(currentStock: number, resultingStock: number) {
    super(`NEGATIVE_STOCK_WARNING:${currentStock}:${resultingStock}`);
    this.name = "NegativeStockWarningError";
    this.currentStock = currentStock;
    this.resultingStock = resultingStock;
  }
}

export class InventoryService {
  constructor(
    private repository: IStockMovementRepository,
    private productRepository: IProductRepository,
    private warehouseRepository: IWarehouseRepository
  ) {}

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

  async receiveStock(params: ReceiveStockParams): Promise<StockMovement> {
    if (params.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const warehouse = await this.warehouseRepository.getById({
      id: params.warehouseId,
      organizationId: params.organizationId,
    });

    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }

    if (params.productVariantId) {
      const variant = await this.productRepository.getById({
        id: params.productVariantId,
        organizationId: params.organizationId,
      });

      if (!variant) {
        throw new ProductVariantNotFoundError();
      }
    }

    return this.repository.create(params);
  }

  async dispatchStock(
    params: DispatchStockParams,
    confirmNegative: boolean = false,
  ): Promise<StockMovement> {
    if (params.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const warehouse = await this.warehouseRepository.getById({
      id: params.warehouseId,
      organizationId: params.organizationId,
    });

    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }

    if (params.productVariantId) {
      const variant = await this.productRepository.getById({
        id: params.productVariantId,
        organizationId: params.organizationId,
      });

      if (!variant) {
        throw new ProductVariantNotFoundError();
      }
    }

    const currentStock = await this.repository.getCurrentStock({
      productId: params.productId,
      productVariantId: params.productVariantId ?? null,
      warehouseId: params.warehouseId,
      organizationId: params.organizationId,
    });

    const resultingStock = currentStock - params.quantity;

    if (resultingStock < 0 && !confirmNegative) {
      throw new NegativeStockWarningError(currentStock, resultingStock);
    }

    return this.repository.create({
      ...params,
      quantity: -params.quantity,
    });
  }
}
