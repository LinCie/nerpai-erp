import type { Warehouse } from "../../domain/entities/warehouse";

export interface IWarehouseRepository {
  findById(params: {
    id: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<Warehouse | null>;

  findByCode(params: {
    code: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<Warehouse | null>;

  findMany(params: {
    organizationId: string;
    search?: string;
    province?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Warehouse[]>;

  create(params: {
    name: string;
    code: string;
    streetAddress?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    country?: string;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    notes?: string | null;
    organizationId: string;
  }): Promise<Warehouse>;

  update(params: {
    id: string;
    name: string;
    streetAddress?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    country: string;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    notes?: string | null;
    organizationId: string;
  }): Promise<Warehouse | null>;

  softDelete(params: { id: string; organizationId: string }): Promise<boolean>;

  restore(params: { id: string; organizationId: string }): Promise<boolean>;
}
