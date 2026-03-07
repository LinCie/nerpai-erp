import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
import type { Product } from "../../domain/entities/product";
import type { IProductRepository } from "../../application/repositories/product.repository.interface";

export class ProductRepository implements IProductRepository {
  async getMany({
    organizationId,
    search,
    includeDeleted = false,
    page = 1,
    limit = 10,
  }: {
    organizationId: string;
    search?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Product[]> {
    let query = db
      .selectFrom("product")
      .selectAll()
      .where("organizationId", "=", organizationId);

    if (includeDeleted) {
      query = query.where("deletedAt", "is not", null);
    } else {
      query = query.where("deletedAt", "is", null);
    }

    if (search) {
      query = query.where("name", "ilike", `%${search}%`);
    }

    query = query
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset((page - 1) * limit);

    return await query.execute();
  }

  async countMany({
    organizationId,
    search,
    includeDeleted = false,
  }: {
    organizationId: string;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<number> {
    let query = db
      .selectFrom("product")
      .select(db.fn.count<number>("id").as("count"))
      .where("organizationId", "=", organizationId);

    if (includeDeleted) {
      query = query.where("deletedAt", "is not", null);
    } else {
      query = query.where("deletedAt", "is", null);
    }

    if (search) {
      query = query.where("name", "ilike", `%${search}%`);
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async getById({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<Product | null> {
    const product = await db
      .selectFrom("product")
      .selectAll()
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    return product ?? null;
  }

  async create({
    name,
    organizationId,
  }: {
    name: string;
    organizationId: string;
  }): Promise<Product> {
    return await db
      .insertInto("product")
      .values({
        name,
        organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update({
    id,
    name,
    organizationId,
  }: {
    id: string;
    name: string;
    organizationId: string;
  }): Promise<Product | null> {
    const product = await db
      .updateTable("product")
      .set({
        name,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return product ?? null;
  }

  async softDelete({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("product")
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
      .updateTable("product")
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

export const productRepository = new ProductRepository();
