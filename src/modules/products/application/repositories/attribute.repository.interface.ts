import type { Attribute } from "../../domain/entities/attribute";
import type { AttributeOption } from "../../domain/entities/attribute-option";
import type { AttributeWithOptions } from "../../domain/types";

export interface IAttributeRepository {
  getMany(params: {
    organizationId: string;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<Attribute[]>;

  getById(params: {
    id: string;
    organizationId: string;
  }): Promise<Attribute | null>;

  getWithOptions(params: {
    organizationId: string;
    includeDeleted?: boolean;
  }): Promise<AttributeWithOptions[]>;

  create(params: {
    name: string;
    organizationId: string;
  }): Promise<Attribute>;

  update(params: {
    id: string;
    name: string;
    organizationId: string;
  }): Promise<Attribute | null>;

  softDelete(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean>;

  restore(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean>;

  getOptionsByAttribute(params: {
    attributeId: string;
    organizationId: string;
  }): Promise<AttributeOption[]>;

  getOptionById(params: {
    id: string;
    organizationId: string;
  }): Promise<AttributeOption | null>;

  createOption(params: {
    value: string;
    attributeId: string;
    organizationId: string;
  }): Promise<AttributeOption>;

  updateOption(params: {
    id: string;
    value: string;
    organizationId: string;
  }): Promise<AttributeOption | null>;

  softDeleteOption(params: {
    id: string;
    organizationId: string;
  }): Promise<boolean>;

  countVariantsUsingOption(params: {
    optionId: string;
    organizationId: string;
  }): Promise<number>;

  getOptionsByAttributeIds(params: {
    attributeIds: string[];
    organizationId: string;
  }): Promise<AttributeOption[]>;
}
