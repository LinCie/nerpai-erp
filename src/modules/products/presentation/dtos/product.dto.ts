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

export const productListResponseDto = t.Array(productResponseDto);

export type ProductDto = typeof productDto.static;
export type CreateProductBodyDto = typeof createProductBodyDto.static;
export type UpdateProductBodyDto = typeof updateProductBodyDto.static;
export type ProductResponseDto = typeof productResponseDto.static;
