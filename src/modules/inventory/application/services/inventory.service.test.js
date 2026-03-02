import { describe, expect, test } from "bun:test";
import {
  InventoryService,
  NegativeStockWarningError,
  NoChangeNeededError,
  ProductVariantNotFoundError,
} from "./inventory.service";

function createInventoryService(overrides = {}) {
  const calls = {
    create: [],
    createTransferPair: [],
  };

  const stockMovementRepository = {
    create: async (params) => {
      calls.create.push(params);
      return {
        id: "movement-1",
        productId: params.productId,
        productVariantId: params.productVariantId ?? null,
        warehouseId: params.warehouseId,
        movementType: params.movementType,
        delta: params.delta,
        referenceId: params.referenceId ?? null,
        notes: params.notes ?? null,
        createdBy: params.createdBy,
        organizationId: params.organizationId,
        createdAt: new Date(),
        deletedAt: null,
      };
    },
    createTransferPair: async (dispatch, receive) => {
      calls.createTransferPair.push({ dispatch, receive });
      return [
        {
          id: "dispatch-movement",
          productId: dispatch.productId,
          productVariantId: dispatch.productVariantId ?? null,
          warehouseId: dispatch.warehouseId,
          movementType: dispatch.movementType,
          delta: dispatch.delta,
          referenceId: dispatch.referenceId ?? null,
          notes: dispatch.notes ?? null,
          createdBy: dispatch.createdBy,
          organizationId: dispatch.organizationId,
          createdAt: new Date(),
          deletedAt: null,
        },
        {
          id: "receive-movement",
          productId: receive.productId,
          productVariantId: receive.productVariantId ?? null,
          warehouseId: receive.warehouseId,
          movementType: receive.movementType,
          delta: receive.delta,
          referenceId: receive.referenceId ?? null,
          notes: receive.notes ?? null,
          createdBy: receive.createdBy,
          organizationId: receive.organizationId,
          createdAt: new Date(),
          deletedAt: null,
        },
      ];
    },
    getStockLevels: async () => ({ data: [], total: 0 }),
    getMovementHistory: async () => ({ data: [], total: 0 }),
    getCurrentStock: async () => 10,
    getSelectableVariants: async () => [],
    ...overrides.stockMovementRepository,
  };

  const productRepository = {
    getById: async () => ({ id: "product-1", name: "Product 1" }),
    ...overrides.productRepository,
  };

  const warehouseRepository = {
    getById: async ({ id }) => ({ id, name: `Warehouse ${id}` }),
    ...overrides.warehouseRepository,
  };

  const variantRepository = {
    getVariantById: async () => ({ id: "variant-1", productId: "product-1", sku: "SKU-1" }),
    ...overrides.variantRepository,
  };

  return {
    service: new InventoryService(
      stockMovementRepository,
      productRepository,
      warehouseRepository,
      variantRepository
    ),
    calls,
  };
}

describe("InventoryService", () => {
  test("should_create_dispatch_movement_with_negative_delta_when_confirmed", async () => {
    const { service, calls } = createInventoryService({
      stockMovementRepository: {
        getCurrentStock: async () => 20,
      },
    });

    await service.dispatchStock(
      {
        productId: "product-1",
        productVariantId: null,
        warehouseId: "warehouse-1",
        quantity: 7,
        notes: "dispatch test",
        createdBy: "user-1",
        organizationId: "org-1",
      },
      true
    );

    expect(calls.create).toHaveLength(1);
    expect(calls.create[0]).toMatchObject({
      movementType: "dispatch",
      delta: -7,
      productId: "product-1",
      warehouseId: "warehouse-1",
    });
  });

  test("should_throw_negative_stock_warning_when_dispatch_is_not_confirmed", async () => {
    const { service } = createInventoryService({
      stockMovementRepository: {
        getCurrentStock: async () => 2,
      },
    });

    const dispatchPromise = service.dispatchStock(
      {
        productId: "product-1",
        productVariantId: null,
        warehouseId: "warehouse-1",
        quantity: 5,
        notes: null,
        createdBy: "user-1",
        organizationId: "org-1",
      },
      false
    );

    await expect(dispatchPromise).rejects.toBeInstanceOf(NegativeStockWarningError);
  });

  test("should_create_adjustment_movement_using_calculated_delta", async () => {
    const { service, calls } = createInventoryService({
      stockMovementRepository: {
        getCurrentStock: async () => 12,
      },
    });

    await service.adjustStock({
      productId: "product-1",
      productVariantId: null,
      warehouseId: "warehouse-1",
      newQuantity: 20,
      notes: "count correction",
      createdBy: "user-1",
      organizationId: "org-1",
    });

    expect(calls.create).toHaveLength(1);
    expect(calls.create[0]).toMatchObject({
      movementType: "adjustment",
      delta: 8,
    });
  });

  test("should_throw_no_change_needed_when_adjustment_quantity_matches_current_stock", async () => {
    const { service } = createInventoryService({
      stockMovementRepository: {
        getCurrentStock: async () => 15,
      },
    });

    const adjustPromise = service.adjustStock({
      productId: "product-1",
      productVariantId: null,
      warehouseId: "warehouse-1",
      newQuantity: 15,
      notes: null,
      createdBy: "user-1",
      organizationId: "org-1",
    });

    await expect(adjustPromise).rejects.toBeInstanceOf(NoChangeNeededError);
  });

  test("should_throw_variant_not_found_when_variant_does_not_belong_to_product", async () => {
    const { service } = createInventoryService({
      variantRepository: {
        getVariantById: async () => ({
          id: "variant-2",
          productId: "other-product",
          sku: "MISMATCH-SKU",
        }),
      },
    });

    const receivePromise = service.receiveStock({
      productId: "product-1",
      productVariantId: "variant-2",
      warehouseId: "warehouse-1",
      quantity: 3,
      notes: null,
      createdBy: "user-1",
      organizationId: "org-1",
    });

    await expect(receivePromise).rejects.toBeInstanceOf(ProductVariantNotFoundError);
  });

  test("should_create_transfer_pair_with_explicit_dispatch_and_receive_movements", async () => {
    const { service, calls } = createInventoryService({
      stockMovementRepository: {
        getCurrentStock: async () => 30,
      },
    });

    await service.transferStock(
      {
        productId: "product-1",
        productVariantId: "variant-1",
        sourceWarehouseId: "warehouse-a",
        destinationWarehouseId: "warehouse-b",
        quantity: 4,
        notes: "transfer test",
        createdBy: "user-1",
        organizationId: "org-1",
      },
      true
    );

    expect(calls.createTransferPair).toHaveLength(1);
    const { dispatch, receive } = calls.createTransferPair[0];
    expect(dispatch).toMatchObject({
      movementType: "dispatch",
      delta: -4,
      warehouseId: "warehouse-a",
    });
    expect(receive).toMatchObject({
      movementType: "receive",
      delta: 4,
      warehouseId: "warehouse-b",
    });
  });
});
