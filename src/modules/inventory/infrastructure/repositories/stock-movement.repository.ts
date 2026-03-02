import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
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
import type { IStockMovementRepository } from "@/modules/inventory/application/repositories/stock-movement.repository.interface";

export class StockMovementRepository implements IStockMovementRepository {
  async create(
    params: ReceiveStockParams | DispatchStockParams | AdjustStockParams
  ): Promise<StockMovement> {
    let movementType: "receive" | "dispatch" | "adjustment";
    let delta: number;

    if ("quantity" in params) {
      if ("confirmNegative" in params) {
        movementType = "dispatch";
        delta = -params.quantity;
      } else {
        movementType = "receive";
        delta = params.quantity;
      }
    } else {
      const currentStock = await this.getCurrentStock({
        productId: params.productId,
        productVariantId: params.productVariantId,
        warehouseId: params.warehouseId,
        organizationId: params.organizationId,
      });
      movementType = "adjustment";
      delta = params.newQuantity - currentStock;
    }

    const result = await db
      .insertInto("stockMovement")
      .values({
        productId: params.productId,
        productVariantId: params.productVariantId ?? null,
        warehouseId: params.warehouseId,
        movementType,
        delta,
        notes: params.notes ?? null,
        createdBy: params.createdBy,
        organizationId: params.organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      ...result,
      movementType: result.movementType as "receive" | "dispatch" | "adjustment",
      createdAt: result.createdAt ?? new Date(),
    };
  }

  async createTransferPair(
    dispatch: Omit<DispatchStockParams, "confirmNegative"> & { referenceId: string },
    receive: Omit<ReceiveStockParams, "createdBy" | "organizationId"> & { referenceId: string }
  ): Promise<[StockMovement, StockMovement]> {
    const [dispatchMovement, receiveMovement] = await db
      .transaction()
      .execute(async (trx) => {
        const dispatchResult = await trx
          .insertInto("stockMovement")
          .values({
            productId: dispatch.productId,
            productVariantId: dispatch.productVariantId ?? null,
            warehouseId: dispatch.warehouseId,
            movementType: "dispatch",
            delta: -dispatch.quantity,
            referenceId: dispatch.referenceId,
            notes: dispatch.notes ?? null,
            createdBy: dispatch.createdBy,
            organizationId: dispatch.organizationId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        const receiveResult = await trx
          .insertInto("stockMovement")
          .values({
            productId: receive.productId,
            productVariantId: receive.productVariantId ?? null,
            warehouseId: receive.warehouseId,
            movementType: "receive",
            delta: receive.quantity,
            referenceId: receive.referenceId,
            notes: receive.notes ?? null,
            createdBy: dispatch.createdBy,
            organizationId: dispatch.organizationId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        return [dispatchResult, receiveResult];
      });

    return [
      {
        ...dispatchMovement,
        movementType: dispatchMovement.movementType as "receive" | "dispatch" | "adjustment",
        createdAt: dispatchMovement.createdAt ?? new Date(),
      },
      {
        ...receiveMovement,
        movementType: receiveMovement.movementType as "receive" | "dispatch" | "adjustment",
        createdAt: receiveMovement.createdAt ?? new Date(),
      },
    ];
  }

  async getStockLevels(params: GetStockLevelsParams): Promise<{ data: StockLevelWithDetails[]; total: number }> {
    const { organizationId, productId, warehouseId, search, limit = 50, offset = 0 } = params;

    let query = db
      .selectFrom("stockMovement")
      .innerJoin("product", "product.id", "stockMovement.productId")
      .innerJoin("warehouse", "warehouse.id", "stockMovement.warehouseId")
      .leftJoin("productVariant", "productVariant.id", "stockMovement.productVariantId")
      .select([
        "stockMovement.productId",
        "product.name as productName",
        "stockMovement.productVariantId",
        "productVariant.sku as variantSku",
        "stockMovement.warehouseId",
        "warehouse.name as warehouseName",
        "warehouse.code as warehouseCode",
        db.fn.coalesce(db.fn.sum("stockMovement.delta"), sql.lit(0)).as("currentStock"),
      ])
      .where("stockMovement.organizationId", "=", organizationId)
      .where("stockMovement.deletedAt", "is", null)
      .where("product.deletedAt", "is", null)
      .where("warehouse.deletedAt", "is", null)
      .groupBy([
        "stockMovement.productId",
        "product.name",
        "stockMovement.productVariantId",
        "productVariant.sku",
        "stockMovement.warehouseId",
        "warehouse.name",
        "warehouse.code",
      ]);

    if (productId) {
      query = query.where("stockMovement.productId", "=", productId);
    }

    if (warehouseId) {
      query = query.where("stockMovement.warehouseId", "=", warehouseId);
    }

    if (search) {
      const pattern = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("product.name", "ilike", pattern),
          eb("productVariant.sku", "ilike", pattern),
          eb("warehouse.name", "ilike", pattern),
          eb("warehouse.code", "ilike", pattern),
        ])
      );
    }

    const countQuery = db
      .selectFrom(() => query.as("sub"))
      .select(db.fn.countAll().as("count"));

    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const dataQuery = query.orderBy("productName").limit(limit).offset(offset);
    const results = await dataQuery.execute();

    const data: StockLevelWithDetails[] = results.map((r) => ({
      productId: r.productId,
      productName: r.productName ?? "",
      productVariantId: r.productVariantId,
      variantSku: r.variantSku,
      warehouseId: r.warehouseId,
      warehouseName: r.warehouseName ?? "",
      warehouseCode: r.warehouseCode ?? "",
      currentStock: Number(r.currentStock ?? 0),
    }));

    return { data, total };
  }

  async getMovementHistory(params: GetMovementHistoryParams): Promise<{ data: StockMovementWithDetails[]; total: number }> {
    const {
      organizationId,
      productId,
      productVariantId,
      warehouseId,
      movementType,
      limit = 50,
      offset = 0,
    } = params;

    let query = db
      .selectFrom("stockMovement")
      .innerJoin("product", "product.id", "stockMovement.productId")
      .innerJoin("warehouse", "warehouse.id", "stockMovement.warehouseId")
      .innerJoin("user", "user.id", "stockMovement.createdBy")
      .leftJoin("productVariant", "productVariant.id", "stockMovement.productVariantId")
      .select([
        "stockMovement.id",
        "stockMovement.productId",
        "product.name as productName",
        "stockMovement.productVariantId",
        "productVariant.sku as variantSku",
        "stockMovement.warehouseId",
        "warehouse.name as warehouseName",
        "warehouse.code as warehouseCode",
        "stockMovement.movementType",
        "stockMovement.delta",
        "stockMovement.referenceId",
        "stockMovement.notes",
        "stockMovement.createdBy",
        "user.name as createdByName",
        "stockMovement.organizationId",
        "stockMovement.createdAt",
      ])
      .where("stockMovement.organizationId", "=", organizationId)
      .where("stockMovement.deletedAt", "is", null)
      .where("product.deletedAt", "is", null)
      .where("warehouse.deletedAt", "is", null);

    if (productId) {
      query = query.where("stockMovement.productId", "=", productId);
    }

    if (productVariantId !== undefined) {
      if (productVariantId === null) {
        query = query.where("stockMovement.productVariantId", "is", null);
      } else {
        query = query.where("stockMovement.productVariantId", "=", productVariantId);
      }
    }

    if (warehouseId) {
      query = query.where("stockMovement.warehouseId", "=", warehouseId);
    }

    if (movementType) {
      query = query.where("stockMovement.movementType", "=", movementType);
    }

    const countQuery = db
      .selectFrom(() => query.as("sub"))
      .select(db.fn.countAll().as("count"));

    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const dataQuery = query.orderBy("stockMovement.createdAt", "desc").limit(limit).offset(offset);
    const results = await dataQuery.execute();

    const data: StockMovementWithDetails[] = results.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName ?? "",
      productVariantId: r.productVariantId,
      variantSku: r.variantSku,
      warehouseId: r.warehouseId,
      warehouseName: r.warehouseName ?? "",
      warehouseCode: r.warehouseCode ?? "",
      movementType: r.movementType as "receive" | "dispatch" | "adjustment",
      delta: r.delta,
      referenceId: r.referenceId,
      notes: r.notes,
      createdBy: r.createdBy,
      createdByName: r.createdByName ?? "",
      organizationId: r.organizationId,
      createdAt: r.createdAt ?? new Date(),
    }));

    return { data, total };
  }

  async getCurrentStock(params: GetCurrentStockParams): Promise<number> {
    const { productId, productVariantId, warehouseId, organizationId } = params;

    let query = db
      .selectFrom("stockMovement")
      .select([db.fn.coalesce(db.fn.sum("delta"), sql.lit(0)).as("currentStock")])
      .where("productId", "=", productId)
      .where("warehouseId", "=", warehouseId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null);

    if (productVariantId === null || productVariantId === undefined) {
      query = query.where("productVariantId", "is", null);
    } else {
      query = query.where("productVariantId", "=", productVariantId);
    }

    const result = await query.executeTakeFirst();
    return Number(result?.currentStock ?? 0);
  }
}

export const stockMovementRepository = new StockMovementRepository();
