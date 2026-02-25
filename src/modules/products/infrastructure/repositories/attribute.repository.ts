import { sql } from "kysely";
import { db } from "@/shared/infrastructure/persistence";
import type { Attribute } from "../../domain/entities/attribute";
import type { AttributeOption } from "../../domain/entities/attribute-option";
import type { AttributeWithOptions } from "../../domain/types";
import type { IAttributeRepository } from "../../application/repositories/attribute.repository.interface";

export class AttributeRepository implements IAttributeRepository {
  async getMany({
    organizationId,
    search,
    includeDeleted = false,
  }: {
    organizationId: string;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<Attribute[]> {
    let query = db
      .selectFrom("attribute")
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

    query = query.orderBy("createdAt", "desc");

    return await query.execute();
  }

  async getById({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<Attribute | null> {
    const attribute = await db
      .selectFrom("attribute")
      .selectAll()
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    return attribute ?? null;
  }

  async getWithOptions({
    organizationId,
    includeDeleted = false,
  }: {
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<AttributeWithOptions[]> {
    const attributes = await this.getMany({
      organizationId,
      includeDeleted,
    });

    if (attributes.length === 0) {
      return [];
    }

    const attributeIds = attributes.map((a) => a.id);

    let optionsQuery = db
      .selectFrom("attributeOption")
      .selectAll()
      .where("attributeId", "in", attributeIds)
      .where("organizationId", "=", organizationId);

    if (!includeDeleted) {
      optionsQuery = optionsQuery.where("deletedAt", "is", null);
    }

    const options = await optionsQuery.orderBy("createdAt", "asc").execute();

    const optionsByAttributeId = new Map<string, AttributeOption[]>();
    for (const option of options) {
      const existing = optionsByAttributeId.get(option.attributeId) ?? [];
      existing.push(option);
      optionsByAttributeId.set(option.attributeId, existing);
    }

    return attributes.map((attribute) => ({
      attribute,
      options: optionsByAttributeId.get(attribute.id) ?? [],
    }));
  }

  async create({
    name,
    organizationId,
  }: {
    name: string;
    organizationId: string;
  }): Promise<Attribute> {
    return await db
      .insertInto("attribute")
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
  }): Promise<Attribute | null> {
    const attribute = await db
      .updateTable("attribute")
      .set({
        name,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return attribute ?? null;
  }

  async softDelete({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("attribute")
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
      .updateTable("attribute")
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

  async getOptionsByAttribute({
    attributeId,
    organizationId,
  }: {
    attributeId: string;
    organizationId: string;
  }): Promise<AttributeOption[]> {
    return await db
      .selectFrom("attributeOption")
      .selectAll()
      .where("attributeId", "=", attributeId)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .orderBy("createdAt", "asc")
      .execute();
  }

  async getOptionById({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<AttributeOption | null> {
    const option = await db
      .selectFrom("attributeOption")
      .selectAll()
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    return option ?? null;
  }

  async createOption({
    value,
    attributeId,
    organizationId,
  }: {
    value: string;
    attributeId: string;
    organizationId: string;
  }): Promise<AttributeOption> {
    return await db
      .insertInto("attributeOption")
      .values({
        value,
        attributeId,
        organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateOption({
    id,
    value,
    organizationId,
  }: {
    id: string;
    value: string;
    organizationId: string;
  }): Promise<AttributeOption | null> {
    const option = await db
      .updateTable("attributeOption")
      .set({
        value,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where("id", "=", id)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .returningAll()
      .executeTakeFirst();

    return option ?? null;
  }

  async softDeleteOption({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    const result = await db
      .updateTable("attributeOption")
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

  async countVariantsUsingOption({
    optionId,
    organizationId,
  }: {
    optionId: string;
    organizationId: string;
  }): Promise<number> {
    const result = await db
      .selectFrom("variantOption")
      .innerJoin("productVariant", "productVariant.id", "variantOption.productVariantId")
      .where("variantOption.attributeOptionId", "=", optionId)
      .where("variantOption.organizationId", "=", organizationId)
      .where("productVariant.deletedAt", "is", null)
      .select((eb) => eb.fn.count<number>("variantOption.id").as("count"))
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async getOptionsByAttributeIds({
    attributeIds,
    organizationId,
  }: {
    attributeIds: string[];
    organizationId: string;
  }): Promise<AttributeOption[]> {
    if (attributeIds.length === 0) {
      return [];
    }

    return await db
      .selectFrom("attributeOption")
      .selectAll()
      .where("attributeId", "in", attributeIds)
      .where("organizationId", "=", organizationId)
      .where("deletedAt", "is", null)
      .orderBy("createdAt", "asc")
      .execute();
  }
}

export const attributeRepository = new AttributeRepository();
