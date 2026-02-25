import type { IAttributeRepository } from "../repositories/attribute.repository.interface";
import type { Attribute } from "../../domain/entities/attribute";
import type { AttributeOption } from "../../domain/entities/attribute-option";
import type { AttributeWithOptions } from "../../domain/types";

export class AttributeNotFoundError extends Error {
  constructor(message = "Attribute not found") {
    super(message);
    this.name = "AttributeNotFoundError";
  }
}

export class AttributeOptionNotFoundError extends Error {
  constructor(message = "Attribute option not found") {
    super(message);
    this.name = "AttributeOptionNotFoundError";
  }
}

export class AttributeOptionInUseError extends Error {
  constructor(count: number) {
    super(`This option is used by ${count} variants. Remove those variants first.`);
    this.name = "AttributeOptionInUseError";
  }
}

export class AttributeService {
  constructor(private repository: IAttributeRepository) {}

  async getAttributes(params: {
    organizationId: string;
    search?: string;
  }): Promise<Attribute[]> {
    return this.repository.getMany(params);
  }

  async getAttributesWithOptions(params: {
    organizationId: string;
  }): Promise<AttributeWithOptions[]> {
    return this.repository.getWithOptions(params);
  }

  async getAttributeById(
    id: string,
    organizationId: string
  ): Promise<Attribute | null> {
    return this.repository.getById({ id, organizationId });
  }

  async createAttribute(params: {
    name: string;
    organizationId: string;
  }): Promise<Attribute> {
    return this.repository.create(params);
  }

  async updateAttribute(params: {
    id: string;
    name: string;
    organizationId: string;
  }): Promise<Attribute> {
    const attribute = await this.repository.update(params);
    if (!attribute) {
      throw new AttributeNotFoundError();
    }
    return attribute;
  }

  async softDeleteAttribute(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    return this.repository.softDelete(params);
  }

  async restoreAttribute(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    return this.repository.restore(params);
  }

  async getAttributeOptions(params: {
    attributeId: string;
    organizationId: string;
  }): Promise<AttributeOption[]> {
    const attribute = await this.repository.getById({
      id: params.attributeId,
      organizationId: params.organizationId,
    });

    if (!attribute) {
      throw new AttributeNotFoundError();
    }

    return this.repository.getOptionsByAttribute(params);
  }

  async createAttributeOption(params: {
    value: string;
    attributeId: string;
    organizationId: string;
  }): Promise<AttributeOption> {
    const attribute = await this.repository.getById({
      id: params.attributeId,
      organizationId: params.organizationId,
    });

    if (!attribute) {
      throw new AttributeNotFoundError();
    }

    return this.repository.createOption(params);
  }

  async updateAttributeOption(params: {
    id: string;
    value: string;
    organizationId: string;
  }): Promise<AttributeOption> {
    const option = await this.repository.updateOption(params);
    if (!option) {
      throw new AttributeOptionNotFoundError();
    }
    return option;
  }

  async deleteAttributeOption(params: {
    id: string;
    organizationId: string;
  }): Promise<{ success: boolean; variantCount?: number }> {
    const option = await this.repository.getOptionById(params);
    if (!option) {
      throw new AttributeOptionNotFoundError();
    }

    const variantCount = await this.repository.countVariantsUsingOption({
      optionId: params.id,
      organizationId: params.organizationId,
    });

    if (variantCount > 0) {
      throw new AttributeOptionInUseError(variantCount);
    }

    const deleted = await this.repository.softDeleteOption(params);
    return { success: deleted, variantCount: 0 };
  }
}
