import { Elysia } from "elysia";
import { authPlugin } from "@/shared/infrastructure/auth/auth-plugin";
import {
  WarehouseCodeExistsError,
  WarehouseNotFoundError,
  WarehouseService,
} from "../../application/services/warehouse.service";
import { warehouseRepository } from "../../infrastructure/repositories/warehouse.repository";
import {
  mutationSuccessResponseSchema,
  warehouseCodeAvailabilityResponseSchema,
  warehouseCodeCheckQuerySchema,
  warehouseCreateSchema,
  warehouseErrorResponseSchema,
  warehouseIdParamsSchema,
  warehouseListQuerySchema,
  warehouseListResponseSchema,
  warehouseResponseSchema,
  warehouseUpdateSchema,
} from "../schemas/warehouse.schema";

const warehouseService = new WarehouseService(warehouseRepository);

export const warehouseRoutes = new Elysia({ detail: { tags: ["Warehouses"] } })
  .use(authPlugin)
  .get(
    "/",
    async ({ organization, query, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      const offset = (query.page - 1) * query.limit;
      const [items, totalCount, provinces] = await Promise.all([
        warehouseService.getWarehouses({
          organizationId: organization.id,
          search: query.search,
          province: query.province,
          limit: query.limit,
          offset,
        }),
        warehouseRepository.count({
          organizationId: organization.id,
          search: query.search,
          province: query.province,
        }),
        warehouseRepository.getUniqueProvinces(organization.id),
      ]);

      return { items, totalCount, provinces };
    },
    {
      auth: true,
      query: warehouseListQuerySchema,
      response: {
        200: warehouseListResponseSchema,
        403: warehouseErrorResponseSchema,
      },
    },
  )
  .get(
    "/trash",
    async ({ organization, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      return warehouseService.getDeletedWarehouses({
        organizationId: organization.id,
      });
    },
    {
      auth: true,
      response: {
        200: warehouseResponseSchema.array(),
        403: warehouseErrorResponseSchema,
      },
    },
  )
  .get(
    "/:id",
    async ({ organization, params, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      const warehouse = await warehouseService.getWarehouseById({
        id: params.id,
        organizationId: organization.id,
      });

      if (!warehouse) {
        return status(404, { error: "Warehouse not found" });
      }

      return warehouse;
    },
    {
      auth: true,
      params: warehouseIdParamsSchema,
      response: {
        200: warehouseResponseSchema,
        403: warehouseErrorResponseSchema,
        404: warehouseErrorResponseSchema,
      },
    },
  )
  .get(
    "/check-code",
    async ({ organization, query, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      const existing = await warehouseRepository.getByCode({
        code: query.code,
        organizationId: organization.id,
        includeDeleted: true,
      });

      return { available: !existing };
    },
    {
      auth: true,
      query: warehouseCodeCheckQuerySchema,
      response: {
        200: warehouseCodeAvailabilityResponseSchema,
        403: warehouseErrorResponseSchema,
      },
    },
  )
  .post(
    "/",
    async ({ organization, body, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      try {
        return await warehouseService.createWarehouse({
          organizationId: organization.id,
          ...body,
        });
      } catch (error) {
        if (error instanceof WarehouseCodeExistsError) {
          return status(400, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      body: warehouseCreateSchema,
      response: {
        200: warehouseResponseSchema,
        400: warehouseErrorResponseSchema,
        403: warehouseErrorResponseSchema,
      },
    },
  )
  .put(
    "/:id",
    async ({ organization, params, body, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      try {
        return await warehouseService.updateWarehouse({
          id: params.id,
          organizationId: organization.id,
          ...body,
        });
      } catch (error) {
        if (error instanceof WarehouseNotFoundError) {
          return status(404, { error: error.message });
        }

        throw error;
      }
    },
    {
      auth: true,
      params: warehouseIdParamsSchema,
      body: warehouseUpdateSchema,
      response: {
        200: warehouseResponseSchema,
        403: warehouseErrorResponseSchema,
        404: warehouseErrorResponseSchema,
      },
    },
  )
  .delete(
    "/:id",
    async ({ organization, params, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      const deleted = await warehouseService.softDeleteWarehouse({
        id: params.id,
        organizationId: organization.id,
      });

      if (!deleted) {
        return status(404, { error: "Warehouse not found" });
      }

      return { success: true as const };
    },
    {
      auth: true,
      params: warehouseIdParamsSchema,
      response: {
        200: mutationSuccessResponseSchema,
        403: warehouseErrorResponseSchema,
        404: warehouseErrorResponseSchema,
      },
    },
  )
  .post(
    "/:id/restore",
    async ({ organization, params, status }) => {
      if (!organization) {
        return status(403, { error: "Organization context is missing" });
      }

      const restored = await warehouseService.restoreWarehouse({
        id: params.id,
        organizationId: organization.id,
      });

      if (!restored) {
        return status(404, { error: "Warehouse not found" });
      }

      return { success: true as const };
    },
    {
      auth: true,
      params: warehouseIdParamsSchema,
      response: {
        200: mutationSuccessResponseSchema,
        403: warehouseErrorResponseSchema,
        404: warehouseErrorResponseSchema,
      },
    },
  );
