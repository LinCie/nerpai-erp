import type { IProductRepository } from "../repositories/product.repository.interface";
import type {
  CreateProductParams,
  UpdateProductParams,
  SoftDeleteProductParams,
  RestoreProductParams,
  GetProductsParams,
} from "../types";
import type { Product } from "../../domain/entities/product";

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
  }
}

export class ProductService {
  constructor(private repository: IProductRepository) {}

  async createProduct(params: CreateProductParams): Promise<Product> {
    return this.repository.create(params);
  }

  async getProducts(params: GetProductsParams): Promise<{
    data: Product[];
    metadata: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const { page = 1, limit = 10, ...restParams } = params;

    const [data, totalItems] = await Promise.all([
      this.repository.getMany({ ...restParams, page, limit }),
      this.repository.countMany({ ...restParams }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      metadata: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async getProductById(
    id: string,
    organizationId: string,
  ): Promise<Product | null> {
    return this.repository.getById({ id, organizationId });
  }

  async updateProduct(params: UpdateProductParams): Promise<Product> {
    const product = await this.repository.update(params);
    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }

  async softDeleteProduct(params: SoftDeleteProductParams): Promise<boolean> {
    return this.repository.softDelete(params);
  }

  async restoreProduct(params: RestoreProductParams): Promise<boolean> {
    return this.repository.restore(params);
  }

  async getDeletedProducts(params: {
    organizationId: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Product[];
    metadata: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const { page = 1, limit = 10, ...restParams } = params;

    const [data, totalItems] = await Promise.all([
      this.repository.getMany({
        ...restParams,
        includeDeleted: true,
        page,
        limit,
      }),
      this.repository.countMany({
        ...restParams,
        includeDeleted: true,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      metadata: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
