import { Elysia, t } from "elysia";
import { authPlugin } from "@/shared/infrastructure/auth/auth-plugin";
import {
  ProductNotFoundError,
  ProductService,
} from "../../application/services/product.service";
import { productRepository } from "../../infrastructure/repositories/product.repository";
import {
  createProductBodyDto,
  productListResponseDto,
  productResponseDto,
  updateProductBodyDto,
} from "../schemas/product.dto";

const productService = new ProductService(productRepository);

const querySchema = t.Object({
  search: t.Optional(t.String()),
});

const paramsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

const successResponse = t.Object({
  success: t.Literal(true),
});

const errorResponse = t.Object({
  error: t.String(),
});

export const productRoutes = new Elysia({ detail: { tags: ["Products"] } })
  .use(authPlugin)
  .get(
    "/",
    async ({ organization, query }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      return productService.getProducts({
        organizationId: organization.id,
        search: query.search,
      });
    },
    {
      auth: true,
      query: querySchema,
      response: {
        200: productListResponseDto,
      },
    },
  )
  .get(
    "/trash",
    async ({ organization }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      return productService.getDeletedProducts({
        organizationId: organization.id,
      });
    },
    {
      auth: true,
      response: {
        200: productListResponseDto,
      },
    },
  )
  .get(
    "/:id",
    async ({ organization, params, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      const product = await productService.getProductById(
        params.id,
        organization.id,
      );

      if (!product) {
        return status(404, { error: "Product not found" });
      }

      return product;
    },
    {
      auth: true,
      params: paramsSchema,
      response: {
        200: productResponseDto,
        404: errorResponse,
      },
    },
  )
  .post(
    "/",
    async ({ organization, body }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      return productService.createProduct({
        name: body.name,
        organizationId: organization.id,
      });
    },
    {
      auth: true,
      body: createProductBodyDto,
      response: {
        200: productResponseDto,
        400: errorResponse,
      },
    },
  )
  .put(
    "/:id",
    async ({ organization, params, body, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      try {
        return await productService.updateProduct({
          id: params.id,
          name: body.name,
          organizationId: organization.id,
        });
      } catch (error) {
        if (error instanceof ProductNotFoundError) {
          return status(404, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      params: paramsSchema,
      body: updateProductBodyDto,
      response: {
        200: productResponseDto,
        400: errorResponse,
        404: errorResponse,
      },
    },
  )
  .delete(
    "/:id",
    async ({ organization, params, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      const deleted = await productService.softDeleteProduct({
        id: params.id,
        organizationId: organization.id,
      });

      if (!deleted) {
        return status(404, { error: "Product not found" });
      }

      return { success: true as const };
    },
    {
      auth: true,
      params: paramsSchema,
      response: {
        200: successResponse,
        404: errorResponse,
      },
    },
  )
  .post(
    "/:id/restore",
    async ({ organization, params, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      const restored = await productService.restoreProduct({
        id: params.id,
        organizationId: organization.id,
      });

      if (!restored) {
        return status(404, { error: "Product not found" });
      }

      return { success: true as const };
    },
    {
      auth: true,
      params: paramsSchema,
      response: {
        200: successResponse,
        404: errorResponse,
      },
    },
  );
