import type { IStockMovementRepository } from "../repositories/stock-movement.repository.interface";
import type { IProductRepository } from "@/modules/products/application/repositories/product.repository.interface";
import type { IWarehouseRepository } from "@/modules/warehouses/application/repositories/warehouse.repository.interface";
import type { IVariantRepository } from "@/modules/products/application/repositories/variant.repository.interface";
import type {
  GetStockLevelsParams,
  GetMovementHistoryParams,
  GetCurrentStockParams,
  InventoryVariantOption,
  ReceiveStockParams,
  DispatchStockParams,
  AdjustStockParams,
  StockMovementWithDetails,
  TransferStockParams,
} from "../types";
import type { StockLevelWithDetails } from "../../domain/types";
import type { StockMovement } from "../../domain/entities/stock-movement";

type ProductVariantLookupRepository = Pick<IVariantRepository, "getVariantById">;

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

export class NoChangeNeededError extends Error {
  constructor() {
    super("Stock is already at the specified quantity");
    this.name = "NoChangeNeededError";
  }
}

export class SameWarehouseError extends Error {
  constructor() {
    super("Source and destination warehouses must be different");
    this.name = "SameWarehouseError";
  }
}

export class InventoryService {
  constructor(
    private repository: IStockMovementRepository,
    private productRepository: IProductRepository,
    private warehouseRepository: IWarehouseRepository,
    private variantRepository: ProductVariantLookupRepository
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

  async getSelectableVariants(params: { organizationId: string; productId?: string }): Promise<InventoryVariantOption[]> {
    return this.repository.getSelectableVariants(params);
  }

  async receiveStock(params: ReceiveStockParams): Promise<StockMovement> {
    if (params.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    await this.validateProductWarehouseAndVariant({
      productId: params.productId,
      productVariantId: params.productVariantId,
      warehouseId: params.warehouseId,
      organizationId: params.organizationId,
    });

    return this.repository.create({
      productId: params.productId,
      productVariantId: params.productVariantId ?? null,
      warehouseId: params.warehouseId,
      movementType: "receive",
      delta: params.quantity,
      notes: params.notes ?? null,
      createdBy: params.createdBy,
      organizationId: params.organizationId,
    });
  }

  async dispatchStock(
    params: DispatchStockParams,
    confirmNegative: boolean = false,
  ): Promise<StockMovement> {
    if (params.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    await this.validateProductWarehouseAndVariant({
      productId: params.productId,
      productVariantId: params.productVariantId,
      warehouseId: params.warehouseId,
      organizationId: params.organizationId,
    });

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
      productId: params.productId,
      productVariantId: params.productVariantId ?? null,
      warehouseId: params.warehouseId,
      movementType: "dispatch",
      delta: -params.quantity,
      notes: params.notes ?? null,
      createdBy: params.createdBy,
      organizationId: params.organizationId,
    });
  }

  async adjustStock(params: AdjustStockParams): Promise<StockMovement> {
    if (params.newQuantity < 0) {
      throw new Error("New quantity must be 0 or greater");
    }

    await this.validateProductWarehouseAndVariant({
      productId: params.productId,
      productVariantId: params.productVariantId,
      warehouseId: params.warehouseId,
      organizationId: params.organizationId,
    });

    const currentStock = await this.repository.getCurrentStock({
      productId: params.productId,
      productVariantId: params.productVariantId ?? null,
      warehouseId: params.warehouseId,
      organizationId: params.organizationId,
    });

    const delta = params.newQuantity - currentStock;

    if (delta === 0) {
      throw new NoChangeNeededError();
    }

    return this.repository.create({
      productId: params.productId,
      productVariantId: params.productVariantId ?? null,
      warehouseId: params.warehouseId,
      movementType: "adjustment",
      delta,
      notes: params.notes ?? null,
      createdBy: params.createdBy,
      organizationId: params.organizationId,
    });
  }

  async transferStock(
    params: TransferStockParams,
    confirmNegative: boolean = false
  ): Promise<[StockMovement, StockMovement]> {
    if (params.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (params.sourceWarehouseId === params.destinationWarehouseId) {
      throw new SameWarehouseError();
    }

    await this.validateProductAndVariant({
      productId: params.productId,
      productVariantId: params.productVariantId,
      organizationId: params.organizationId,
    });

    const [sourceWarehouse, destinationWarehouse] = await Promise.all([
      this.warehouseRepository.getById({
        id: params.sourceWarehouseId,
        organizationId: params.organizationId,
      }),
      this.warehouseRepository.getById({
        id: params.destinationWarehouseId,
        organizationId: params.organizationId,
      }),
    ]);

    if (!sourceWarehouse || !destinationWarehouse) {
      throw new WarehouseNotFoundError();
    }

    const currentStockAtSource = await this.repository.getCurrentStock({
      productId: params.productId,
      productVariantId: params.productVariantId ?? null,
      warehouseId: params.sourceWarehouseId,
      organizationId: params.organizationId,
    });

    const resultingStock = currentStockAtSource - params.quantity;

    if (resultingStock < 0 && !confirmNegative) {
      throw new NegativeStockWarningError(currentStockAtSource, resultingStock);
    }

    return this.repository.createTransferPair(
      {
        productId: params.productId,
        productVariantId: params.productVariantId ?? null,
        warehouseId: params.sourceWarehouseId,
        movementType: "dispatch",
        delta: -params.quantity,
        notes: params.notes ?? null,
        createdBy: params.createdBy,
        organizationId: params.organizationId,
      },
      {
        productId: params.productId,
        productVariantId: params.productVariantId ?? null,
        warehouseId: params.destinationWarehouseId,
        movementType: "receive",
        delta: params.quantity,
        notes: params.notes ?? null,
        createdBy: params.createdBy,
        organizationId: params.organizationId,
      }
    );
  }

  private async validateProductAndVariant(params: {
    productId: string;
    productVariantId?: string | null;
    organizationId: string;
  }) {
    const product = await this.productRepository.getById({
      id: params.productId,
      organizationId: params.organizationId,
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    if (!params.productVariantId) {
      return;
    }

    const variant = await this.variantRepository.getVariantById({
      id: params.productVariantId,
      organizationId: params.organizationId,
    });

    if (!variant || variant.productId !== params.productId) {
      throw new ProductVariantNotFoundError();
    }
  }

  private async validateProductWarehouseAndVariant(params: {
    productId: string;
    productVariantId?: string | null;
    warehouseId: string;
    organizationId: string;
  }) {
    await this.validateProductAndVariant(params);

    const warehouse = await this.warehouseRepository.getById({
      id: params.warehouseId,
      organizationId: params.organizationId,
    });

    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }
  }
}
