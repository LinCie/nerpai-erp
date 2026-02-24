import type { IProductRepository } from "../repositories/product.repository.interface";
import type {
  CreateProductParams,
  UpdateProductParams,
  SoftDeleteProductParams,
  RestoreProductParams,
  GetProductsParams,
} from "../types";
import type { Product } from "../../domain/entities/product";

export class ProductService {
  constructor(private repository: IProductRepository) {}

  async createProduct(params: CreateProductParams): Promise<Product> {
    return this.repository.create(params);
  }

  async getProducts(params: GetProductsParams): Promise<Product[]> {
    return this.repository.getMany(params);
  }

  async getProductById(
    id: string,
    organizationId: string
  ): Promise<Product | null> {
    return this.repository.getById({ id, organizationId });
  }

  async updateProduct(params: UpdateProductParams): Promise<Product> {
    return this.repository.update(params);
  }

  async softDeleteProduct(params: SoftDeleteProductParams): Promise<void> {
    return this.repository.softDelete(params);
  }

  async restoreProduct(params: RestoreProductParams): Promise<void> {
    return this.repository.restore(params);
  }

  async getDeletedProducts(params: { organizationId: string }): Promise<Product[]> {
    return this.repository.getMany({
      organizationId: params.organizationId,
      includeDeleted: true,
    });
  }
}
