import { t } from "elysia";

export const attributeDto = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Attribute name must be between 1 and 255 characters",
  }),
});

export const attributeOptionDto = t.Object({
  value: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Option value must be between 1 and 255 characters",
  }),
});

export const createAttributeBodyDto = attributeDto;
export const updateAttributeBodyDto = attributeDto;
export const createAttributeOptionBodyDto = attributeOptionDto;
export const updateAttributeOptionBodyDto = attributeOptionDto;

export const attributeOptionResponseDto = t.Object({
  id: t.String({ format: "uuid" }),
  value: t.String(),
  attributeId: t.String({ format: "uuid" }),
});

export const attributeResponseDto = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  organizationId: t.String({ format: "uuid" }),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const attributeWithOptionsResponseDto = t.Intersect([
  attributeResponseDto,
  t.Object({
    options: t.Array(attributeOptionResponseDto),
  }),
]);

export type AttributeDto = typeof attributeDto.static;
export type AttributeOptionDto = typeof attributeOptionDto.static;
export type CreateAttributeBodyDto = typeof createAttributeBodyDto.static;
export type UpdateAttributeBodyDto = typeof updateAttributeBodyDto.static;
export type CreateAttributeOptionBodyDto =
  typeof createAttributeOptionBodyDto.static;
export type UpdateAttributeOptionBodyDto =
  typeof updateAttributeOptionBodyDto.static;
export type AttributeOptionResponseDto =
  typeof attributeOptionResponseDto.static;
export type AttributeResponseDto = typeof attributeResponseDto.static;
export type AttributeWithOptionsResponseDto =
  typeof attributeWithOptionsResponseDto.static;
