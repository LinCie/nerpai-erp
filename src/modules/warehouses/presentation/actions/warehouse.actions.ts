"use server";

import { revalidatePath } from "next/cache";
import {
  ServerValidateError,
  createServerValidate,
} from "@tanstack/react-form-nextjs";
import { warehouseRepository } from "../../infrastructure/repositories/warehouse.repository";
import {
  WarehouseNotFoundError,
  WarehouseCodeExistsError,
  WarehouseService,
} from "../../application/services/warehouse.service";
import {
  createWarehouseFormOptions,
  updateWarehouseFormOptions,
} from "../lib/form-options";
import { getSessionAndOrg } from "@/shared/presentation/auth/getSession";
import { buildServerFormErrorState } from "@/shared/presentation/library/utils";

const warehouseService = new WarehouseService(warehouseRepository);

const validateCreateWarehouseForm = createServerValidate({
  ...createWarehouseFormOptions,
  onServerValidate: () => {
    return undefined;
  },
});

const validateUpdateWarehouseForm = createServerValidate({
  ...updateWarehouseFormOptions,
  onServerValidate: () => {
    return undefined;
  },
});

export async function checkWarehouseCode(code: string) {
  try {
    const { organizationId } = await getSessionAndOrg();
    const existing = await warehouseRepository.findByCode({
      code,
      organizationId,
      includeDeleted: true,
    });
    return { available: !existing };
  } catch {
    return { available: true }; // Fallback
  }
}

export async function createWarehouse(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const validatedData = await validateCreateWarehouseForm(formData);

    await warehouseService.createWarehouse({
      organizationId,
      ...validatedData,
    });

    revalidatePath("/warehouses");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof WarehouseCodeExistsError) {
      return buildServerFormErrorState(
        formData,
        "Warehouse code already exists in your organization",
      );
    }
    // Check if it's PostgreSQL error 23505 (unique_violation)
    if (e && typeof e === "object" && "code" in e && e.code === "23505") {
      return buildServerFormErrorState(
        formData,
        "Warehouse code already exists in your organization",
      );
    }

    console.error("Error creating warehouse:", e);
    throw new Error("Failed to create warehouse. Please try again.");
  }
}

export async function updateWarehouse(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const id = typeof rawId === "string" ? rawId : "";
    if (!id) {
      return buildServerFormErrorState(formData, "Warehouse ID is required");
    }

    const validatedData = await validateUpdateWarehouseForm(formData);

    await warehouseService.updateWarehouse({
      id,
      organizationId,
      ...validatedData,
    });

    revalidatePath("/warehouses");
    revalidatePath(`/warehouses/${id}`);

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof WarehouseNotFoundError) {
      return buildServerFormErrorState(formData, e.message);
    }

    console.error("Error updating warehouse:", e);
    throw new Error("Failed to update warehouse. Please try again.");
  }
}

export async function softDeleteWarehouse(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const id = typeof rawId === "string" ? rawId : "";
    if (!id) {
      return { success: false, error: "Warehouse ID is required" };
    }

    const deleted = await warehouseService.softDeleteWarehouse({
      id,
      organizationId,
    });

    if (!deleted) {
      return { success: false, error: "Warehouse not found" };
    }

    revalidatePath("/warehouses");
    revalidatePath("/warehouses/trash");
    revalidatePath(`/warehouses/${id}`);

    return { success: true };
  } catch (e) {
    console.error("Error soft-deleting warehouse:", e);
    return {
      success: false,
      error: "Failed to delete warehouse. Please try again.",
    };
  }
}

export async function restoreWarehouse(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const id = typeof rawId === "string" ? rawId : "";
    if (!id) {
      return { success: false, error: "Warehouse ID is required" };
    }

    const restored = await warehouseService.restoreWarehouse({
      id,
      organizationId,
    });

    if (!restored) {
      return { success: false, error: "Warehouse not found" };
    }

    revalidatePath("/warehouses");
    revalidatePath("/warehouses/trash");
    revalidatePath(`/warehouses/${id}`);

    return { success: true };
  } catch (e) {
    console.error("Error restoring warehouse:", e);
    return {
      success: false,
      error: "Failed to restore warehouse. Please try again.",
    };
  }
}
