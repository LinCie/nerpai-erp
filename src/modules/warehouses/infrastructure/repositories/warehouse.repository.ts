import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
import type { Warehouse } from "../../domain/entities/warehouse";
import type { IWarehouseRepository } from "../../application/repositories/warehouse.repository.interface";

export class WarehouseRepository implements IWarehouseRepository {
  async findById({
    id,
    organizationId,
    includeDeleted = false,
  }: {
    id: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<Warehouse | null> {
    let query = db
      .selectFrom("warehouse")
      .selectAll()
      .where("id", "=", id)
      .where("organizationId", "=", organizationId);

    if (!includeDeleted) {
      query = query.where("deletedAt", "is", null);
    }

    const warehouse = await query.executeTakeFirst();
    return warehouse ?? null;
  }

  async findByCode({
    code,
    organizationId,
    includeDeleted = false,
  }: {
    code: string;
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<Warehouse | null> {
    // Case-insensitive code lookup via LOWER(btrim(code))
    let query = db
      .selectFrom("warehouse")
      .selectAll()
      .where(sql`lower(btrim(code))`, "=", sql`lower(btrim(${code}))`)
      .where("organizationId", "=", organizationId);

    if (!includeDeleted) {
      query = query.where("deletedAt", "is", null);
    }

    const warehouse = await query.executeTakeFirst();
    return warehouse ?? null;
  }

  async findMany({
    organizationId,
    search,
    province,
    includeDeleted = false,
    limit = 50,
    offset = 0,
  }: {
    organizationId: string;
    search?: string;
    province?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Warehouse[]> {
    let query = db
      .selectFrom("warehouse")
      .selectAll()
      .where("organizationId", "=", organizationId);

    if (includeDeleted) {
      // Trash view: show ONLY deleted warehouses
      query = query.where("deletedAt", "is not", null);
    } else {
      query = query.where("deletedAt", "is", null);
    }

    if (search) {
      const pattern = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", pattern),
          eb("code", "ilike", pattern),
          eb("city", "ilike", pattern),
          eb("province", "ilike", pattern),
        ]),
      );
    }

    if (province) {
      query = query.where("province", "ilike", `%${province}%`);
    }

    query = query.orderBy("createdAt", "desc").limit(limit).offset(offset);

    return await query.execute();
  }

  async count({
    organizationId,
    search,
    province,
    includeDeleted = false,
  }: {
    organizationId: string;
    search?: string;
    province?: string;
    includeDeleted?: boolean;
  }): Promise<number> {
    let query = db
      .selectFrom("warehouse")
      .select(db.fn.countAll().as("count"))
      .where("organizationId", "=", organizationId);

    if (includeDeleted) {
      query = query.where("deletedAt", "is not", null);
    } else {
      query = query.where("deletedAt", "is", null);
    }

    if (search) {
      const pattern = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", pattern),
          eb("code", "ilike", pattern),
          eb("city", "ilike", pattern),
          eb("province", "ilike", pattern),
        ]),
      );
    }

    if (province) {
      query = query.where("province", "ilike", `%${province}%`);
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async getUniqueProvinces(organizationId: string): Promise<string[]> {
    const results = await db
      .selectFrom("warehouse")
      .select("province")
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .where("province", "is not", null)
      .distinct()
      .orderBy("province", "asc")
      .execute();

    return results
      .map((r) => r.province)
      .filter((p): p is string => p !== null);
  }

  async create({
    name,
    code,
    streetAddress,
    city,
    province,
    postalCode,
    country = "Indonesia",
    contactName,
    contactPhone,
    contactEmail,
    notes,
    organizationId,
  }: {
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
  }): Promise<Warehouse> {
    return await db
      .insertInto("warehouse")
      .values({
        name,
        code,
        streetAddress: streetAddress ?? null,
        city: city ?? null,
        province: province ?? null,
        postalCode: postalCode ?? null,
        country,
        contactName: contactName ?? null,
        contactPhone: contactPhone ?? null,
        contactEmail: contactEmail ?? null,
        notes: notes ?? null,
        organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update({
    id,
    name,
    streetAddress,
    city,
    province,
    postalCode,
    country,
    contactName,
    contactPhone,
    contactEmail,
    notes,
    organizationId,
  }: {
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
  }): Promise<Warehouse | null> {
    const warehouse = await db
      .updateTable("warehouse")
      .set({
        name,
        streetAddress: streetAddress ?? null,
        city: city ?? null,
        province: province ?? null,
        postalCode: postalCode ?? null,
        country,
        contactName: contactName ?? null,
        contactPhone: contactPhone ?? null,
        contactEmail: contactEmail ?? null,
        notes: notes ?? null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return warehouse ?? null;
  }

  async softDelete({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("warehouse")
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returning("id")
      .executeTakeFirst();

    return Boolean(result);
  }

  async restore({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("warehouse")
      .set({
        deletedAt: null,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is not", null)
      .returning("id")
      .executeTakeFirst();

    return Boolean(result);
  }
}

export const warehouseRepository = new WarehouseRepository();
