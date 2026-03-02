import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
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
import type { IStockMovementRepository } from "@/modules/inventory/application/repositories/stock-movement.repository.interface";

interface StockAggregateRow {
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  currentStock: number;
}

interface StockDisplayItem {
  productId: string;
  productName: string;
  productVariantId: string | null;
  variantSku: string | null;
}

interface ActiveProductRow {
  id: string;
  name: string;
}

interface ActiveVariantRow {
  id: string;
  productId: string;
  sku: string;
}

interface ActiveWarehouseRow {
  id: string;
  name: string;
  code: string;
}

export class StockMovementRepository implements IStockMovementRepository {
  async create(params: CreateStockMovementParams): Promise<StockMovement> {
    const result = await db
      .insertInto("stockMovement")
      .values({
        productId: params.productId,
        productVariantId: params.productVariantId ?? null,
        warehouseId: params.warehouseId,
        movementType: params.movementType,
        delta: params.delta,
        referenceId: params.referenceId ?? null,
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
    dispatch: CreateStockMovementParams,
    receive: CreateStockMovementParams
  ): Promise<[StockMovement, StockMovement]> {
    const [dispatchMovement, receiveMovement] = await db
      .transaction()
      .execute(async (trx) => {
        const generatedReference = await trx
          .selectNoFrom((expressionBuilder) =>
            expressionBuilder.fn<string>("uuidv7", []).as("referenceId")
          )
          .executeTakeFirstOrThrow();

        const referenceId = dispatch.referenceId ?? receive.referenceId ?? generatedReference.referenceId;

        const dispatchResult = await trx
          .insertInto("stockMovement")
          .values({
            productId: dispatch.productId,
            productVariantId: dispatch.productVariantId ?? null,
            warehouseId: dispatch.warehouseId,
            movementType: dispatch.movementType,
            delta: dispatch.delta,
            referenceId,
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
            movementType: receive.movementType,
            delta: receive.delta,
            referenceId,
            notes: receive.notes ?? null,
            createdBy: receive.createdBy,
            organizationId: receive.organizationId,
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

    const [products, variants, warehouses, aggregates] = await Promise.all([
      this.getActiveProducts({ organizationId, productId }),
      this.getActiveVariants({ organizationId, productId }),
      this.getActiveWarehouses({ organizationId, warehouseId }),
      this.getStockAggregates({ organizationId, productId, warehouseId }),
    ]);

    const displayItems = this.buildDisplayItems(products, variants);
    const aggregateMap = new Map(
      aggregates.map((aggregate) => [
        this.getStockKey(aggregate.productId, aggregate.productVariantId, aggregate.warehouseId),
        aggregate.currentStock,
      ])
    );

    const expandedRows: StockLevelWithDetails[] = [];
    for (const item of displayItems) {
      for (const warehouse of warehouses) {
        const aggregateKey = this.getStockKey(item.productId, item.productVariantId, warehouse.id);
        expandedRows.push({
          productId: item.productId,
          productName: item.productName,
          productVariantId: item.productVariantId,
          variantSku: item.variantSku,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          warehouseCode: warehouse.code,
          currentStock: aggregateMap.get(aggregateKey) ?? 0,
        });
      }
    }

    const normalizedSearch = search?.trim().toLowerCase();
    const filteredRows = normalizedSearch
      ? expandedRows.filter((row) =>
          row.productName.toLowerCase().includes(normalizedSearch) ||
          (row.variantSku ?? "").toLowerCase().includes(normalizedSearch) ||
          row.warehouseName.toLowerCase().includes(normalizedSearch) ||
          row.warehouseCode.toLowerCase().includes(normalizedSearch)
        )
      : expandedRows;

    filteredRows.sort((a, b) => {
      const byProduct = a.productName.localeCompare(b.productName);
      if (byProduct !== 0) {
        return byProduct;
      }
      const byVariant = (a.variantSku ?? "").localeCompare(b.variantSku ?? "");
      if (byVariant !== 0) {
        return byVariant;
      }
      return a.warehouseName.localeCompare(b.warehouseName);
    });

    const total = filteredRows.length;
    const data = filteredRows.slice(offset, offset + limit);

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

    const data: StockMovementWithDetails[] = results.map((result) => ({
      id: result.id,
      productId: result.productId,
      productName: result.productName ?? "",
      productVariantId: result.productVariantId,
      variantSku: result.variantSku,
      warehouseId: result.warehouseId,
      warehouseName: result.warehouseName ?? "",
      warehouseCode: result.warehouseCode ?? "",
      movementType: result.movementType as "receive" | "dispatch" | "adjustment",
      delta: result.delta,
      referenceId: result.referenceId,
      notes: result.notes,
      createdBy: result.createdBy,
      createdByName: result.createdByName ?? "",
      organizationId: result.organizationId,
      createdAt: result.createdAt ?? new Date(),
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

  async getSelectableVariants(params: { organizationId: string; productId?: string }): Promise<InventoryVariantOption[]> {
    let query = db
      .selectFrom("productVariant")
      .select(["id", "productId", "sku"])
      .where("organizationId", "=", params.organizationId)
      .where("deletedAt", "is", null);

    if (params.productId) {
      query = query.where("productId", "=", params.productId);
    }

    const variants = await query.orderBy("sku", "asc").execute();
    return variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
    }));
  }

  private async getActiveProducts(params: { organizationId: string; productId?: string }): Promise<ActiveProductRow[]> {
    let query = db
      .selectFrom("product")
      .select(["id", "name"])
      .where("organizationId", "=", params.organizationId)
      .where("deletedAt", "is", null);

    if (params.productId) {
      query = query.where("id", "=", params.productId);
    }

    return query.execute();
  }

  private async getActiveVariants(params: { organizationId: string; productId?: string }): Promise<ActiveVariantRow[]> {
    let query = db
      .selectFrom("productVariant")
      .select(["id", "productId", "sku"])
      .where("organizationId", "=", params.organizationId)
      .where("deletedAt", "is", null);

    if (params.productId) {
      query = query.where("productId", "=", params.productId);
    }

    return query.execute();
  }

  private async getActiveWarehouses(params: { organizationId: string; warehouseId?: string }): Promise<ActiveWarehouseRow[]> {
    let query = db
      .selectFrom("warehouse")
      .select(["id", "name", "code"])
      .where("organizationId", "=", params.organizationId)
      .where("deletedAt", "is", null);

    if (params.warehouseId) {
      query = query.where("id", "=", params.warehouseId);
    }

    return query.execute();
  }

  private async getStockAggregates(params: {
    organizationId: string;
    productId?: string;
    warehouseId?: string;
  }): Promise<StockAggregateRow[]> {
    let query = db
      .selectFrom("stockMovement")
      .select([
        "productId",
        "productVariantId",
        "warehouseId",
        db.fn.coalesce(db.fn.sum("delta"), sql.lit(0)).as("currentStock"),
      ])
      .where("organizationId", "=", params.organizationId)
      .where("deletedAt", "is", null)
      .groupBy(["productId", "productVariantId", "warehouseId"]);

    if (params.productId) {
      query = query.where("productId", "=", params.productId);
    }

    if (params.warehouseId) {
      query = query.where("warehouseId", "=", params.warehouseId);
    }

    const rows = await query.execute();
    return rows.map((row) => ({
      productId: row.productId,
      productVariantId: row.productVariantId,
      warehouseId: row.warehouseId,
      currentStock: Number(row.currentStock ?? 0),
    }));
  }

  private buildDisplayItems(products: ActiveProductRow[], variants: ActiveVariantRow[]): StockDisplayItem[] {
    const variantsByProductId = new Map<string, ActiveVariantRow[]>();
    for (const variant of variants) {
      const list = variantsByProductId.get(variant.productId) ?? [];
      list.push(variant);
      variantsByProductId.set(variant.productId, list);
    }

    const displayItems: StockDisplayItem[] = [];

    for (const product of products) {
      const productVariants = variantsByProductId.get(product.id) ?? [];

      if (productVariants.length === 0) {
        displayItems.push({
          productId: product.id,
          productName: product.name,
          productVariantId: null,
          variantSku: null,
        });
        continue;
      }

      for (const variant of productVariants) {
        displayItems.push({
          productId: product.id,
          productName: product.name,
          productVariantId: variant.id,
          variantSku: variant.sku,
        });
      }
    }

    return displayItems;
  }

  private getStockKey(productId: string, productVariantId: string | null, warehouseId: string) {
    return `${productId}:${productVariantId ?? "null"}:${warehouseId}`;
  }
}

export const stockMovementRepository = new StockMovementRepository();
