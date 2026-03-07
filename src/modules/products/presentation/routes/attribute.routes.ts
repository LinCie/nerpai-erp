import { Elysia, t } from "elysia";
import { authPlugin } from "@/shared/infrastructure/auth/auth-plugin";
import {
  AttributeNotFoundError,
  AttributeOptionInUseError,
  AttributeOptionNotFoundError,
  AttributeService,
} from "../../application/services/attribute.service";
import { attributeRepository } from "../../infrastructure/repositories/attribute.repository";
import {
  attributeOptionResponseDto,
  attributeResponseDto,
  attributeWithOptionsResponseDto,
  createAttributeBodyDto,
  createAttributeOptionBodyDto,
  updateAttributeBodyDto,
  updateAttributeOptionBodyDto,
} from "../schemas/attribute.dto";

const attributeService = new AttributeService(attributeRepository);

const querySchema = t.Object({
  search: t.Optional(t.String()),
});

const paramsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

const optionParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
  optionId: t.String({ format: "uuid" }),
});

const successResponse = t.Object({
  success: t.Literal(true),
});

const errorResponse = t.Object({
  error: t.String(),
});

const attributeWithOptionsListResponseDto = t.Array(
  attributeWithOptionsResponseDto,
);

export const attributeRoutes = new Elysia({
  prefix: "/attributes",
  detail: { tags: ["Attributes"] },
})
  .use(authPlugin)
  .get(
    "/",
    async ({ organization, query }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      const attributes = await attributeService.getAttributesWithOptions({
        organizationId: organization.id,
      });

      const normalized = attributes.map(({ attribute, options }) => ({
        ...attribute,
        options: options.map((option) => ({
          id: option.id,
          value: option.value,
          attributeId: option.attributeId,
        })),
      }));

      if (!query.search) {
        return normalized;
      }

      const search = query.search.toLowerCase();
      return normalized.filter((attribute) =>
        attribute.name.toLowerCase().includes(search),
      );
    },
    {
      auth: true,
      query: querySchema,
      response: {
        200: attributeWithOptionsListResponseDto,
      },
    },
  )
  .get(
    "/:id",
    async ({ organization, params, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      const attribute = await attributeService.getAttributeById(
        params.id,
        organization.id,
      );

      if (!attribute) {
        return status(404, { error: "Attribute not found" });
      }

      const options = await attributeService.getAttributeOptions({
        attributeId: params.id,
        organizationId: organization.id,
      });

      return {
        ...attribute,
        options: options.map((option) => ({
          id: option.id,
          value: option.value,
          attributeId: option.attributeId,
        })),
      };
    },
    {
      auth: true,
      params: paramsSchema,
      response: {
        200: attributeWithOptionsResponseDto,
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

      return attributeService.createAttribute({
        name: body.name,
        organizationId: organization.id,
      });
    },
    {
      auth: true,
      body: createAttributeBodyDto,
      response: {
        200: attributeResponseDto,
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
        return await attributeService.updateAttribute({
          id: params.id,
          name: body.name,
          organizationId: organization.id,
        });
      } catch (error) {
        if (error instanceof AttributeNotFoundError) {
          return status(404, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      params: paramsSchema,
      body: updateAttributeBodyDto,
      response: {
        200: attributeResponseDto,
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

      const deleted = await attributeService.softDeleteAttribute({
        id: params.id,
        organizationId: organization.id,
      });

      if (!deleted) {
        return status(404, { error: "Attribute not found" });
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
    "/:id/options",
    async ({ organization, params, body, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      try {
        return await attributeService.createAttributeOption({
          attributeId: params.id,
          value: body.value,
          organizationId: organization.id,
        });
      } catch (error) {
        if (error instanceof AttributeNotFoundError) {
          return status(404, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      params: paramsSchema,
      body: createAttributeOptionBodyDto,
      response: {
        200: attributeOptionResponseDto,
        400: errorResponse,
        404: errorResponse,
      },
    },
  )
  .put(
    "/:id/options/:optionId",
    async ({ organization, params, body, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      try {
        return await attributeService.updateAttributeOption({
          id: params.optionId,
          value: body.value,
          organizationId: organization.id,
        });
      } catch (error) {
        if (error instanceof AttributeOptionNotFoundError) {
          return status(404, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      params: optionParamsSchema,
      body: updateAttributeOptionBodyDto,
      response: {
        200: attributeOptionResponseDto,
        400: errorResponse,
        404: errorResponse,
      },
    },
  )
  .delete(
    "/:id/options/:optionId",
    async ({ organization, params, status }) => {
      if (!organization) {
        throw new Error("Organization context is missing");
      }

      try {
        await attributeService.deleteAttributeOption({
          id: params.optionId,
          organizationId: organization.id,
        });
        return { success: true as const };
      } catch (error) {
        if (error instanceof AttributeOptionNotFoundError) {
          return status(404, { error: error.message });
        }
        if (error instanceof AttributeOptionInUseError) {
          return status(409, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      params: optionParamsSchema,
      response: {
        200: successResponse,
        404: errorResponse,
        409: errorResponse,
      },
    },
  );
