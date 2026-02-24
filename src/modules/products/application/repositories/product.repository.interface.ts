import type { Product } from "../../domain/entities/product";

export interface IProductRepository {
  getMany(params: {
    organizationId: string;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<Product[]>;

  getById(params: {
    id: string;
    organizationId: string;
  }): Promise<Product | null>;

  create(params: {
    name: string;
    organizationId: string;
  }): Promise<Product>;

  update(params: {
    id: string;
    name: string;
    organizationId: string;
  }): Promise<Product>;

  softDelete(params: {
    id: string;
    organizationId: string;
  }): Promise<void>;

  restore(params: {
    id: string;
    organizationId: string;
  }): Promise<void>;
}
