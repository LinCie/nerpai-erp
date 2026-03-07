import { t } from "elysia";

export const productDto = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Product name must be between 1 and 255 characters",
  }),
});

export const createProductBodyDto = productDto;
export const updateProductBodyDto = productDto;

export const productResponseDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  organizationId: t.String({ format: "uuid" }),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  deletedAt: t.Nullable(t.Date()),
});

export const paginationMetadataDto = t.Object({
  totalItems: t.Number(),
  itemCount: t.Number(),
  itemsPerPage: t.Number(),
  totalPages: t.Number(),
  currentPage: t.Number(),
});

export const productListResponseDto = t.Object({
  data: t.Array(productResponseDto),
  metadata: paginationMetadataDto,
});

export type ProductDto = typeof productDto.static;
export type CreateProductBodyDto = typeof createProductBodyDto.static;
export type UpdateProductBodyDto = typeof updateProductBodyDto.static;
export type ProductResponseDto = typeof productResponseDto.static;
export type PaginationMetadataDto = typeof paginationMetadataDto.static;
export type ProductListResponseDto = typeof productListResponseDto.static;
