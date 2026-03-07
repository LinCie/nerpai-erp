import { Elysia } from "elysia";
import { z } from "zod";
import { authPlugin } from "@/shared/infrastructure/auth/auth-plugin";
import { VariantService } from "../../application/services/variant.service";
import { variantRepository } from "../../infrastructure/repositories/variant.repository";
import { productRepository } from "../../infrastructure/repositories/product.repository";
import { attributeRepository } from "../../infrastructure/repositories/attribute.repository";
import {
  assignAttributeBody,
  removeAttributeQuery,
  reorderAttributesBody,
  generateVariantsBody,
  updateVariantBody,
  toggleVariantActiveBody,
  checkSkuBody,
  variantResponse,
  generateVariantsResponse,
  removeAttributeResponse,
  removeAttributeConfirmationResponse,
  skuAvailabilityResponse,
  assignAttributeResponse,
} from "../schemas/variant.schema";

const variantService = new VariantService(
  variantRepository,
  productRepository,
  attributeRepository,
);

const successResponse = z.object({ success: z.literal(true) });
const errorResponse = z.object({ error: z.string() });
const combinationResponse = z.object({
  allCombinations: z.array(z.array(z.string())),
  existingCombinations: z.array(z.array(z.string())),
  newCombinations: z.array(z.array(z.string())),
});

export const variantRoutes = new Elysia({ detail: { tags: ["Variants"] } })
  .use(authPlugin)
  // Assign attribute to product
  .post(
    "/products/:productId/attributes",
    async ({ params, body, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      const result = await variantService.assignAttributeToProduct({
        productId: params.productId,
        attributeId: body.attributeId,
        organizationId: organization.id,
      });

      return { id: result.id, displayOrder: result.displayOrder };
    },
    {
      auth: true,
      body: assignAttributeBody,
      response: {
        200: assignAttributeResponse,
        400: errorResponse,
        404: errorResponse,
        409: errorResponse,
      },
    },
  )
  // Remove attribute from product
  .delete(
    "/products/:productId/attributes/:attributeId",
    async ({ params, query, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      const result = await variantService.removeAttributeFromProduct({
        productId: params.productId,
        attributeId: params.attributeId,
        organizationId: organization.id,
        confirmed: query.confirmed,
      });

      if (result.needsConfirmation) {
        return {
          needsConfirmation: true,
          affectedCount: result.affectedCount ?? 0,
          message: `This will deactivate ${result.affectedCount ?? 0} existing variants. Are you sure?`,
        };
      }

      return { deactivatedCount: result.deactivatedCount };
    },
    {
      auth: true,
      query: removeAttributeQuery,
      response: {
        200: z.union([
          removeAttributeResponse,
          removeAttributeConfirmationResponse,
        ]),
        400: errorResponse,
        404: errorResponse,
      },
    },
  )
  // Reorder product attributes
  .patch(
    "/products/:productId/attributes/reorder",
    async ({ params, body, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      await variantService.reorderProductAttributes({
        productId: params.productId,
        orderedAttributeIds: body.orderedAttributeIds,
        organizationId: organization.id,
      });

      return { success: true };
    },
    {
      auth: true,
      body: reorderAttributesBody,
      response: {
        200: successResponse,
        400: errorResponse,
        404: errorResponse,
      },
    },
  )
  // Generate variants
  .post(
    "/products/:productId/variants/generate",
    async ({ params, body, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      const result = await variantService.generateVariantsSelective({
        productId: params.productId,
        selections: body.selections,
        organizationId: organization.id,
        onlyNew: body.onlyNew ?? false,
      });

      return {
        created: result.created,
        variants: result.variants.map((v) => ({ id: v.id, sku: v.sku })),
        skipped: result.skipped,
      };
    },
    {
      auth: true,
      body: generateVariantsBody,
      response: {
        200: generateVariantsResponse,
        400: errorResponse,
        404: errorResponse,
      },
    },
  )
  // Update variant
  .patch(
    "/variants/:id",
    async ({ params, body, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      const updated = await variantService.updateVariant({
        id: params.id,
        sku: body.sku,
        price: body.price,
        organizationId: organization.id,
      });

      return {
        id: updated.id,
        productId: updated.productId,
        sku: updated.sku,
        price: parseFloat(updated.price),
        isActive: updated.isActive,
      };
    },
    {
      auth: true,
      body: updateVariantBody,
      response: {
        200: variantResponse,
        400: errorResponse,
        404: errorResponse,
        409: errorResponse,
      },
    },
  )
  // Toggle variant active
  .patch(
    "/variants/:id/toggle",
    async ({ params, body, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      await variantService.toggleVariantActive({
        id: params.id,
        isActive: body.isActive,
        organizationId: organization.id,
      });

      return { success: true };
    },
    {
      auth: true,
      body: toggleVariantActiveBody,
      response: {
        200: successResponse,
        404: errorResponse,
      },
    },
  )
  // Soft delete variant
  .delete(
    "/variants/:id",
    async ({ params, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      await variantService.softDeleteVariant({
        id: params.id,
        organizationId: organization.id,
      });

      return { success: true };
    },
    {
      auth: true,
      response: {
        200: successResponse,
        404: errorResponse,
      },
    },
  )
  // Get variant combinations
  .get(
    "/products/:productId/variant-combinations",
    async ({ params, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      const result = await variantService.getNewVariantCombinations({
        productId: params.productId,
        organizationId: organization.id,
      });

      return {
        allCombinations: result.allCombinations.map((c) => c.optionValues),
        existingCombinations: Array.from(result.existingCombinations).map((k) =>
          k.split("|"),
        ),
        newCombinations: result.newCombinations.map((c) => c.optionValues),
      };
    },
    {
      auth: true,
      response: {
        200: combinationResponse,
        404: errorResponse,
      },
    },
  )
  // Check SKU availability
  .post(
    "/variants/check-sku",
    async ({ body, organization }) => {
      if (!organization) throw new Error("Organization context is missing");

      const exists = await variantService.checkSkuExists({
        sku: body.sku,
        organizationId: organization.id,
        excludeVariantId: body.excludeVariantId,
      });

      return { available: !exists };
    },
    {
      auth: true,
      body: checkSkuBody,
      response: {
        200: skuAvailabilityResponse,
        400: errorResponse,
      },
    },
  );
