import type { IWarehouseRepository } from "../repositories/warehouse.repository.interface";
import type {
  CreateWarehouseParams,
  UpdateWarehouseParams,
  SoftDeleteWarehouseParams,
  RestoreWarehouseParams,
  GetWarehousesParams,
  GetWarehouseParams,
} from "../types";
import type { Warehouse } from "../../domain/entities/warehouse";

export class WarehouseNotFoundError extends Error {
  constructor() {
    super("Warehouse not found");
    this.name = "WarehouseNotFoundError";
  }
}

export class WarehouseCodeExistsError extends Error {
  constructor() {
    super("Warehouse code already exists in your organization");
    this.name = "WarehouseCodeExistsError";
  }
}

/** Normalize optional text: trim and convert empty string to null */
function normalizeOptionalText(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class WarehouseService {
  constructor(private repository: IWarehouseRepository) {}

  async getWarehouses(params: GetWarehousesParams): Promise<Warehouse[]> {
    return this.repository.getMany(params);
  }

  async getWarehouseById(
    params: GetWarehouseParams,
  ): Promise<Warehouse | null> {
    return this.repository.getById(params);
  }

  /**
   * Create a new warehouse.
   * Validates code uniqueness including soft-deleted warehouses (FR-012).
   */
  async createWarehouse(params: CreateWarehouseParams): Promise<Warehouse> {
    // Check code uniqueness including soft-deleted warehouses (FR-012)
    const existing = await this.repository.getByCode({
      code: params.code,
      organizationId: params.organizationId,
      includeDeleted: true, // FR-012: block reuse even for deleted warehouses
    });

    if (existing) {
      throw new WarehouseCodeExistsError();
    }

    return this.repository.create({
      name: params.name.trim(),
      code: params.code.trim(),
      streetAddress: normalizeOptionalText(params.streetAddress),
      city: normalizeOptionalText(params.city),
      province: normalizeOptionalText(params.province),
      postalCode: normalizeOptionalText(params.postalCode),
      country: params.country?.trim() || "Indonesia",
      contactName: normalizeOptionalText(params.contactName),
      contactPhone: normalizeOptionalText(params.contactPhone),
      contactEmail: normalizeOptionalText(params.contactEmail),
      notes: normalizeOptionalText(params.notes),
      organizationId: params.organizationId,
    });
  }

  /**
   * Update an existing warehouse.
   * Code is intentionally excluded — immutable after creation (FR-018).
   */
  async updateWarehouse(params: UpdateWarehouseParams): Promise<Warehouse> {
    const updated = await this.repository.update({
      id: params.id,
      name: params.name.trim(),
      streetAddress: normalizeOptionalText(params.streetAddress),
      city: normalizeOptionalText(params.city),
      province: normalizeOptionalText(params.province),
      postalCode: normalizeOptionalText(params.postalCode),
      country: params.country?.trim() || "Indonesia",
      contactName: normalizeOptionalText(params.contactName),
      contactPhone: normalizeOptionalText(params.contactPhone),
      contactEmail: normalizeOptionalText(params.contactEmail),
      notes: normalizeOptionalText(params.notes),
      organizationId: params.organizationId,
    });

    if (!updated) {
      throw new WarehouseNotFoundError();
    }

    return updated;
  }

  async softDeleteWarehouse(
    params: SoftDeleteWarehouseParams,
  ): Promise<boolean> {
    return this.repository.softDelete(params);
  }

  async restoreWarehouse(params: RestoreWarehouseParams): Promise<boolean> {
    return this.repository.restore(params);
  }

  async getDeletedWarehouses(params: {
    organizationId: string;
  }): Promise<Warehouse[]> {
    return this.repository.getMany({
      organizationId: params.organizationId,
      includeDeleted: true,
    });
  }
}
