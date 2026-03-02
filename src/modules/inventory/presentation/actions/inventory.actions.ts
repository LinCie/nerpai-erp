"use server";

import { getSessionAndOrg } from "@/shared/presentation/auth/getSession";
import { stockMovementRepository } from "../../infrastructure/repositories/stock-movement.repository";
import { InventoryService } from "../../application/services/inventory.service";
import type { GetStockLevelsParams, GetMovementHistoryParams, GetCurrentStockParams } from "../../application/types";

const inventoryService = new InventoryService(stockMovementRepository);

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
