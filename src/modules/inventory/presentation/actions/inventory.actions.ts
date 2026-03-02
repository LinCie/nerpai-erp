"use server";

import { revalidatePath } from "next/cache";
import {
  ServerValidateError,
  createServerValidate,
} from "@tanstack/react-form-nextjs";
import { getSessionAndOrg } from "@/shared/presentation/auth/getSession";
import { buildServerFormErrorState } from "@/shared/presentation/library/utils";
import { stockMovementRepository } from "../../infrastructure/repositories/stock-movement.repository";
import { productRepository } from "@/modules/products/infrastructure/repositories/product.repository";
import { warehouseRepository } from "@/modules/warehouses/infrastructure/repositories/warehouse.repository";
import {
  InventoryService,
  ProductNotFoundError,
  WarehouseNotFoundError,
  ProductVariantNotFoundError,
  NegativeStockWarningError,
} from "../../application/services/inventory.service";
import type {
  GetStockLevelsParams,
  GetMovementHistoryParams,
  GetCurrentStockParams,
} from "../../application/types";
import { receiveStockFormOpts, dispatchStockFormOpts } from "../lib/form-options";

const inventoryService = new InventoryService(
  stockMovementRepository,
  productRepository,
  warehouseRepository
);

const validateReceiveStockForm = createServerValidate({
  ...receiveStockFormOpts,
  onServerValidate: () => {
    return undefined;
  },
});

const validateDispatchStockForm = createServerValidate({
  ...dispatchStockFormOpts,
  onServerValidate: () => {
    return undefined;
  },
});

export async function getStockLevels(params: Omit<GetStockLevelsParams, "organizationId">) {
  const { organizationId } = await getSessionAndOrg();

  return inventoryService.getStockLevels({
    ...params,
    organizationId,
  });
}

export async function getMovementHistory(params: Omit<GetMovementHistoryParams, "organizationId">) {
  const { organizationId } = await getSessionAndOrg();

  return inventoryService.getMovementHistory({
    ...params,
    organizationId,
  });
}

export async function getCurrentStock(params: Omit<GetCurrentStockParams, "organizationId">) {
  const { organizationId } = await getSessionAndOrg();

  return inventoryService.getCurrentStock({
    ...params,
    organizationId,
  });
}

export async function receiveStock(prev: unknown, formData: FormData) {
  try {
    const { session, organizationId } = await getSessionAndOrg();
    const userId = session.user.id;

    const validatedData = await validateReceiveStockForm(formData);

    await inventoryService.receiveStock({
      productId: validatedData.productId,
      productVariantId: validatedData.productVariantId || null,
      warehouseId: validatedData.warehouseId,
      quantity: validatedData.quantity,
      notes: validatedData.notes || null,
      createdBy: userId,
      organizationId,
    });

    revalidatePath("/inventory");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof ProductNotFoundError) {
      return buildServerFormErrorState(formData, "Product not found");
    }
    if (e instanceof WarehouseNotFoundError) {
      return buildServerFormErrorState(formData, "Warehouse not found");
    }
    if (e instanceof ProductVariantNotFoundError) {
      return buildServerFormErrorState(formData, "Product variant not found");
    }

    console.error("Error receiving stock:", e);
    throw new Error("Failed to receive stock. Please try again.");
  }
}

export async function dispatchStock(prev: unknown, formData: FormData) {
  try {
    const { session, organizationId } = await getSessionAndOrg();
    const userId = session.user.id;

    const validatedData = await validateDispatchStockForm(formData);

    await inventoryService.dispatchStock(
      {
        productId: validatedData.productId,
        productVariantId: validatedData.productVariantId || null,
        warehouseId: validatedData.warehouseId,
        quantity: validatedData.quantity,
        notes: validatedData.notes || null,
        createdBy: userId,
        organizationId,
      },
      validatedData.confirmNegative === "true",
    );

    revalidatePath("/inventory");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof ProductNotFoundError) {
      return buildServerFormErrorState(formData, "Product not found");
    }
    if (e instanceof WarehouseNotFoundError) {
      return buildServerFormErrorState(formData, "Warehouse not found");
    }
    if (e instanceof ProductVariantNotFoundError) {
      return buildServerFormErrorState(formData, "Product variant not found");
    }
    if (e instanceof NegativeStockWarningError) {
      return buildServerFormErrorState(
        formData,
        `NEGATIVE_STOCK_WARNING:${e.currentStock}:${e.resultingStock}`,
      );
    }

    console.error("Error dispatching stock:", e);
    throw new Error("Failed to dispatch stock. Please try again.");
  }
}
